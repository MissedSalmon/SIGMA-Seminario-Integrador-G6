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

/** PATCH /api/notificaciones/leidas - marca todas como leidas. */
export async function marcarTodasLeidas(req, res) {
  await servicio.marcarTodasLeidas(req.usuario);
  res.json({ ok: true, datos: null });
}

/** PATCH /api/notificaciones/:clave - body { leida: true | false } */
export async function marcarLeida(req, res) {
  const leida = req.body?.leida === undefined ? true : req.body.leida === true;
  await servicio.marcarLeida(req.usuario, req.params.clave, leida);
  res.json({ ok: true, datos: { clave: req.params.clave, leida } });
}

/** DELETE /api/notificaciones/:clave */
export async function eliminar(req, res) {
  await servicio.eliminar(req.usuario, req.params.clave);
  res.json({ ok: true, datos: null });
}
