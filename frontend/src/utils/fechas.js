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
