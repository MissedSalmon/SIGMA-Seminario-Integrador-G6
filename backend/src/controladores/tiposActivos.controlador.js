import * as tiposActivosServicio from '../servicios/tiposActivos.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un id de tipo de activo valido.`);
  }

  return id;
}

export async function listar(req, res) {
  const tipos = await tiposActivosServicio.obtenerTodos();
  res.json({ ok: true, datos: tipos });
}

export async function obtener(req, res) {
  const tipo = await tiposActivosServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: tipo });
}

export async function crear(req, res) {
  const { nombre, descripcion } = req.body;
  const nuevo = await tiposActivosServicio.crear({ nombre, descripcion });
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const { nombre, descripcion } = req.body;
  const tipo = await tiposActivosServicio.actualizar(leerId(req), { nombre, descripcion });
  res.json({ ok: true, datos: tipo });
}

export async function eliminar(req, res) {
  const tipo = await tiposActivosServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: tipo, mensaje: `Se elimino "${tipo.nombre}".` });
}
