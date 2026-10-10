/**
 * Direcciones del modulo de tickets (HU-9 alta, HU-10 consulta).
 * Se montan bajo /api/tickets (ver rutas/index.js).
 *
 * Reglas de acceso:
 *   - Toda ruta requiere sesión JWT activa.
 *   - Administrador: puede hacer todo (listar todos, validar, rechazar).
 *   - Autorizado: puede crear tickets y ver solo los suyos.
 *   - Técnico: solo lectura de los estados.
 */
import { Router } from 'express';
import * as tickets from '../controladores/tickets.controlador.js';
import { validarSesion, protegerPorRol } from '../middlewares/auth.middleware.js';

const router = Router();

// Toda ruta de tickets requiere sesión activa.
router.use(validarSesion);

// /estados va ANTES que /:id, si no Express lo toma como un id.
router.get('/estados', tickets.listarEstados);

// Listar: administrador ve todos; autorizado ve solo los suyos (filtrado en el servicio).
router.get('/', protegerPorRol(['administrador', 'autorizado']), tickets.listar);

// Detalle: administrador ve cualquiera; autorizado solo los propios (validado en el servicio).
router.get('/:id', protegerPorRol(['administrador', 'autorizado']), tickets.obtener);

// Crear: solo autorizados (y el administrador para pruebas o emergencias).
router.post('/', protegerPorRol(['administrador', 'autorizado']), tickets.crear);

// Validar y rechazar: solo el administrador.
router.put('/:id/validar', protegerPorRol(['administrador']), tickets.validar);
router.put('/:id/rechazar', protegerPorRol(['administrador']), tickets.rechazar);

export default router;
