/**
 * Llamadas a la API de tickets (HU-9).
 *
 * Por ahora sólo el alta, que es lo que necesita la pantalla de registrar.
 * El endpoint POST /api/tickets todavía no existe en el backend.
 */
import { api } from './api.js';

export async function registrarTicket(ticket) {
  const { data } = await api.post('/tickets', ticket);
  return data.datos;
}
