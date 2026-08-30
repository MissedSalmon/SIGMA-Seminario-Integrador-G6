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

/** POST /api/especialidades */
export async function crear(req, res) {
  const { nombre } = req.body;
  const nueva = await especialidadesServicio.crear(nombre);
  res.status(201).json({ ok: true, datos: nueva });
}

/** PUT /api/especialidades/:id */
export async function actualizar(req, res) {
  const id = Number(req.params.id);
  const { nombre } = req.body;
  const actualizada = await especialidadesServicio.actualizar(id, nombre);
  res.json({ ok: true, datos: actualizada });
}

/** DELETE /api/especialidades/:id */
export async function eliminar(req, res) {
  const id = Number(req.params.id);
  const borrada = await especialidadesServicio.eliminar(id);
  res.json({ ok: true, datos: borrada });
}
