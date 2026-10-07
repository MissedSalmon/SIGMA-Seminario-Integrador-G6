/**
 * Direcciones de tipos de prestador de servicio (HU-24).
 * Se montan bajo /api/tipos-prestador (ver rutas/index.js).
 */
import { Router } from 'express';
import * as tiposPrestadorControlador from '../controladores/tiposPrestador.controlador.js';

const router = Router();

router.get('/', tiposPrestadorControlador.listar);
router.get('/:id', tiposPrestadorControlador.obtener);
router.post('/', tiposPrestadorControlador.crear);
router.put('/:id', tiposPrestadorControlador.actualizar);
router.delete('/:id', tiposPrestadorControlador.eliminar);

export default router;
