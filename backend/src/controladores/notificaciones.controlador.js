/**
 * Controlador de las notificaciones de la campana.
 *
 * El rol y el legajo salen de la sesion (req.usuario), nunca de la direccion:
 * cada uno recibe sólo las suyas.
 */
import * as servicio from '../servicios/notificaciones.servicio.js';

/** GET /api/notificaciones */
export async function listar(req, res) {
  res.json({ ok: true, datos: await servicio.obtenerDelUsuario(req.usuario) });
}
