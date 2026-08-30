/**
 * Controlador de espacios (HU-2).
 */
import * as espaciosServicio from '../servicios/espacios.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un numero de espacio valido.`);
  }

  return id;
}

/** Toma del cuerpo solo los campos que son del espacio. */
function leerCuerpo(req) {
  const { idEdificio, nombre, tipo, piso, numero, dimensiones } = req.body;
  return { idEdificio, nombre, tipo, piso, numero, dimensiones };
}

/**
 * GET /api/espacios
 * GET /api/espacios?idEdificio=1  -> solo los de ese edificio
 */
export async function listar(req, res) {
  const filtro = req.query.idEdificio ? Number(req.query.idEdificio) : null;

  if (filtro !== null && !Number.isInteger(filtro)) {
    throw datoInvalido(`"${req.query.idEdificio}" no es un numero de edificio valido.`);
  }

  const espacios = await espaciosServicio.obtenerTodos(filtro);
  res.json({ ok: true, datos: espacios });
}

/** GET /api/espacios/tipos */
export async function listarTipos(req, res) {
  const tipos = await espaciosServicio.obtenerTipos();
  res.json({ ok: true, datos: tipos });
}

/** GET /api/espacios/:id */
export async function obtener(req, res) {
  const espacio = await espaciosServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: espacio });
}

/** POST /api/espacios */
export async function crear(req, res) {
  const nuevo = await espaciosServicio.crear(leerCuerpo(req));
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/espacios/:id */
export async function actualizar(req, res) {
  const espacio = await espaciosServicio.actualizar(leerId(req), leerCuerpo(req));
  res.json({ ok: true, datos: espacio });
}

/** DELETE /api/espacios/:id */
export async function eliminar(req, res) {
  const espacio = await espaciosServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: espacio, mensaje: `Se elimino "${espacio.nombre}".` });
}
