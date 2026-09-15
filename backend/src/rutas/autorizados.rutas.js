/**
 * Direcciones del modulo de usuarios autorizados (HU-8).
 * Se montan bajo /api/autorizados (ver rutas/index.js).
 */
import { Router } from 'express';
import * as autorizados from '../controladores/autorizados.controlador.js';

const router = Router();

router.get('/', autorizados.listar);
router.get('/:legajo', autorizados.obtener);
router.post('/', autorizados.crear);
router.put('/:legajo', autorizados.actualizar);
router.delete('/:legajo', autorizados.eliminar);

export default router;
