/**
 * La duración prevista de una tarea de la OT (HU-14).
 *
 * En la base se guarda en horas, con decimales (`tarea_ot.tarea_hom`), porque
 * así está el modelo. Pero nadie piensa una tarea como "0.5": la piensa como
 * "media hora". Así que en la pantalla se escribe y se lee en horas y minutos,
 * y las cuentas quedan acá adentro.
 *
 * La caja deja escribir a mano y además sugiere las duraciones más comunes.
 * Se entienden las formas en que uno la escribiría:
 *
 *   30 min · 30min · 45 minutos
 *   1 h · 2 hs · 3 horas
 *   1 h 30 min · 1h30 · 1:30
 *   1.5 · 1,5 · 2          (un número solo son horas)
 */

/** Las duraciones que se sugieren al escribir, de menor a mayor. */
export const DURACIONES = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];

/**
 * De 1.5 arma "1 h 30 min". Los redondeos son al minuto: la base guarda dos
 * decimales de hora, así que no hace falta más precisión.
 *
 *   0.5  -> "30 min"
 *   1    -> "1 h"
 *   1.5  -> "1 h 30 min"
 */
export function formatearDuracion(horasDecimales) {
  if (horasDecimales == null || horasDecimales === '') return null;

  const total = Math.round(Number(horasDecimales) * 60);
  if (Number.isNaN(total) || total <= 0) return null;

  const horas = Math.floor(total / 60);
  const minutos = total % 60;

  if (horas === 0) return `${minutos} min`;
  if (minutos === 0) return `${horas} h`;

  return `${horas} h ${minutos} min`;
}

/** Los textos que se ofrecen como sugerencia debajo de la caja. */
export const SUGERENCIAS = DURACIONES.map(formatearDuracion);

/**
 * Al revés: de lo que se escribió saca las horas con decimales que van a la
 * base. Devuelve null si no se entiende, y ahí la pantalla avisa.
 *
 * El resultado se redondea a dos decimales porque la columna es NUMERIC(5,2):
 * "20 min" se guarda como 0.33 y se vuelve a leer como 20 min.
 */
export function interpretarDuracion(texto) {
  if (texto == null) return null;

  const limpio = String(texto).trim().toLowerCase().replace(',', '.');
  if (limpio === '') return null;

  const enHoras = calcularHoras(limpio);
  if (enHoras == null || Number.isNaN(enHoras)) return null;

  return Math.round(enHoras * 100) / 100;
}

const MINUTOS = '(?:m|min|mins|minuto|minutos)';
const HORAS = '(?:h|hs|hora|horas)';
const NUMERO = '(\\d+(?:\\.\\d+)?)';

function calcularHoras(limpio) {
  // "1:30"
  const reloj = limpio.match(/^(\d+):([0-5]?\d)$/);
  if (reloj) return Number(reloj[1]) + Number(reloj[2]) / 60;

  // "30 min", "45 minutos"
  const soloMinutos = limpio.match(new RegExp(`^${NUMERO}\\s*${MINUTOS}$`));
  if (soloMinutos) return Number(soloMinutos[1]) / 60;

  // "1 h", "2 hs", "1 h 30", "1h30 min"
  const conHoras = limpio.match(new RegExp(`^${NUMERO}\\s*${HORAS}\\s*(?:${NUMERO}\\s*${MINUTOS}?)?$`));
  if (conHoras) return Number(conHoras[1]) + (conHoras[2] ? Number(conHoras[2]) / 60 : 0);

  // Un número solo: son horas. "2" son 2 h, "1.5" es 1 h 30 min.
  const soloNumero = limpio.match(new RegExp(`^${NUMERO}$`));
  if (soloNumero) return Number(soloNumero[1]);

  return null;
}
