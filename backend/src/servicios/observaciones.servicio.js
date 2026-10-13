import { supabase } from '../config/supabase.js';
import { datoInvalido, errorDeBase, noEncontrado, prohibido } from '../utiles/errores.js';

// Mismo límite que las descripciones libres de tickets y remitos.
export const LARGO_OBSERVACION = 500;

function aObservacion(fila) {
  return {
    id: fila.observacion_id,
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    texto: fila.observacion_texto,
    autor: fila.observacion_autor_nombre,
    idUsuario: fila.usuario_id,
    fecha: fila.observacion_fecha,
  };
}

export async function observacionesDeLaTarea(idOt, idTarea) {
  const { data, error } = await supabase.from('tarea_observacion').select('*')
    .eq('ot_id', idOt).eq('tarea_id', idTarea)
    .order('observacion_fecha', { ascending: true }).order('observacion_id', { ascending: true });
  if (error) throw errorDeBase(error, 'de las observaciones');
  return (data ?? []).map(aObservacion);
}

export async function registrarObservacion(identificador, idOt, idTarea, texto) {
  if (typeof texto !== 'string' || !texto.trim()) throw datoInvalido('La observación no puede estar vacía.');
  if (texto.length > LARGO_OBSERVACION) throw datoInvalido(`La observación admite hasta ${LARGO_OBSERVACION} caracteres.`);
  // La función controla la asignación y genera autor y fecha en una transacción.
  const { data, error } = await supabase.rpc('registrar_observacion_tarea', {
    p_identificador: identificador, p_ot_id: idOt, p_tarea_id: idTarea, p_texto: texto.trim(),
  });
  if (error?.code === '42501') throw prohibido('No tenés permiso para agregar observaciones.');
  if (error?.code === 'P0002') throw noEncontrado('No tenés asignada esa tarea.');
  if (error?.code === '22023') throw datoInvalido(error.message);
  if (error) throw errorDeBase(error, 'de las observaciones');
  return aObservacion(data);
}

/** Consulta preparada para el historial HU-28/HU-29; una fila por observación. */
export async function observacionesDelActivo(codigoActivo) {
  const { data, error } = await supabase.from('activo_historial_observacion').select('*')
    .eq('activo_codigo', codigoActivo)
    .order('observacion_fecha', { ascending: true }).order('observacion_id', { ascending: true });
  if (error) throw errorDeBase(error, 'del historial de observaciones');
  return (data ?? []).map(aObservacion);
}
