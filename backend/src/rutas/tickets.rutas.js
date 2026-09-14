/**
 * Direcciones del modulo de tickets (HU-9 alta, HU-10 consulta).
 * Se montan bajo /api/tickets (ver rutas/index.js).
 */
import { Router } from 'express';
import * as tickets from '../controladores/tickets.controlador.js';

const router = Router();

// /estados va ANTES que /:id, si no Express lo toma como un id.
router.get('/estados', tickets.listarEstados);

router.get('/', tickets.listar);
router.get('/:id', tickets.obtener);
router.post('/', tickets.crear);
router.put('/:id/validar', tickets.validar);
router.put('/:id/rechazar', tickets.rechazar);

export default router;
