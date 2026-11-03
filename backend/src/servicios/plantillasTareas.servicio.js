import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

function mapear(fila) {
  return {
    idPlantilla: fila.tarea_plan_id,
    idEspecialidad: fila.especialidad_id,
    nombreEspecialidad: fila.especialidad?.especialidad_nom ?? null,
    // El frontend espera "descripcion", pero en la BD lo guardamos en "tarea_plan_nom"
    descripcion: fila.tarea_plan_nom,
  };
}

const COLUMNAS = '*, especialidad ( especialidad_nom )';

/** Corta el alta o la edición si la especialidad no es un id o no existe. */
async function leerEspecialidad(valor) {
  const idEspecialidad = Number(valor);
  if (!valor || !Number.isInteger(idEspecialidad)) throw datoInvalido('La especialidad es obligatoria.');

  const { data, error } = await supabase
    .from('especialidad')
    .select('especialidad_id')
    .eq('especialidad_id', idEspecialidad)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw datoInvalido('La especialidad elegida no existe.');

  return idEspecialidad;
}

export async function obtenerTodas(idEspecialidad) {
  let query = supabase.from('plantilla_de_tarea').select(COLUMNAS).order('tarea_plan_nom', { ascending: true });
  if (idEspecialidad) {
    query = query.eq('especialidad_id', idEspecialidad);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(mapear);
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase.from('plantilla_de_tarea').select(COLUMNAS).eq('tarea_plan_id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la plantilla de tarea ${id}.`);
  return mapear(data);
}

export async function crear(datos) {
  const descripcionLimpia = limpiar(datos.descripcion);

  if (!descripcionLimpia) throw datoInvalido('La descripción de la tarea es obligatoria.');
  const idEspecialidad = await leerEspecialidad(datos.idEspecialidad);

  const { data, error } = await supabase.from('plantilla_de_tarea').insert({
    especialidad_id: idEspecialidad,
    tarea_plan_nom: descripcionLimpia, // El frontend manda esto como "descripcion"
    tarea_plan_desc: null
  }).select(COLUMNAS).single();

  if (error) throw new Error(error.message);
  return mapear(data);
}

export async function actualizar(id, datos) {
  const descripcionLimpia = limpiar(datos.descripcion);

  if (!descripcionLimpia) throw datoInvalido('La descripción de la tarea es obligatoria.');
  const idEspecialidad = await leerEspecialidad(datos.idEspecialidad);

  const { data, error } = await supabase.from('plantilla_de_tarea').update({
    especialidad_id: idEspecialidad,
    tarea_plan_nom: descripcionLimpia,
    tarea_plan_desc: null
  }).eq('tarea_plan_id', id).select(COLUMNAS).maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la plantilla de tarea ${id}.`);
  return mapear(data);
}

export async function eliminar(id) {
  const plantilla = await obtenerPorId(id);
  
  // Aca podriamos verificar si la plantilla esta usada en MantenimientoPreventivo
  // o TareaOT y lanzar un conflicto, pero por ahora solo eliminamos.
  const { data: tareasRelacionadas } = await supabase.from('mant_prev_tarea').select('mant_prev_id').eq('tarea_plan_id', id).limit(1);
  if (tareasRelacionadas && tareasRelacionadas.length > 0) {
      throw conflicto('No se puede eliminar la plantilla porque está asignada a un mantenimiento preventivo.');
  }

  const { error } = await supabase.from('plantilla_de_tarea').delete().eq('tarea_plan_id', id);
  if (error) throw new Error(error.message);
  return plantilla;
}
