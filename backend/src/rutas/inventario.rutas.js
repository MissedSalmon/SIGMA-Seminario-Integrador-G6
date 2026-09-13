import { Router } from 'express';
import * as inventario from '../controladores/inventario.controlador.js';

const router = Router();

router.get('/tipos', inventario.listarTipos);
router.post('/tipos', inventario.crearTipo);
router.get('/tipos/:id', inventario.obtenerTipo);
router.put('/tipos/:id', inventario.actualizarTipo);
router.delete('/tipos/:id', inventario.eliminarTipo);

router.get('/', inventario.listarItems);
router.post('/', inventario.crearItem);
router.get('/:codigo', inventario.obtenerItem);
router.put('/:codigo', inventario.actualizarItem);
router.delete('/:codigo', inventario.eliminarItem);

export default router;