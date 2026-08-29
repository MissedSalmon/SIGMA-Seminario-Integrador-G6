/**
 * Controlador de edificios (HU-1).
 *
 * Lee el pedido, llama al servicio y arma la respuesta.
 * No valida reglas de negocio ni consulta datos: de eso se encarga
 * src/servicios/edificios.servicio.js.
 */
import * as edificiosServicio from '../servicios/edificios.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

/** Convierte el :id de la direccion en numero. Si no es un numero, error 400. */
function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un numero de edificio valido.`);
  }

  return id;
}

/** GET /api/edificios */
export async function listar(req, res) {
  const edificios = await edificiosServicio.obtenerTodos();
  res.json({ ok: true, datos: edificios });
}

/** GET /api/edificios/:id */
export async function obtener(req, res) {
  const edificio = await edificiosServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: edificio });
}

/** POST /api/edificios */
export async function crear(req, res) {
  const { nombre, direccion } = req.body;
  const nuevo = await edificiosServicio.crear({ nombre, direccion });
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/edificios/:id */
export async function actualizar(req, res) {
  const { nombre, direccion } = req.body;
  const edificio = await edificiosServicio.actualizar(leerId(req), { nombre, direccion });
  res.json({ ok: true, datos: edificio });
}

/** DELETE /api/edificios/:id */
export async function eliminar(req, res) {
  const edificio = await edificiosServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: edificio, mensaje: `Se elimino "${edificio.nombre}".` });
}
