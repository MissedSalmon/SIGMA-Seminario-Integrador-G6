/**
 * Direcciones de prestadores de servicio.
 * Se montan bajo /api/prestadores (ver rutas/index.js).
 */
import { Router } from 'express';
import * as prestadores from '../controladores/prestadores.controlador.js';

const router = Router();

router.get('/', prestadores.listar);

export default router;
