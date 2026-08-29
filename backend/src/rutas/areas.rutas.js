/**
 * Direcciones del modulo de areas funcionales (HU-3).
 * Se montan bajo /api/areas (ver rutas/index.js).
 */
import { Router } from 'express';
import * as areas from '../controladores/areas.controlador.js';

const router = Router();

router.get('/', areas.listar);
router.get('/:id', areas.obtener);
router.post('/', areas.crear);
router.put('/:id', areas.actualizar);
router.delete('/:id', areas.eliminar);

export default router;
