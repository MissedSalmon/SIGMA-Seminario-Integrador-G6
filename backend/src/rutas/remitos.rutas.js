/**
 * Direcciones del modulo de remitos de ingreso (HU-16).
 * Se montan bajo /api/remitos (ver rutas/index.js).
 *
 * Todo el modulo es del administrador: es quien recibe la mercaderia y carga
 * el comprobante.
 */
import { Router } from 'express';
import * as remitos from '../controladores/remitos.controlador.js';
import { soloAdministrador } from '../middlewares/soloAdministrador.js';

const router = Router();

router.use(soloAdministrador);

router.get('/', remitos.listar);
// Va ANTES que /:id, si no Express la toma como un id.
router.get('/tipos-comprobante', remitos.listarTiposComprobante);
router.get('/:id', remitos.obtener);
router.post('/', remitos.crear);

export default router;
