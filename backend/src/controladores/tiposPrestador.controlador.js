import * as tiposPrestadorServicio from '../servicios/tiposPrestador.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un id válido.`);
  }
  return id;
}

export async function listar(req, res) {
  const tipos = await tiposPrestadorServicio.obtenerTodos();
  res.json({ ok: true, datos: tipos });
}

export async function obtener(req, res) {
  const tipo = await tiposPrestadorServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: tipo });
}

export async function crear(req, res) {
  const { nombre, descripcion } = req.body ?? {};
  const nuevo = await tiposPrestadorServicio.crear({ nombre, descripcion });
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const { nombre, descripcion } = req.body ?? {};
  const tipo = await tiposPrestadorServicio.actualizar(leerId(req), { nombre, descripcion });
  res.json({ ok: true, datos: tipo });
}

export async function eliminar(req, res) {
  const tipo = await tiposPrestadorServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: tipo, mensaje: `Se eliminó "${tipo.nombre}".` });
}
