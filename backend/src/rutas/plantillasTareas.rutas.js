import { Router } from 'express';
import * as plantillas from '../controladores/plantillasTareas.controlador.js';

const router = Router();

router.get('/', plantillas.listar);
router.get('/:id', plantillas.obtener);
router.post('/', plantillas.crear);
router.put('/:id', plantillas.actualizar);
router.delete('/:id', plantillas.eliminar);

export default router;
