/**
 * Llamadas a la API de planes de mantenimiento preventivo (Sprint 5).
 */
import { api } from './api.js';

/**
 * Lista los planes de mantenimiento preventivo según filtros.
 *
 * @param {object} [filtros]
 * @param {string|number} [filtros.tipoActivoId]
 * @param {string} [filtros.estado] - 'activo' | 'baja' | 'todos'
 * @param {string} [filtros.buscar]
 */
export async function listarPlanes(filtros = {}) {
  const { tipoActivoId, estado, buscar } = filtros;

  const { data } = await api.get('/planes-mantenimiento', {
    params: {
      ...(tipoActivoId ? { tipoActivoId } : {}),
      ...(estado ? { estado } : {}),
      ...(buscar ? { buscar } : {}),
    },
  });

  return data.datos;
}

/**
 * Obtiene el detalle completo de un plan por su ID.
 */
export async function obtenerPlan(id) {
  const { data } = await api.get(`/planes-mantenimiento/${id}`);
  return data.datos;
}

/**
 * Da de alta un nuevo plan de mantenimiento preventivo.
 */
export async function crearPlan(datos) {
  const { data } = await api.post('/planes-mantenimiento', datos);
  return data.datos;
}

/**
 * Modifica un plan de mantenimiento preventivo existente.
 */
export async function actualizarPlan(id, datos) {
  const { data } = await api.put(`/planes-mantenimiento/${id}`, datos);
  return data.datos;
}

/**
 * Da de baja lógica un plan de mantenimiento preventivo.
 */
export async function darDeBajaPlan(id) {
  const { data } = await api.delete(`/planes-mantenimiento/${id}`);
  return data;
}

/**
 * Consulta los planes por vencer en los próximos N días (por defecto 7).
 */
export async function obtenerPlanesPorVencer(dias = 7) {
  const { data } = await api.get('/planes-mantenimiento/por-vencer', {
    params: { dias },
  });
  return data.datos;
}

/**
 * Invoca el endpoint protegido para procesar la generación automática de OTs.
 */
export async function procesarGeneracionAutomatica(fechaCorte) {
  const { data } = await api.post('/planes-mantenimiento/procesar-generacion', {
    ...(fechaCorte ? { fechaCorte } : {}),
  });
  return data.datos;
}
