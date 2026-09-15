/**
 * Llamadas a la API de tickets (HU-9 alta, HU-10 consulta).
 */
import { api } from './api.js';

export async function registrarTicket(ticket) {
  const { data } = await api.post('/tickets', ticket);
  return data.datos;
}

/**
 * Lista los tickets del mas nuevo al mas viejo. Los filtros se combinan.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.estado]       - "Creado", "Validado", ...
 * @param {string} [filtros.desde]        - fecha/hora ISO (inclusive)
 * @param {string} [filtros.hasta]        - fecha/hora ISO (inclusive)
 * @param {string} [filtros.codigoActivo]
 * @param {number|string} [filtros.idArea]
 */
export async function listarTickets(filtros = {}) {
  const { estado, desde, hasta, codigoActivo, idArea } = filtros;

  const { data } = await api.get('/tickets', {
    params: {
      ...(estado ? { estado } : {}),
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(codigoActivo ? { codigoActivo } : {}),
      ...(idArea ? { idArea } : {}),
    },
  });

  return data.datos;
}

/** Los estados posibles de un ticket, en el orden del flujo. */
export async function listarEstadosDeTicket() {
  const { data } = await api.get('/tickets/estados');
  return data.datos;
}

export async function obtenerTicket(id) {
  const { data } = await api.get(`/tickets/${id}`);
  return data.datos;
}

export async function validarTicket(id) {
  const { data } = await api.put(`/tickets/${id}/validar`);
  return data.datos;
}

export async function rechazarTicket(id, motivo) {
  const { data } = await api.put(`/tickets/${id}/rechazar`, { motivo });
  return data.datos;
}
