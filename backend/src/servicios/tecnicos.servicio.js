/**
 * Servicio de tecnicos (HU-5).
 *
 * Un tecnico tiene una o varias especialidades (relacion N:M via
 * tecnico_especialidad, ver supabase/migrations/20260828234944_init_schema.sql
 * y la nota de tablasactualizadas.md). La disponibilidad ("Disponible" /
 * "No disponible") es tambien el mecanismo de baja logica: un tecnico con
 * tareas asignadas no se puede eliminar, se marca como no disponible y
 * conserva su historial.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

const DISPONIBILIDADES_VALIDAS = ['Disponible', 'No disponible'];

const COLUMNAS_CON_ESPECIALIDADES = `
  tecnicolegajo,
  tecniconombre,
  tecnicoapellido,
  tecnicodni,
  tecnicocuil,
  tecnicoemail,
  tecnicotel,
  tecnicofechanac,
  tecnicodisponibilidad,
  tecnico_especialidad ( especialidadid, especialidad ( especialidadnom ) )
`;

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** Deja solo los digitos: sirve para guardar DNI/CUIL sin importar si vienen con puntos o guiones. */
function soloDigitos(texto) {
  const limpio = limpiar(texto);
  return limpio ? limpio.replace(/\D/g, '') : null;
}

function mapearTecnico(fila) {
  return {
    legajo: fila.tecnicolegajo,
    nombre: fila.tecniconombre,
    apellido: fila.tecnicoapellido,
    dni: fila.tecnicodni,
    cuil: fila.tecnicocuil,
    email: fila.tecnicoemail,
    telefono: fila.tecnicotel,
    fechaNacimiento: fila.tecnicofechanac,
    disponibilidad: fila.tecnicodisponibilidad,
    especialidades: (fila.tecnico_especialidad ?? []).map((relacion) => ({
      idEspecialidad: relacion.especialidadid,
      nombre: relacion.especialidad ? relacion.especialidad.especialidadnom : '(especialidad eliminada)',
    })),
  };
}

/** Valida y normaliza los datos personales. No valida el legajo: eso lo hace `crear`, que es el unico que lo puede tocar. */
function validarDatos(datos) {
  const nombre = limpiar(datos.nombre);
  const apellido = limpiar(datos.apellido);
  const dni = soloDigitos(datos.dni);
  const cuil = soloDigitos(datos.cuil);
  const email = limpiar(datos.email);
  const telefono = limpiar(datos.telefono);
  const fechaNacimiento = limpiar(datos.fechaNacimiento);
  const disponibilidad = limpiar(datos.disponibilidad) ?? 'Disponible';
  const especialidades = Array.isArray(datos.especialidades)
    ? [...new Set(datos.especialidades.map(Number).filter(Number.isInteger))]
    : [];

  if (!nombre) throw datoInvalido('El nombre es obligatorio.');
  if (!apellido) throw datoInvalido('El apellido es obligatorio.');
  if (!dni || !/^\d{7,8}$/.test(dni)) throw datoInvalido('El DNI tiene que tener 7 u 8 digitos.');
  if (!cuil || !/^\d{11}$/.test(cuil)) throw datoInvalido('El CUIL tiene que tener 11 digitos.');
  if (!email) throw datoInvalido('El email es obligatorio.');
  if (!fechaNacimiento) throw datoInvalido('La fecha de nacimiento es obligatoria.');
  if (!DISPONIBILIDADES_VALIDAS.includes(disponibilidad)) {
    throw datoInvalido('La disponibilidad tiene que ser "Disponible" o "No disponible".');
  }
  if (especialidades.length === 0) {
    throw datoInvalido('Hay que seleccionar al menos una especialidad.');
  }

  return { nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, disponibilidad, especialidades };
}

/** Corta el alta/edicion si alguna especialidad elegida no existe en la tabla. */
async function validarEspecialidadesExisten(idsEspecialidad) {
  const { data, error } = await supabase.from('especialidad').select('especialidadid').in('especialidadid', idsEspecialidad);
  if (error) throw new Error(error.message);

  if (!data || data.length !== idsEspecialidad.length) {
    throw datoInvalido('Alguna de las especialidades seleccionadas no existe.');
  }
}

/** Reemplaza por completo las especialidades de un tecnico (se usa en alta y en edicion). */
async function asignarEspecialidades(legajo, idsEspecialidad) {
  const { error: errorBorrado } = await supabase.from('tecnico_especialidad').delete().eq('tecnicolegajo', legajo);
  if (errorBorrado) throw new Error(errorBorrado.message);

  const filas = idsEspecialidad.map((idEspecialidad) => ({
    tecnicolegajo: legajo,
    especialidadid: idEspecialidad,
  }));

  const { error } = await supabase.from('tecnico_especialidad').insert(filas);
  if (error) throw new Error(error.message);
}

export async function obtenerTodos({ especialidadId, disponibilidad } = {}) {
  let query = supabase.from('tecnico').select(COLUMNAS_CON_ESPECIALIDADES).order('tecnicoapellido', { ascending: true });

  if (disponibilidad) {
    query = query.eq('tecnicodisponibilidad', disponibilidad);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  let tecnicos = data.map(mapearTecnico);

  // Postgrest no deja filtrar la tabla principal por una columna de una
  // relacion N:M, asi que el filtro por especialidad se aplica aca.
  if (especialidadId) {
    const idNumerico = Number(especialidadId);
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
    .eq('tecnicolegajo', legajo)
    .single();

  if (error || !data) throw noEncontrado(`No existe el tecnico ${legajo}.`);

  return mapearTecnico(data);
}

export async function crear(datos) {
  const legajo = Number(datos.legajo);
  if (!Number.isInteger(legajo) || legajo <= 0) {
    throw datoInvalido('El legajo tiene que ser un numero valido.');
  }

  const limpio = validarDatos(datos);
  await validarEspecialidadesExisten(limpio.especialidades);

  const { data: legajoExistente } = await supabase.from('tecnico').select('tecnicolegajo').eq('tecnicolegajo', legajo).maybeSingle();
  if (legajoExistente) throw conflicto('El legajo ingresado ya pertenece a otro técnico.');

  const { data: dniExistente } = await supabase.from('tecnico').select('tecnicolegajo').eq('tecnicodni', limpio.dni).maybeSingle();
  if (dniExistente) throw conflicto('El DNI ingresado ya pertenece a otro técnico.');

  const { data: cuilExistente } = await supabase.from('tecnico').select('tecnicolegajo').eq('tecnicocuil', limpio.cuil).maybeSingle();
  if (cuilExistente) throw conflicto('El CUIL ingresado ya pertenece a otro técnico.');

  const { error } = await supabase.from('tecnico').insert({
    tecnicolegajo: legajo,
    tecniconombre: limpio.nombre,
    tecnicoapellido: limpio.apellido,
    tecnicodni: limpio.dni,
    tecnicocuil: limpio.cuil,
    tecnicoemail: limpio.email,
    tecnicotel: limpio.telefono,
    tecnicofechanac: limpio.fechaNacimiento,
    tecnicodisponibilidad: limpio.disponibilidad,
  });

  if (error) throw new Error(error.message);

  await asignarEspecialidades(legajo, limpio.especialidades);

  return obtenerPorId(legajo);
}

export async function actualizar(legajo, datos) {
  const limpio = validarDatos(datos);
  await validarEspecialidadesExisten(limpio.especialidades);

  const { data: dniExistente } = await supabase
    .from('tecnico')
    .select('tecnicolegajo')
    .eq('tecnicodni', limpio.dni)
    .neq('tecnicolegajo', legajo)
    .maybeSingle();
  if (dniExistente) throw conflicto('El DNI ingresado ya pertenece a otro técnico.');

  const { data: cuilExistente } = await supabase
    .from('tecnico')
    .select('tecnicolegajo')
    .eq('tecnicocuil', limpio.cuil)
    .neq('tecnicolegajo', legajo)
    .maybeSingle();
  if (cuilExistente) throw conflicto('El CUIL ingresado ya pertenece a otro técnico.');

  const { data, error } = await supabase
    .from('tecnico')
    .update({
      tecniconombre: limpio.nombre,
      tecnicoapellido: limpio.apellido,
      tecnicodni: limpio.dni,
      tecnicocuil: limpio.cuil,
      tecnicoemail: limpio.email,
      tecnicotel: limpio.telefono,
      tecnicofechanac: limpio.fechaNacimiento,
      tecnicodisponibilidad: limpio.disponibilidad,
    })
    .eq('tecnicolegajo', legajo)
    .select()
    .single();

  if (error || !data) throw noEncontrado(`No existe el tecnico ${legajo}.`);

  await asignarEspecialidades(legajo, limpio.especialidades);

  return obtenerPorId(legajo);
}

export async function eliminar(legajo) {
  const { data: tareas } = await supabase
    .from('tecnico_asignado_tareaot')
    .select('tareaid')
    .eq('tecnicolegajo', legajo)
    .limit(1);

  if (tareas && tareas.length > 0) {
    throw conflicto(
      'No se puede eliminar este técnico porque tiene tareas asignadas. Para conservar su historial, marque el técnico como no disponible.'
    );
  }

  // Se limpian las relaciones propias del tecnico antes de borrarlo: no son
  // historial de negocio (a diferencia de las tareas), son solo su ficha.
  await supabase.from('tecnico_especialidad').delete().eq('tecnicolegajo', legajo);
  await supabase.from('tecnico_utiliza_herramienta').delete().eq('tecnicolegajo', legajo);

  const { data, error } = await supabase.from('tecnico').delete().eq('tecnicolegajo', legajo).select().single();
  if (error || !data) throw noEncontrado(`No existe el tecnico ${legajo}.`);

  return { legajo: data.tecnicolegajo, nombre: data.tecniconombre, apellido: data.tecnicoapellido };
}
