/**
 * Direcciones del modulo de edificios (HU-1).
 * Se montan bajo /api/edificios (ver rutas/index.js).
 */
import { Router } from 'express';
import * as edificios from '../controladores/edificios.controlador.js';

const router = Router();

router.get('/', edificios.listar);
router.get('/:id', edificios.obtener);
router.post('/', edificios.crear);
router.put('/:id', edificios.actualizar);
router.delete('/:id', edificios.eliminar);

export default router;
