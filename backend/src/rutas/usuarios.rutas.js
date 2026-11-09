/**
 * Direcciones sobre el usuario de una persona: desactivarlo, activarlo y
 * restablecer su contraseña. Se montan bajo /api/usuarios (ver rutas/index.js).
 *
 * Todas son solo para un administrador activo. El resto recibe 403.
 */
import { Router } from 'express';
import * as usuarios from '../controladores/usuarios.controlador.js';
import { soloAdministradorActivo } from '../middlewares/soloAdministradorActivo.js';

const router = Router();

router.use(soloAdministradorActivo);

// Baja logica y su vuelta atras. Nunca se borra un usuario.
router.put('/:id/desactivar', usuarios.desactivar);
router.put('/:id/activar', usuarios.activar);

// Restablecer la contraseña (HU-31). La base vuelve a controlar que sea un administrador activo.
router.post('/:identificador/restablecer-contrasena', usuarios.restablecerContrasena);

export default router;
