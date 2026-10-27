import * as planesServicio from '../servicios/planesMantenimiento.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un identificador de plan válido.`);
  }
  return id;
}

export async function listar(req, res) {
  const { tipoActivoId, estado, buscar } = req.query;
  const planes = await planesServicio.listarPlanes({ tipoActivoId, estado, buscar });
  res.json({ ok: true, datos: planes });
}

export async function obtener(req, res) {
  const id = leerId(req);
  const plan = await planesServicio.obtenerPlanPorId(id);
  res.json({ ok: true, datos: plan });
}

export async function crear(req, res) {
  const nuevo = await planesServicio.crearPlan(req.body);
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const id = leerId(req);
  const actualizado = await planesServicio.actualizarPlan(id, req.body);
  res.json({ ok: true, datos: actualizado });
}

export async function darDeBaja(req, res) {
  const id = leerId(req);
  const resultado = await planesServicio.darDeBajaPlan(id);
  res.json({ ok: true, datos: resultado, mensaje: resultado.mensaje });
}

export async function planesPorVencer(req, res) {
  const dias = req.query.dias ? Number(req.query.dias) : 7;
  const lista = await planesServicio.obtenerPlanesPorVencer(dias, req.query.fechaReferencia);
  res.json({ ok: true, datos: lista });
}

export async function procesarGeneracion(req, res) {
  const { fechaCorte } = req.body ?? {};
  const resultado = await planesServicio.procesarGeneracionAutomatica(fechaCorte);
  res.json({ ok: true, datos: resultado });
}
