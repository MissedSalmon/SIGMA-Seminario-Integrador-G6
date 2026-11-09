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

// Resumen general cuantitativo de KPIs instantáneos (M-01, M-07, M-15, M-16)
router.get('/resumen-general', estadisticas.resumenGeneral);

// Distribución de activos por estado y por edificio (M-02, M-03)
router.get('/activos', estadisticas.distribucionActivos);

// Órdenes de trabajo por origen, estado, prioridad y cumplimiento de tareas (M-08, M-09, M-10, M-12)
router.get('/ordenes-trabajo', estadisticas.ordenesTrabajo);

// Evolución mensual de altas/cierres de tickets y estados (M-11, M-05)
router.get('/tickets-evolucion', estadisticas.evolucionTickets);

// Carga activa de tareas por técnico (M-14)
router.get('/tecnicos-carga', estadisticas.cargaTecnicos);

// Payload integral unificado del panel con metadatos de frescura y alcance (S13, S14, S15)
router.get('/panel-completo', estadisticas.panelCompleto);

export default router;
