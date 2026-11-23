/**
 * Lo que hizo cada usuario con sus notificaciones: si las leyo y si las
 * elimino (tabla notificacion_usuario, 23/11/2026).
 *
 * Las notificaciones en si no se guardan (ver notificaciones.servicio.js): se
 * calculan cada vez. Aca se guarda una fila por usuario y clave, con la
 * primera vez que se le mostro, si la leyo y si la elimino.
 */
import { supabase } from '../config/supabase.js';
import { errorDeBase, noEncontrado } from '../utiles/errores.js';

const TABLA = 'notificacion_usuario';

/**
 * Pone la tabla al dia con las notificaciones que se acaban de calcular y
 * devuelve el estado de cada una:
 *   - las nuevas se agregan, sin leer;
 *   - las que ya no se calculan se borran: si vuelven a aparecer (el stock
 *     vuelve a bajar, por ejemplo) llegan como nuevas.
 *
 * @param {string} identificador - el usuario de la sesion
 * @param {string[]} claves - las claves de las notificaciones calculadas
 * @returns {Promise<Map<string, { fecha: string, leida: boolean, eliminada: boolean }>>}
 */
export async function sincronizar(identificador, claves) {
  const { data, error } = await supabase
    .from(TABLA)
    .select('notif_clave, notif_fecha, notif_leida, notif_eliminada')
    .eq('identificador', identificador);
  if (error) throw errorDeBase(error, 'de las notificaciones');

  const estados = new Map(
    (data ?? []).map((fila) => [
      fila.notif_clave,
      { fecha: fila.notif_fecha, leida: fila.notif_leida, eliminada: fila.notif_eliminada },
    ])
  );

  const nuevas = claves.filter((clave) => !estados.has(clave));
  if (nuevas.length > 0) {
    const ahora = new Date().toISOString();
    const { error: errorAlta } = await supabase.from(TABLA).upsert(
      nuevas.map((clave) => ({ identificador, notif_clave: clave, notif_fecha: ahora })),
      { onConflict: 'identificador,notif_clave', ignoreDuplicates: true }
    );
    if (errorAlta) throw errorDeBase(errorAlta, 'de las notificaciones');
    nuevas.forEach((clave) => estados.set(clave, { fecha: ahora, leida: false, eliminada: false }));
  }

  const vigentes = new Set(claves);
  const viejas = [...estados.keys()].filter((clave) => !vigentes.has(clave));
  if (viejas.length > 0) {
    const { error: errorBaja } = await supabase
      .from(TABLA)
      .delete()
      .eq('identificador', identificador)
      .in('notif_clave', viejas);
    if (errorBaja) throw errorDeBase(errorBaja, 'de las notificaciones');
    viejas.forEach((clave) => estados.delete(clave));
  }

  return estados;
}

async function actualizarUna(identificador, clave, cambios) {
  const { data, error } = await supabase
    .from(TABLA)
    .update(cambios)
    .eq('identificador', identificador)
    .eq('notif_clave', clave)
    .select('notif_clave');
  if (error) throw errorDeBase(error, 'de la notificación');
  if (!data || data.length === 0) throw noEncontrado('No existe esa notificación.');
}

/** Marca una notificacion como leida (o como no leida). */
export function marcarLeida(identificador, clave, leida = true) {
  return actualizarUna(identificador, clave, { notif_leida: Boolean(leida) });
}

/** Elimina una notificacion: no se le vuelve a mostrar mientras se siga calculando. */
export function eliminar(identificador, clave) {
  return actualizarUna(identificador, clave, { notif_eliminada: true, notif_leida: true });
}

/** Marca como leidas todas las notificaciones del usuario. */
export async function marcarTodasLeidas(identificador) {
  const { error } = await supabase
    .from(TABLA)
    .update({ notif_leida: true })
    .eq('identificador', identificador)
    .eq('notif_leida', false);
  if (error) throw errorDeBase(error, 'de las notificaciones');
}
