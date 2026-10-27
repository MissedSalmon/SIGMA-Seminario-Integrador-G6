/**
 * Direcciones de las notificaciones de la campana. Se montan bajo
 * /api/notificaciones (ver rutas/index.js).
 *
 * Requiere sesion JWT. Por ahora sólo el administrador y el tecnico tienen
 * notificaciones.
 */
import { Router } from 'express';
import * as notificaciones from '../controladores/notificaciones.controlador.js';
import { validarSesion, protegerPorRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(validarSesion);
router.use(protegerPorRol(['administrador', 'tecnico']));

router.get('/', notificaciones.listar);

export default router;
