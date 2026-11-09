/**
 * Llamadas a la API de estadísticas del panel (Sprint 7).
 */
import { api } from './api.js';

/**
 * Ranking de áreas por cantidad de fallas, de mayor a menor (HU-34).
 *
 * @param {object} [filtros]
 * @param {string} [filtros.desde]     - fecha/hora ISO (inclusive)
 * @param {string} [filtros.hasta]     - fecha/hora ISO (inclusive)
 * @param {string} [filtros.tipoFalla] - "Eléctrica", "Sanitaria", ...
 */
export async function listarAreasConMayorIncidencia(filtros = {}) {
  const { desde, hasta, tipoFalla } = filtros;

  const { data } = await api.get('/estadisticas/areas-incidencia', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(tipoFalla ? { tipoFalla } : {}),
    },
  });

  return data.datos;
}

/**
 * Tiempo promedio de resolución de los tickets cerrados (Sprint 7): general y
 * por área, por tipo de activo y por técnico. Los tiempos vienen en segundos.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.desde] - fecha/hora ISO: cerrados desde ese momento (inclusive)
 * @param {string} [filtros.hasta] - fecha/hora ISO: cerrados hasta ese momento (inclusive)
 */
export async function obtenerTiemposResolucion(filtros = {}) {
  const { desde, hasta } = filtros;

  const { data } = await api.get('/estadisticas/tiempos-resolucion', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });

  return data.datos;
}
