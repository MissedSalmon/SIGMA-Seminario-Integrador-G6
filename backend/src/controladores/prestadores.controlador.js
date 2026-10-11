/**
 * Controlador de prestadores de servicio (HU-25).
 *
 * El listado tambien lo usa el formulario de tareas de la OT (HU-14), para
 * elegir un prestador como responsable.
 */
import * as prestadoresServicio from '../servicios/prestadores.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un id válido.`);
  }
  return id;
}

function leerDatos(req) {
  const { nombre, cuil, telefono, email, garantia, tipos } = req.body ?? {};
  return { nombre, cuil, telefono, email, garantia, tipos };
}

/** GET /api/prestadores?tipo_prestador_id=3 */
export async function listar(req, res) {
  const prestadores = await prestadoresServicio.obtenerTodos({
    idTipoPrestador: req.query.tipo_prestador_id,
  });
  res.json({ ok: true, datos: prestadores });
}

export async function obtener(req, res) {
  const prestador = await prestadoresServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: prestador });
}

export async function crear(req, res) {
  const nuevo = await prestadoresServicio.crear(leerDatos(req));
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const prestador = await prestadoresServicio.actualizar(leerId(req), leerDatos(req));
  res.json({ ok: true, datos: prestador });
}

export async function eliminar(req, res) {
  const prestador = await prestadoresServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: prestador, mensaje: `Se eliminó "${prestador.nombre}".` });
}
