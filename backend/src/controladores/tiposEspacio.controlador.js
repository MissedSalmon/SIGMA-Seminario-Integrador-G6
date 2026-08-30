import * as tiposEspacioServicio from '../servicios/tiposEspacio.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un id valido.`);
  }
  return id;
}

export async function listar(req, res) {
  const tipos = await tiposEspacioServicio.obtenerTodos();
  res.json({ ok: true, datos: tipos });
}

export async function obtener(req, res) {
  const tipo = await tiposEspacioServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: tipo });
}

export async function crear(req, res) {
  const { nombre } = req.body;
  const nuevo = await tiposEspacioServicio.crear({ nombre });
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const { nombre } = req.body;
  const tipo = await tiposEspacioServicio.actualizar(leerId(req), { nombre });
  res.json({ ok: true, datos: tipo });
}

export async function eliminar(req, res) {
  const tipo = await tiposEspacioServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: tipo, mensaje: `Se elimino "${tipo.nombre}".` });
}
