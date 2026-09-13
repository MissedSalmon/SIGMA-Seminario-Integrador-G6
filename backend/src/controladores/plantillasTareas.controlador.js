import * as plantillasServicio from '../servicios/plantillasTareas.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    throw datoInvalido(`"${req.params.id}" no es un id de plantilla válido.`);
  }
  return id;
}

export async function listar(req, res) {
  const { idTipoActivo } = req.query;
  const plantillas = await plantillasServicio.obtenerTodas(idTipoActivo);
  res.json({ ok: true, datos: plantillas });
}

export async function obtener(req, res) {
  const plantilla = await plantillasServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: plantilla });
}

export async function crear(req, res) {
  const nueva = await plantillasServicio.crear(req.body);
  res.status(201).json({ ok: true, datos: nueva });
}

export async function actualizar(req, res) {
  const plantilla = await plantillasServicio.actualizar(leerId(req), req.body);
  res.json({ ok: true, datos: plantilla });
}

export async function eliminar(req, res) {
  const plantilla = await plantillasServicio.eliminar(leerId(req));
  res.json({ ok: true, datos: plantilla, mensaje: `Se eliminó la plantilla "${plantilla.nombre}".` });
}
