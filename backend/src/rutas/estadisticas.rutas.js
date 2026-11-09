/**
 * Direcciones de las estadísticas del panel. Se montan bajo /api/estadisticas
 * (ver rutas/index.js). Sólo para el administrador.
 */
import { Router } from 'express';
import * as estadisticas from '../controladores/estadisticas.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

router.use(soloAdministrador);

// Ranking de áreas por cantidad de fallas (HU-34)
router.get('/areas-incidencia', estadisticas.areasConMayorIncidencia);

// Tiempos promedio de resolución de los tickets cerrados (Sprint 7)
router.get('/tiempos-resolucion', estadisticas.tiemposResolucion);

export default router;
