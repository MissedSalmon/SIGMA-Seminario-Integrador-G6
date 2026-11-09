/**
 * Direcciones del modulo de tecnicos (HU-5).
 * Se montan bajo /api/tecnicos (ver rutas/index.js).
 */
import { Router } from 'express';
import * as tecnicos from '../controladores/tecnicos.controlador.js';
import { validarSesion, protegerPorRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/carga-trabajo', validarSesion, protegerPorRol(['administrador']), tecnicos.listarCargaTrabajo);
router.get('/:legajo/carga-trabajo', validarSesion, protegerPorRol(['administrador']), tecnicos.listarTareasDeCarga);

router.get('/', tecnicos.listar);
router.get('/:legajo', tecnicos.obtener);
router.post('/', tecnicos.crear);
router.put('/:legajo', tecnicos.actualizar);
router.delete('/:legajo', tecnicos.eliminar);

export default router;
