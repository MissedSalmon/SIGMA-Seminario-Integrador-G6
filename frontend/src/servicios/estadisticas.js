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

/**
 * Resumen general cuantitativo de KPIs instantáneos (M-01, M-07, M-15, M-16).
 */
export async function obtenerResumenGeneral() {
  const { data } = await api.get('/estadisticas/resumen-general');
  return data.datos;
}

/**
 * Distribución de activos por estado y por edificio (M-02, M-03).
 */
export async function obtenerDistribucionActivos() {
  const { data } = await api.get('/estadisticas/activos');
  return data.datos;
}

/**
 * Distribución de órdenes de trabajo por origen, estado, prioridad y cumplimiento (M-08, M-09, M-10, M-12).
 */
export async function obtenerOrdenesTrabajo(filtros = {}) {
  const { desde, hasta } = filtros;
  const { data } = await api.get('/estadisticas/ordenes-trabajo', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });
  return data.datos;
}

/**
 * Evolución mensual de altas/cierres de tickets y estados (M-11, M-05).
 */
export async function obtenerEvolucionTickets(filtros = {}) {
  const { desde, hasta } = filtros;
  const { data } = await api.get('/estadisticas/tickets-evolucion', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
    },
  });
  return data.datos;
}

/**
 * Carga activa de tareas por técnico (M-14).
 */
export async function obtenerCargaTecnicos() {
  const { data } = await api.get('/estadisticas/tecnicos-carga');
  return data.datos;
}

/**
 * Payload integral unificado del panel con metadatos de frescura y alcance (S13, S14, S15).
 */
export async function obtenerPanelCompleto(filtros = {}) {
  const { desde, hasta, tipoFalla } = filtros;
  const { data } = await api.get('/estadisticas/panel-completo', {
    params: {
      ...(desde ? { desde } : {}),
      ...(hasta ? { hasta } : {}),
      ...(tipoFalla ? { tipoFalla } : {}),
    },
  });
  return {
    datos: data.datos,
    metadatos: data.metadatos,
  };
}
