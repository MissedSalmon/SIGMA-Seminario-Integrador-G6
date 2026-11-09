import { Router } from 'express';
import * as inventario from '../controladores/inventario.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

router.get('/tipos', inventario.listarTipos);
router.post('/tipos', inventario.crearTipo);
router.get('/tipos/:id', inventario.obtenerTipo);
router.put('/tipos/:id', inventario.actualizarTipo);
router.delete('/tipos/:id', inventario.eliminarTipo);

router.get('/', inventario.listarItems);
router.post('/', inventario.crearItem);
// Los materiales por debajo del stock minimo (HU-33). Va antes de /:codigo
// para que "alertas" no se tome como un codigo.
router.get('/alertas', inventario.listarAlertasStock);
router.get('/:codigo', inventario.obtenerItem);
// El historial de ingresos y consumos del item (HU-16).
router.get('/:codigo/movimientos', inventario.listarMovimientos);
// En que tareas se consumio el material (HU-35).
router.get('/:codigo/consumos', inventario.listarConsumos);
router.put('/:codigo', inventario.actualizarItem);
// Ajuste de stock de un material que no viene de un remito ni de una tarea (06/11/2026).
router.post('/:codigo/ajustes', soloAdministrador, inventario.registrarAjuste);
// Asignar una herramienta a un tecnico, registrar que la devolvio y ver quien la tuvo.
router.get('/:codigo/asignaciones', inventario.listarAsignaciones);
router.post('/:codigo/asignacion', inventario.asignarHerramienta);
router.delete('/:codigo/asignacion', inventario.devolverHerramienta);
// Volver a poner en servicio una herramienta dada de baja.
router.post('/:codigo/en-servicio', inventario.ponerEnServicio);
router.delete('/:codigo', inventario.eliminarItem);

export default router;