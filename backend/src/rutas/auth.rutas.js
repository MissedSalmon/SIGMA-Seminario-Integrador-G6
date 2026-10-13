import { Router } from 'express';
import { login, perfil, cambiarPassword, logout } from '../controladores/auth.controlador.js';
import { validarSesion } from '../middlewares/auth.middleware.js';

const router = Router();

// Públicas
router.post('/login', login);
router.post('/logout', logout);

// Protegidas
router.use(validarSesion);
router.get('/perfil', perfil);
router.post('/cambiar-password', cambiarPassword);

export default router;
