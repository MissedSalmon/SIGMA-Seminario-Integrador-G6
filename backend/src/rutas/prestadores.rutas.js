/**
 * Direcciones de prestadores de servicio (HU-25).
 * Se montan bajo /api/prestadores (ver rutas/index.js).
 */
import { Router } from 'express';
import * as prestadores from '../controladores/prestadores.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

router.get('/', prestadores.listar);
router.get('/:id', prestadores.obtener);

// Operaciones de escritura (solo administradores)
router.post('/', soloAdministrador, prestadores.crear);
router.put('/:id', soloAdministrador, prestadores.actualizar);
router.delete('/:id', soloAdministrador, prestadores.eliminar);

export default router;
