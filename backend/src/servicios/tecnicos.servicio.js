import { supabase } from '../config/supabase.js';
import { contarObservacionesDe, controlarNombreLibre, crearUsuarioDePersona, cuentaDe } from './usuarios.servicio.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';
import { normalizarTelefono, validarTelefono } from '../utiles/validaciones.js';

const DISPONIBILIDADES_VALIDAS = ['Disponible', 'No disponible'];

const COLUMNAS_CON_ESPECIALIDADES = `*,
  tecnico_especialidad (
    especialidad_id,
    especialidad (
      especialidad_nom
    )
  ),
  usuario ( usuario_id, activo )
`;

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}


function mapearTecnico(fila) {
  return {
    legajo: fila.tecnico_legajo,
    nombre: fila.tecnico_nom_ape,
    apellido: '', // El nuevo esquema fusiono nombre y apellido
    telefono: fila.tecnico_tel,
    disponibilidad: fila.tecnico_disponibilidad ? 'Disponible' : 'No disponible',
    especialidades: (fila.tecnico_especialidad ?? []).map((relacion) => ({
      idEspecialidad: relacion.especialidad_id,
      nombre: relacion.especialidad ? relacion.especialidad.especialidad_nom : '(especialidad eliminada)',
    })),
    ...cuentaDe(fila),
  };
}

/** Valida y normaliza los datos personales. No valida el legajo: eso lo hace `crear`, que es el unico que lo puede tocar. */
function validarDatos(datos) {
  // Ahora el front puede seguir mandando nombre y apellido por separado, pero los juntamos
  const nombre = limpiar(datos.nombre) || '';
  const apellido = limpiar(datos.apellido) || '';
  const nombreCompleto = (nombre + ' ' + apellido).trim();
  const disponibilidad = limpiar(datos.disponibilidad) ?? 'Disponible';
  const especialidades = Array.isArray(datos.especialidades)
    ? [...new Set(datos.especialidades.map(Number).filter(Number.isInteger))]
    : [];

  if (!nombreCompleto) throw datoInvalido('El nombre completo es obligatorio.');
  if (!DISPONIBILIDADES_VALIDAS.includes(disponibilidad)) {
    throw datoInvalido('La disponibilidad tiene que ser "Disponible" o "No disponible".');
  }
  if (especialidades.length === 0) {
    throw datoInvalido('Hay que seleccionar al menos una especialidad.');
  }

  // El telefono sigue las reglas de utiles/validaciones.js, las mismas que la pantalla.
  const problemaTelefono = validarTelefono(datos.telefono);
  if (problemaTelefono) throw datoInvalido(problemaTelefono);

  const telefono = normalizarTelefono(datos.telefono);

  return { nombreCompleto, telefono, disponibilidad, especialidades };
}

/** Corta el alta/edicion si alguna especialidad elegida no existe en la tabla. */
async function validarEspecialidadesExisten(idsEspecialidad) {
  const { data, error } = await supabase.from('especialidad').select('especialidad_id').in('especialidad_id', idsEspecialidad);
  if (error) throw new Error(error.message);

  if (!data || data.length !== idsEspecialidad.length) {
    throw datoInvalido('Alguna de las especialidades seleccionadas no existe.');
  }
}

/** Reemplaza por completo las especialidades de un tecnico (se usa en alta y en edicion). */
async function asignarEspecialidades(legajo, idsEspecialidad) {
  const { error: errorBorrado } = await supabase.from('tecnico_especialidad').delete().eq('tecnico_legajo', legajo);
  if (errorBorrado) throw new Error(errorBorrado.message);

  const filas = idsEspecialidad.map((idEspecialidad) => ({
    tecnico_legajo: legajo,
    especialidad_id: idEspecialidad,
  }));

  const { error } = await supabase.from('tecnico_especialidad').insert(filas);
  if (error) throw new Error(error.message);
}

export async function obtenerTodos({ especialidad_id, disponibilidad } = {}) {
  let query = supabase.from('tecnico').select(COLUMNAS_CON_ESPECIALIDADES).order('tecnico_nom_ape', { ascending: true });

  if (disponibilidad) {
    query = query.eq('tecnico_disponibilidad', disponibilidad === 'Disponible');
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let tecnicos = data.map(mapearTecnico);

  // Postgrest no deja filtrar la tabla principal por una columna de una
  // relacion N:M, asi que el filtro por especialidad se aplica aca.
  if (especialidad_id) {
    const idNumerico = Number(especialidad_id);
    tecnicos = tecnicos.filter((tecnico) =>
      tecnico.especialidades.some((especialidad) => especialidad.idEspecialidad === idNumerico)
    );
  }

  return tecnicos;
}

export async function obtenerPorId(legajo) {
  const { data, error } = await supabase
    .from('tecnico')
    .select(COLUMNAS_CON_ESPECIALIDADES)
    .eq('tecnico_legajo', legajo)
    .single();

  if (error || !data) throw noEncontrado(`No existe el técnico ${legajo}.`);

  return mapearTecnico(data);
}

/** Lo que deja un alta a medias: las especialidades y el tecnico (si tenia usuario, se borra en cascada). */
async function deshacerAlta(legajo) {
  await supabase.from('tecnico_especialidad').delete().eq('tecnico_legajo', legajo);
  await supabase.from('tecnico').delete().eq('tecnico_legajo', legajo);
}

/**
 * Alta de un tecnico con su usuario (ver crearUsuarioDePersona). Es todo o
 * nada: si el usuario no se puede crear, el tecnico tampoco queda guardado.
 */
export async function crear(datos) {
  const legajo = Number(datos.legajo);
  if (!Number.isInteger(legajo) || legajo <= 0) {
    throw datoInvalido('El legajo tiene que ser un número válido.');
  }

  const limpio = validarDatos(datos);
  await validarEspecialidadesExisten(limpio.especialidades);

  const { data: legajoExistente } = await supabase.from('tecnico').select('tecnico_legajo').eq('tecnico_legajo', legajo).maybeSingle();
  if (legajoExistente) throw conflicto('El legajo ingresado ya pertenece a otro técnico.');

  await controlarNombreLibre(String(legajo));

  const { error } = await supabase.from('tecnico').insert({
    tecnico_legajo: legajo,
    tecnico_nom_ape: limpio.nombreCompleto,
    tecnico_tel: limpio.telefono,
    tecnico_disponibilidad: limpio.disponibilidad === 'Disponible',
  });

  if (error) throw new Error(error.message);

  try {
    await asignarEspecialidades(legajo, limpio.especialidades);
    await crearUsuarioDePersona('tecnico', legajo);
  } catch (fallo) {
    await deshacerAlta(legajo);
    fallo.message = `No se guardó el técnico: ${fallo.message}`;
    throw fallo;
  }

  return obtenerPorId(legajo);
}

export async function actualizar(legajo, datos) {
  const limpio = validarDatos(datos);
  await validarEspecialidadesExisten(limpio.especialidades);

  const { data, error } = await supabase
    .from('tecnico')
    .update({
      tecnico_nom_ape: limpio.nombreCompleto,
      tecnico_tel: limpio.telefono,
      tecnico_disponibilidad: limpio.disponibilidad === 'Disponible',
    })
    .eq('tecnico_legajo', legajo)
    .select()
    .single();

  if (error || !data) throw noEncontrado(`No existe el técnico ${legajo}.`);

  await asignarEspecialidades(legajo, limpio.especialidades);

  return obtenerPorId(legajo);
}

/**
 * Eliminar es para un tecnico cargado por error: sólo si nunca registró nada.
 * Si ya tiene historial (tareas, herramientas, observaciones) se desactiva su usuario.
 */
export async function eliminar(legajo) {
  const { count: tareas, error: errorTareas } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select('tecnico_legajo', { count: 'exact', head: true })
    .eq('tecnico_legajo', legajo);
  if (errorTareas) throw new Error(errorTareas.message);
  if (tareas > 0) {
    throw conflicto('No se puede eliminar: el técnico ya tiene tareas asignadas. Desactivalo para que no pueda entrar.');
  }
  if ((await contarObservacionesDe('tecnico_legajo', legajo)) > 0) {
    throw conflicto('No se puede eliminar: el técnico ya escribió observaciones. Desactivalo para que no pueda entrar.');
  }

  // Las herramientas que tiene o que tuvo asignadas (sus prestamos) tambien frenan el borrado.
  const { data: prestamos, error: errorPrestamos } = await supabase
    .from('tecnico_utiliza_herramienta')
    .select('tec_herr_fecha_dev')
    .eq('tecnico_legajo', legajo);
  if (errorPrestamos) throw new Error(errorPrestamos.message);
  if (prestamos.some((prestamo) => !prestamo.tec_herr_fecha_dev)) {
    throw conflicto('El técnico tiene herramientas asignadas. Primero hay que registrar la devolución.');
  }
  if (prestamos.length > 0) {
    throw conflicto('No se puede eliminar: el técnico ya usó herramientas. Desactivalo para que no pueda entrar.');
  }

  // Limpiamos sus relaciones primero
  await supabase.from('tecnico_especialidad').delete().eq('tecnico_legajo', legajo);

  const { data, error } = await supabase.from('tecnico').delete().eq('tecnico_legajo', legajo).select().single();
  if (error || !data) throw noEncontrado(`No existe el técnico ${legajo}.`);

  return { legajo: data.tecnico_legajo, nombre: data.tecnico_nom_ape, apellido: '' };
}

