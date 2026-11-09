import { supabase } from '../config/supabase.js';
import { contarObservacionesDe, controlarNombreLibre, crearUsuarioDePersona, cuentaDe } from './usuarios.servicio.js';
import {
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_TAREA,
  ENUM_PRIORIDAD,
} from '../utiles/enumerados.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';
import { normalizarTelefono, validarTelefono } from '../utiles/validaciones.js';

const DISPONIBILIDADES_VALIDAS = ['Disponible', 'No disponible'];
const ASIGNACION_CANCELADA = ENUM_ESTADO_ASIGNACION_TECNICO.codigo('Cancelada');
const ESTADOS_PENDIENTES = ['Creada', 'Asignada', 'Pendiente'];

const COLUMNAS_TAREAS_ASIGNADAS = `
  tecnico_legajo,
  ot_id,
  tarea_id,
  tec_asig_estado,
  tarea_ot!inner (
    tarea_desc,
    tarea_estado,
    tarea_prioridad,
    tarea_fecha_ini,
    tarea_fecha_fin,
    orden_trabajo (
      ot_id,
      ot_desc
    )
  )
`;

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

function soloElDia(valor) {
  return valor ? String(valor).slice(0, 10) : null;
}

function mapearTareaAsignada(fila) {
  const tarea = fila.tarea_ot;
  const estado = ENUM_ESTADO_TAREA.texto(tarea.tarea_estado);

  if (!estado || estado === 'Cancelada') return null;

  return {
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    descripcion: tarea.tarea_desc,
    estado,
    prioridad: ENUM_PRIORIDAD.texto(tarea.tarea_prioridad) ?? 'Media',
    fechaInicio: soloElDia(tarea.tarea_fecha_ini),
    fechaFin: soloElDia(tarea.tarea_fecha_fin),
    orden: tarea.orden_trabajo
      ? { id: tarea.orden_trabajo.ot_id, descripcion: tarea.orden_trabajo.ot_desc }
      : null,
  };
}

function cumplePeriodo(tarea, { desde, hasta }) {
  if ((desde || hasta) && !tarea.fechaInicio) return false;
  if (desde && tarea.fechaInicio < desde) return false;
  if (hasta && tarea.fechaInicio > hasta) return false;
  return true;
}

async function obtenerTareasAsignadas(legajo, filtros = {}) {
  let consulta = supabase
    .from('tecnico_asignado_tarea_ot')
    .select(COLUMNAS_TAREAS_ASIGNADAS)
    .neq('tec_asig_estado', ASIGNACION_CANCELADA);

  if (legajo) consulta = consulta.eq('tecnico_legajo', legajo);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((fila) => {
      const tarea = mapearTareaAsignada(fila);
      return tarea ? { legajo: fila.tecnico_legajo, tarea } : null;
    })
    .filter((fila) => fila && cumplePeriodo(fila.tarea, filtros))
    .sort((una, otra) =>
      una.tarea.idOt - otra.tarea.idOt || una.tarea.idTarea - otra.tarea.idTarea
    );
}

/**
 * Carga de trabajo por técnico. El período se aplica a la fecha prevista de
 * inicio; las tareas sin esa fecha solo aparecen cuando no hay filtro temporal.
 */
export async function obtenerCargaTrabajo(filtros = {}) {
  const tecnicos = await obtenerTodos({ especialidad_id: filtros.especialidad_id });
  const tareas = await obtenerTareasAsignadas(null, filtros);
  const porTecnico = new Map(tecnicos.map((tecnico) => [String(tecnico.legajo), []]));

  for (const asignacion of tareas) {
    if (porTecnico.has(String(asignacion.legajo))) {
      porTecnico.get(String(asignacion.legajo)).push(asignacion.tarea);
    }
  }

  return tecnicos
    .map((tecnico) => {
      const tareasTecnico = porTecnico.get(String(tecnico.legajo)) ?? [];
      const pendientes = tareasTecnico.filter((tarea) => ESTADOS_PENDIENTES.includes(tarea.estado)).length;
      const enEjecucion = tareasTecnico.filter((tarea) => tarea.estado === 'En ejecución').length;
      const completadas = tareasTecnico.filter((tarea) => tarea.estado === 'Finalizada').length;

      return {
        ...tecnico,
        pendientes,
        enEjecucion,
        completadas,
        cargaActiva: pendientes + enEjecucion,
      };
    })
    .sort((una, otra) =>
      otra.cargaActiva - una.cargaActiva ||
      otra.pendientes - una.pendientes ||
      una.nombre.localeCompare(otra.nombre, 'es')
    );
}

/** Tareas vigentes de un técnico para el detalle de carga. */
export async function obtenerTareasDeCarga(legajo, filtros = {}) {
  await obtenerPorId(legajo);
  const filas = await obtenerTareasAsignadas(legajo, filtros);
  return filas.map((fila) => fila.tarea);
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
