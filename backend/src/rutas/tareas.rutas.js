/**
 * Direcciones de las tareas del tecnico (HU-21).
 * Se montan bajo /api/tareas (ver rutas/index.js).
 *
 * Reglas de acceso:
 *   - Toda ruta requiere sesión JWT activa.
 *   - Solo el técnico: cada uno ve únicamente las tareas que le asignaron.
 *     El administrador las ve desde el detalle de cada OT.
 */
import { Router } from 'express';
import * as tareas from '../controladores/tareas.controlador.js';
import { validarSesion, protegerPorRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(validarSesion);
router.use(protegerPorRol(['tecnico']));

router.get('/prioridades', tareas.listarPrioridades);
router.get('/mias', tareas.listarMias);
router.get('/mias/:idOt/:idTarea', tareas.obtenerMia);

export default router;
