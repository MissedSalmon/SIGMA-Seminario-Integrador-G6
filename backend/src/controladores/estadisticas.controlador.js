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
