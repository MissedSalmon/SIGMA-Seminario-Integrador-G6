/**
 * Cuentas con fechas de los planes preventivos (03/11/2026).
 *
 * Se usa @internationalized/date, la misma librería del almanaque del
 * frontend, en vez de sumar a mano: resuelve el fin de mes (31/08 + 6 meses =
 * 28/02, o 29/02 si es bisiesto) y los años bisiestos. Las fechas entran y
 * salen como texto "2026-09-14", que es como se guardan las columnas DATE.
 */
import { parseDate, today } from '@internationalized/date';

const ZONA_ARGENTINA = 'America/Argentina/Buenos_Aires';

export const UNIDADES_FRECUENCIA = ['dias', 'semanas', 'meses', 'anios'];

const CAMPO_DE_UNIDAD = { dias: 'days', semanas: 'weeks', meses: 'months', anios: 'years' };

/** "2026-11-03" en Argentina: el servidor puede estar en UTC, donde después de las 21 ya es mañana. */
export function hoyArgentina() {
  return today(ZONA_ARGENTINA).toString();
}

/** De "2026-10-27T22:55:16+00:00" o "2026-10-27" saca "2026-10-27". */
export function soloDia(fecha) {
  return fecha ? String(fecha).slice(0, 10) : null;
}

/** La fecha más un período: sumarPeriodo('2026-06-13', 6, 'meses') -> '2026-12-13'. */
export function sumarPeriodo(fecha, intervalo, unidad) {
  const campo = CAMPO_DE_UNIDAD[unidad];
  const cantidad = Number(intervalo);
  if (!campo) throw new Error(`"${unidad}" no es una unidad de frecuencia. Son: ${UNIDADES_FRECUENCIA.join(', ')}.`);
  if (!Number.isInteger(cantidad) || cantidad <= 0) throw new Error('El intervalo tiene que ser un entero mayor que 0.');

  return parseDate(soloDia(fecha)).add({ [campo]: cantidad }).toString();
}

/** La fecha más (o menos) una cantidad de días. */
export function sumarDias(fecha, dias) {
  return parseDate(soloDia(fecha)).add({ days: dias }).toString();
}

/** Días de `desde` a `hasta` (negativo si `hasta` ya pasó). */
export function diasEntre(desde, hasta) {
  return parseDate(soloDia(hasta)).compare(parseDate(soloDia(desde)));
}
