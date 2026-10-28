/**
 * Direcciones de gestion de usuarios (HU Gestion de usuarios, Sprint 6).
 * Se montan bajo /api/usuarios (ver rutas/index.js).
 *
 * Todas son solo para un administrador activo. El resto recibe 403.
 */
import { Router } from 'express';
import * as usuarios from '../controladores/usuarios.controlador.js';
import { soloAdministradorActivo } from '../middlewares/soloAdministradorActivo.js';

const router = Router();

router.use(soloAdministradorActivo);

router.get('/', usuarios.listar);
router.get('/personas-sin-usuario', usuarios.personasSinUsuario);
router.post('/', usuarios.crear);

// Baja logica y su vuelta atras. Nunca se borra un usuario.
router.put('/:id/desactivar', usuarios.desactivar);
router.put('/:id/activar', usuarios.activar);

// Restablecer la contraseña (HU-31). La base vuelve a controlar que sea un administrador activo.
router.post('/:identificador/restablecer-contrasena', usuarios.restablecerContrasena);

export default router;
