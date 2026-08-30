/**
 * Direcciones del modulo de activos (HU-7).
 * Se montan bajo /api/activos (ver rutas/index.js).
 */
import { Router } from 'express';
import * as activos from '../controladores/activos.controlador.js';

const router = Router();

// /estados va ANTES que /:codigo, si no Express lo toma como un codigo.
router.get('/estados', activos.listarEstados);

router.get('/', activos.listar);
router.get('/:codigo', activos.obtener);
router.post('/', activos.crear);
router.put('/:codigo', activos.actualizar);
// No borra: da de baja, o sea que pasa el activo a Retirado.
router.delete('/:codigo', activos.eliminar);

export default router;
