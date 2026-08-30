/**
 * Direcciones del modulo de especialidades.
 * Se montan bajo /api/especialidades (ver rutas/index.js).
 */
import { Router } from 'express';
import * as especialidades from '../controladores/especialidades.controlador.js';

const router = Router();

router.get('/', especialidades.listar);

export default router;
