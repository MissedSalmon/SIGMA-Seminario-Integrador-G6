/**
 * Controlador de las estadísticas del panel (Sprint 7).
 */
import * as servicio from '../servicios/estadisticas.servicio.js';

/** GET /api/estadisticas/areas-incidencia?desde=&hasta=&tipoFalla= (HU-34) */
export async function areasConMayorIncidencia(req, res) {
  const { desde, hasta, tipoFalla } = req.query;
  res.json({
    ok: true,
    datos: await servicio.obtenerAreasConMayorIncidencia({ desde, hasta, tipoFalla }),
  });
}

/** GET /api/estadisticas/tiempos-resolucion?desde=&hasta= (tiempos promedio de resolución) */
export async function tiemposResolucion(req, res) {
  const { desde, hasta } = req.query;
  res.json({
    ok: true,
    datos: await servicio.obtenerTiemposResolucion({ desde, hasta }),
  });
}

/** GET /api/estadisticas/resumen-general (KPIs instantáneos M-01, M-07, M-15, M-16) */
export async function resumenGeneral(req, res) {
  res.json({
    ok: true,
    datos: await servicio.obtenerResumenGeneral(),
  });
}

/** GET /api/estadisticas/activos (distribución de activos por estado y por edificio M-02, M-03) */
export async function distribucionActivos(req, res) {
  res.json({
    ok: true,
    datos: await servicio.obtenerDistribucionActivos(),
  });
}

/** GET /api/estadisticas/ordenes-trabajo?desde=&hasta= (OTs por origen, estado, prioridad y tareas M-08, M-09, M-10, M-12) */
export async function ordenesTrabajo(req, res) {
  const { desde, hasta } = req.query;
  res.json({
    ok: true,
    datos: await servicio.obtenerOrdenesTrabajo({ desde, hasta }),
  });
}

/** GET /api/estadisticas/tickets-evolucion?desde=&hasta= (evolución mensual y tickets por estado M-11, M-05) */
export async function evolucionTickets(req, res) {
  const { desde, hasta } = req.query;
  res.json({
    ok: true,
    datos: await servicio.obtenerEvolucionTickets({ desde, hasta }),
  });
}

/** GET /api/estadisticas/tecnicos-carga (carga de trabajo activa por técnico M-14) */
export async function cargaTecnicos(req, res) {
  res.json({
    ok: true,
    datos: await servicio.obtenerCargaTecnicos(),
  });
}

/** GET /api/estadisticas/panel-completo?desde=&hasta=&tipoFalla= (consolidado analítico con metadatos S13, S14, S15) */
export async function panelCompleto(req, res) {
  const { desde, hasta, tipoFalla } = req.query;
  const resultado = await servicio.obtenerPanelCompleto({ desde, hasta, tipoFalla });
  res.json({
    ok: true,
    datos: resultado.datos,
    metadatos: resultado.metadatos,
  });
}
