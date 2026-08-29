/**
 * Direcciones del modulo de espacios (HU-2).
 * Se montan bajo /api/espacios (ver rutas/index.js).
 */
import { Router } from 'express';
import * as espacios from '../controladores/espacios.controlador.js';

const router = Router();

// /tipos va ANTES que /:id, si no Express lo toma como un id.
router.get('/tipos', espacios.listarTipos);

router.get('/', espacios.listar);
router.get('/:id', espacios.obtener);
router.post('/', espacios.crear);
router.put('/:id', espacios.actualizar);
router.delete('/:id', espacios.eliminar);

export default router;
