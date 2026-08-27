/**
 * Responde cuando el cliente pide una ruta que no existe.
 * Va despues de todas las rutas.
 */
export function noEncontrado(req, res) {
  res.status(404).json({
    ok: false,
    mensaje: `La ruta ${req.method} ${req.originalUrl} no existe.`,
  });
}
