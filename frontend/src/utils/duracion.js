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

/**
 * Lo que manda el campo cuando quedó a medias: con las horas y sin los minutos,
 * o al revés. No es una duración, pero tampoco es "nada": si se tomara como
 * vacío, la tarea se guardaría sin duración y nadie se daría cuenta. Así el
 * formulario lo ve y avisa (09/10/2026).
 */
export const DURACION_INCOMPLETA = 'incompleta';

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

/*
 * ---------- Tiempos largos (estadísticas, Sprint 7) ----------
 *
 * Un tiempo de resolución puede ser de minutos o de semanas, así que no entra
 * en el reloj hh:mm de las tareas. La API lo manda en segundos y acá se escribe
 * con las dos unidades más grandes que tenga (09/11/2026):
 *
 *   45            "menos de 1 min"
 *   1500          "25 min"
 *   12600         "3 h 30 min"
 *   187200        "2 d 4 h"
 *   172800        "2 d"
 *
 * Los minutos se redondean al más cercano y, desde un día, las horas también.
 */
const SEGUNDOS_POR_MINUTO = 60;
const MINUTOS_POR_DIA = 24 * MINUTOS_POR_HORA;

/** De segundos a "2 d 4 h". Sin dato (null, vacío o negativo), devuelve "-". */
export function textoTiempo(segundos) {
  if (segundos == null || segundos === '') return '-';
  const valor = Number(segundos);
  if (Number.isNaN(valor) || valor < 0) return '-';

  if (valor < SEGUNDOS_POR_MINUTO) return 'menos de 1 min';

  const minutos = Math.round(valor / SEGUNDOS_POR_MINUTO);
  if (minutos < MINUTOS_POR_HORA) return `${minutos} min`;

  if (minutos < MINUTOS_POR_DIA) {
    const horas = Math.floor(minutos / MINUTOS_POR_HORA);
    const resto = minutos % MINUTOS_POR_HORA;
    return resto ? `${horas} h ${resto} min` : `${horas} h`;
  }

  const horasTotales = Math.round(minutos / MINUTOS_POR_HORA);
  const dias = Math.floor(horasTotales / 24);
  const horas = horasTotales % 24;
  return horas ? `${dias} d ${horas} h` : `${dias} d`;
}

/** De segundos a horas con un decimal, para el detalle: "52,3 h". */
export function horasConUnDecimal(segundos) {
  if (segundos == null || segundos === '' || Number.isNaN(Number(segundos))) return '-';
  const horas = Number(segundos) / (SEGUNDOS_POR_MINUTO * MINUTOS_POR_HORA);
  return `${horas.toLocaleString('es-AR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} h`;
}
