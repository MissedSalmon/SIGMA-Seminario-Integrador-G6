/**
 * La duración prevista de una tarea de la OT (HU-14).
 *
 * En la base se guarda en horas, con decimales (`tarea_ot.tarea_hom`), porque
 * así está el modelo. Pero nadie piensa una tarea como "0.5", y escribirlo con
 * coma se presta a errores. Así que en la pantalla se carga y se lee como un
 * reloj, en horas y minutos (decisión del 24/09/2026):
 *
 *   00:30   media hora
 *   01:00   una hora
 *   01:30   una hora y media
 *
 * Las cuentas para ir y volver entre las dos formas quedan acá adentro.
 *
 * ⬜ El tope es 23:59. Lo impone el campo, que son dos casilleros de reloj, y
 *    alcanza de sobra para una tarea de mantenimiento. Si alguna vez hiciera
 *    falta cargar algo más largo, habría que cambiar el campo, no esta cuenta.
 */

/** Los minutos que tiene una hora, para no repetir el 60 en cada cuenta. */
const MINUTOS_POR_HORA = 60;

/**
 * De 1.5 arma "01:30", que es lo que muestra el campo.
 *
 * Devuelve cadena vacía si no hay duración cargada. El redondeo es al minuto:
 * la base guarda dos decimales de hora, así que no hace falta más precisión.
 */
export function comoHoraMinuto(horasDecimales) {
  if (horasDecimales == null || horasDecimales === '') return '';

  const total = Math.round(Number(horasDecimales) * MINUTOS_POR_HORA);
  if (Number.isNaN(total) || total <= 0) return '';

  const horas = Math.floor(total / MINUTOS_POR_HORA);
  const minutos = total % MINUTOS_POR_HORA;

  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}`;
}

/**
 * Al revés: de "01:30" saca las horas con decimales que van a la base.
 * Devuelve null si no hay nada cargado o si el texto no es un reloj.
 *
 * El resultado se redondea a dos decimales porque la columna es NUMERIC(5,2):
 * "00:20" se guarda como 0.33 y se vuelve a leer como 00:20.
 */
export function aHorasDecimales(texto) {
  if (texto == null) return null;

  const reloj = String(texto).trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!reloj) return null;

  const horas = Number(reloj[1]) + Number(reloj[2]) / MINUTOS_POR_HORA;

  return Math.round(horas * 100) / 100;
}
