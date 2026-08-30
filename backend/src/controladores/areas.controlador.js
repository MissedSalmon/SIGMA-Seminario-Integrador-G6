/**
 * Controlador de areas funcionales (HU-3).
 */
import * as areasServicio from '../servicios/areas.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un numero de area valido.`);
  }

  return id;
}

function leerCuerpo(req) {
  const { nombre, idEspacio } = req.body;
  return { nombre, idEspacio };
}

/** GET /api/areas */
export async function listar(req, res) {
  const areas = await areasServicio.obtenerTodos();
  res.json({ ok: true, datos: areas });
}

/** GET /api/areas/:id */
export async function obtener(req, res) {
  const area = await areasServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: area });
}

/** POST /api/areas */
export async function crear(req, res) {
  const nueva = await areasServicio.crear(leerCuerpo(req));
  res.status(201).json({ ok: true, datos: nueva });
}

/** PUT /api/areas/:id */
export async function actualizar(req, res) {
  const area = await areasServicio.actualizar(leerId(req), leerCuerpo(req));
  res.json({ ok: true, datos: area });
}

/** DELETE /api/areas/:id */
export async function eliminar(req, res) {
  const area = await areasServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: area, mensaje: `Se elimino "${area.nombre}".` });
}
