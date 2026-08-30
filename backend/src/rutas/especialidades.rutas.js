/**
 * Direcciones del modulo de especialidades.
 * Se montan bajo /api/especialidades (ver rutas/index.js).
 */
import { Router } from 'express';
import * as especialidades from '../controladores/especialidades.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

// Listado público
router.get('/', especialidades.listar);

// Operaciones de escritura (solo administradores)
router.post('/', soloAdministrador, especialidades.crear);
router.put('/:id', soloAdministrador, especialidades.actualizar);
router.delete('/:id', soloAdministrador, especialidades.eliminar);

export default router;
