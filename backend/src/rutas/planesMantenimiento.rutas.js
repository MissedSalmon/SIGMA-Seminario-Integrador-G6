import { Router } from 'express';
import * as ctrl from '../controladores/planesMantenimiento.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

// Todas las operaciones de planes preventivos están restringidas a rol administrador
router.use(soloAdministrador);

// Rutas estáticas antes de las parametrizadas
router.get('/por-vencer', ctrl.planesPorVencer);
router.post('/procesar-generacion', ctrl.procesarGeneracion);

// CRUD
router.get('/', ctrl.listar);
router.post('/', ctrl.crear);
router.get('/:id', ctrl.obtener);
router.put('/:id', ctrl.actualizar);
router.delete('/:id', ctrl.darDeBaja);

export default router;
