import { Router } from 'express';
import * as tiposActivos from '../controladores/tiposActivos.controlador.js';

const router = Router();

router.get('/', tiposActivos.listar);
router.get('/:id', tiposActivos.obtener);
router.post('/', tiposActivos.crear);
router.put('/:id', tiposActivos.actualizar);
router.delete('/:id', tiposActivos.eliminar);

export default router;
