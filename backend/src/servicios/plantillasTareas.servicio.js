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
    idTipoActivo: fila.tipo_activo_id,
    nombreTipo: fila.tipo_activo?.tipo_activo_nom,
    // El frontend espera "descripcion", pero en la BD lo guardamos en "tarea_plan_nom"
    descripcion: fila.tarea_plan_nom,
  };
}

export async function obtenerTodas(idTipoActivo) {
  let query = supabase.from('plantilla_de_tarea').select(`
    *,
    tipo_activo ( tipo_activo_nom )
  `).order('tarea_plan_nom', { ascending: true });
  if (idTipoActivo) {
    query = query.eq('tipo_activo_id', idTipoActivo);
  }
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(mapear);
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase.from('plantilla_de_tarea').select(`
    *,
    tipo_activo ( tipo_activo_nom )
  `).eq('tarea_plan_id', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la plantilla de tarea ${id}.`);
  return mapear(data);
}

export async function crear(datos) {
  const descripcionLimpia = limpiar(datos.descripcion);
  const idTipoActivo = Number(datos.idTipoActivo);

  if (!descripcionLimpia) throw datoInvalido('La descripción de la tarea es obligatoria.');
  if (!Number.isInteger(idTipoActivo)) throw datoInvalido('El tipo de activo es obligatorio.');

  const { data, error } = await supabase.from('plantilla_de_tarea').insert({
    tipo_activo_id: idTipoActivo,
    tarea_plan_nom: descripcionLimpia, // El frontend manda esto como "descripcion"
    tarea_plan_desc: null
  }).select('*, tipo_activo(tipo_activo_nom)').single();

  if (error) throw new Error(error.message);
  return mapear(data);
}

export async function actualizar(id, datos) {
  const descripcionLimpia = limpiar(datos.descripcion);
  const idTipoActivo = Number(datos.idTipoActivo);

  if (!descripcionLimpia) throw datoInvalido('La descripción de la tarea es obligatoria.');
  if (!Number.isInteger(idTipoActivo)) throw datoInvalido('El tipo de activo es obligatorio.');

  const { data, error } = await supabase.from('plantilla_de_tarea').update({
    tipo_activo_id: idTipoActivo,
    tarea_plan_nom: descripcionLimpia,
    tarea_plan_desc: null
  }).eq('tarea_plan_id', id).select('*, tipo_activo(tipo_activo_nom)').maybeSingle();

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
