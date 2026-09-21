/**
 * Ayudas para mostrar y mandar fechas.
 *
 * La API guarda fechas con hora en UTC ("2026-09-13T16:36:19+00:00"). Aca se
 * pasan a la hora de la maquina de quien mira la pantalla, que es como se
 * leen en la facultad.
 */

/** De un ISO arma "13/09/2026 13:36". Si no hay fecha, devuelve "-". */
export function formatearFechaHora(iso) {
  if (!iso) return '-';

  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return '-';

  return fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Los dos extremos de un dia elegido en un <input type="date"> ("2026-09-13"),
 * como instantes ISO en la zona horaria del navegador. Sirven para mandarle
 * a la API un rango que agarre el dia completo, de 00:00 a 23:59:59.
 */
export function inicioDelDia(fechaTexto) {
  if (!fechaTexto) return null;
  const fecha = new Date(`${fechaTexto}T00:00:00`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

export function finDelDia(fechaTexto) {
  if (!fechaTexto) return null;
  const fecha = new Date(`${fechaTexto}T23:59:59.999`);
  return Number.isNaN(fecha.getTime()) ? null : fecha.toISOString();
}

/**
 * La fecha de hoy en el formato que entiende un <input type="date">
 * ("2026-09-18").
 *
 * Se arma con el dia de la maquina y no con UTC a proposito: en Argentina,
 * despues de las 9 de la noche, el dia en UTC ya es el siguiente, y una fecha
 * de nacimiento no puede depender de la hora a la que se carga.
 */
export function hoyTexto() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * La ultima fecha de nacimiento con la que una persona ya tiene `anios` anios
 * cumplidos, en el formato de un <input type="date">.
 *
 * Es hoy menos esa cantidad de anios. Quien nacio justo ese dia cumple hoy, asi
 * que entra: por eso la comparacion que la usa es "mayor que" y no "mayor o
 * igual". Sirve para las dos cosas, para validar y para el max= del almanaque.
 */
export function fechaMinimaParaEdad(anios) {
  const ahora = new Date();
  const limite = new Date(ahora.getFullYear() - anios, ahora.getMonth(), ahora.getDate());

  const mes = String(limite.getMonth() + 1).padStart(2, '0');
  const dia = String(limite.getDate()).padStart(2, '0');

  return `${limite.getFullYear()}-${mes}-${dia}`;
}

/**
 * La fecha de hoy escrita como se lee en la facultad: "18/09/2026".
 *
 * Es para mostrar, no para mandar: lo que va a la API son las funciones de
 * arriba. Se usa el dia de la maquina de quien mira la pantalla.
 */
export function hoyLegible() {
  return new Date().toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
