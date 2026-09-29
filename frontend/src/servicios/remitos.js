/**
 * Llamadas a la API de remitos de ingreso al deposito (HU-16).
 */
import { api } from './api.js';

/**
 * Los remitos, del mas nuevo al mas viejo por fecha de recepcion.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.desde] - "2026-09-01"
 * @param {string} [filtros.hasta] - "2026-09-30"
 */
export async function listarRemitos(filtros = {}) {
  const { desde, hasta } = filtros;

  const { data } = await api.get('/remitos', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });

  return data.datos;
}

export async function obtenerRemito(id) {
  const { data } = await api.get(`/remitos/${id}`);
  return data.datos;
}

/**
 * Registra el remito y sube el stock de cada item.
 *
 * @param {object} remito
 * @param {string} remito.proveedor
 * @param {string} remito.fechaRecepcion - "2026-09-28"
 * @param {Array}  remito.items          - [{ codigo, cantidad }]
 * @param {string} [remito.numero]
 * @param {string} [remito.observaciones]
 */
export async function registrarRemito(remito) {
  const { data } = await api.post('/remitos', remito);
  return data.datos;
}
