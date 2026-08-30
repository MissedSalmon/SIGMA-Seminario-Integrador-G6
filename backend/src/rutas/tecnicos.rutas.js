/**
 * Direcciones del modulo de tecnicos (HU-5).
 * Se montan bajo /api/tecnicos (ver rutas/index.js).
 */
import { Router } from 'express';
import * as tecnicos from '../controladores/tecnicos.controlador.js';

const router = Router();

router.get('/', tecnicos.listar);
router.get('/:legajo', tecnicos.obtener);
router.post('/', tecnicos.crear);
router.put('/:legajo', tecnicos.actualizar);
router.delete('/:legajo', tecnicos.eliminar);

export default router;
