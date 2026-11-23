/**
 * Direcciones de las notificaciones de la campana. Se montan bajo
 * /api/notificaciones (ver rutas/index.js).
 *
 * Requiere sesion JWT. Tienen notificaciones el administrador, el tecnico y el
 * solicitante (rol "autorizado").
 */
import { Router } from 'express';
import * as notificaciones from '../controladores/notificaciones.controlador.js';
import { validarSesion, protegerPorRol } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(validarSesion);
router.use(protegerPorRol(['administrador', 'tecnico', 'autorizado']));

router.get('/', notificaciones.listar);
// Antes que '/:clave', para que "leidas" no se tome como una clave.
router.patch('/leidas', notificaciones.marcarTodasLeidas);
router.patch('/:clave', notificaciones.marcarLeida);
router.delete('/:clave', notificaciones.eliminar);

export default router;
