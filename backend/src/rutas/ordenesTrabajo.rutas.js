/**
 * Direcciones del modulo de ordenes de trabajo (HU-14).
 * Se montan bajo /api/ordenes-trabajo (ver rutas/index.js).
 */
import { Router } from 'express';
import * as ordenes from '../controladores/ordenesTrabajo.controlador.js';

const router = Router();

// Estas dos van ANTES que /:id, si no Express las toma como un id.
router.get('/estados', ordenes.listarEstados);
router.get('/prioridades', ordenes.listarPrioridades);

router.get('/', ordenes.listar);
router.get('/:id', ordenes.obtener);
router.post('/', ordenes.crear);
router.put('/:id', ordenes.actualizar);

// Las tareas de la OT: son parte de la OT, no un modulo aparte.
router.post('/:id/tareas', ordenes.agregarTarea);
router.put('/:id/tareas/:idTarea', ordenes.actualizarTarea);
router.delete('/:id/tareas/:idTarea', ordenes.eliminarTarea);

export default router;
