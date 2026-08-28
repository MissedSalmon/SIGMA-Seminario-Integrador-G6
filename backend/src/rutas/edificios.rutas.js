import { Router } from 'express';
import * as edificiosControlador from '../controladores/edificios.controlador.js';

const router = Router();

// Definición de las rutas del módulo
router.get('/', edificiosControlador.listar);
router.post('/', edificiosControlador.crear);

export default router;
