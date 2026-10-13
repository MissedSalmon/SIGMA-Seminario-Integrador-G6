/**
 * Direcciones de las tareas del tecnico (HU-21 consultar, HU-22 ejecutar).
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
router.get('/materiales', tareas.listarMateriales);
router.get('/herramientas', tareas.listarHerramientas);
router.post('/herramientas/:codigo/devolver', tareas.devolverHerramienta);
router.get('/historial/materiales', tareas.historialMateriales);
router.get('/historial/herramientas', tareas.historialHerramientas);

router.get('/mias', tareas.listarMias);
router.get('/mias/:idOt/:idTarea', tareas.obtenerMia);
router.post('/mias/:idOt/:idTarea/observaciones', tareas.agregarObservacion);
router.post('/mias/:idOt/:idTarea/iniciar', tareas.iniciar);
router.post('/mias/:idOt/:idTarea/finalizar', tareas.finalizar);
router.post('/mias/:idOt/:idTarea/materiales', tareas.registrarMateriales);
router.post('/mias/:idOt/:idTarea/herramientas', tareas.tomarHerramienta);

export default router;
