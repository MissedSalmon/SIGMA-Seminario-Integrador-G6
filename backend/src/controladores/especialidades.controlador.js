/**
 * Controlador de especialidades.
 *
 * Solo lectura: ver la nota de src/servicios/especialidades.servicio.js.
 */
import * as especialidadesServicio from '../servicios/especialidades.servicio.js';

/** GET /api/especialidades */
export async function listar(req, res) {
  const especialidades = await especialidadesServicio.obtenerTodos();
  res.json({ ok: true, datos: especialidades });
}
