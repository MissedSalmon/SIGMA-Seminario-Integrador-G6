import { Router } from 'express';
import * as tiposEspacioControlador from '../controladores/tiposEspacio.controlador.js';

const router = Router();

router.get('/', tiposEspacioControlador.listar);
router.get('/:id', tiposEspacioControlador.obtener);
router.post('/', tiposEspacioControlador.crear);
router.put('/:id', tiposEspacioControlador.actualizar);
router.delete('/:id', tiposEspacioControlador.eliminar);

export default router;
