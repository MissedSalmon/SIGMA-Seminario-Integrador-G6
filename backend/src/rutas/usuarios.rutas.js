import { Router } from 'express';
import { restablecerContrasena } from '../controladores/usuarios.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

router.post('/:identificador/restablecer-contrasena', soloAdministrador, restablecerContrasena);

export default router;
