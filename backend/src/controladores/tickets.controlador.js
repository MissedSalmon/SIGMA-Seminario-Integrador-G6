/**
 * Controlador de tickets (HU-9 alta, HU-10 consulta).
 */
import * as ticketsServicio from '../servicios/tickets.servicio.js';
import { ESTADOS } from '../servicios/tickets.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un número de ticket válido.`);
  }

  return id;
}

/** Una fecha/hora que venga en la direccion. Si viene y no se entiende, se avisa. */
function leerFecha(valor, nombre) {
  if (!valor) return null;

  if (Number.isNaN(Date.parse(valor))) {
    throw datoInvalido(`"${valor}" no es una fecha válida para "${nombre}".`);
  }

  return valor;
}

/**
 * GET /api/tickets
 * GET /api/tickets?estado=Creado&desde=2026-09-01T03:00:00.000Z&hasta=...&codigoActivo=AC-001&idArea=4
 *
 * Los filtros se combinan: si vienen varios, tienen que cumplirse todos.
 * Siempre del mas nuevo al mas viejo.
 */
export async function listar(req, res) {
  const { estado, desde, hasta, codigoActivo, idArea } = req.query;

  if (estado && !ESTADOS.includes(estado)) {
    throw datoInvalido(`"${estado}" no es un estado de ticket válido.`);
  }

  if (idArea && !Number.isInteger(Number(idArea))) {
    throw datoInvalido(`"${idArea}" no es un número de área válido.`);
  }

  const tickets = await ticketsServicio.obtenerTodos({
    estado: estado || null,
    desde: leerFecha(desde, 'desde'),
    hasta: leerFecha(hasta, 'hasta'),
    codigoActivo: codigoActivo ? String(codigoActivo).trim() : null,
    idArea: idArea ? Number(idArea) : null,
  });

  res.json({ ok: true, datos: tickets });
}

/**
 * GET /api/tickets/estados
 *
 * Los estados posibles, para que la pantalla no tenga que repetir la lista.
 */
export async function listarEstados(req, res) {
  res.json({ ok: true, datos: ESTADOS });
}

/** GET /api/tickets/5 */
export async function obtener(req, res) {
  const ticket = await ticketsServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: ticket });
}

/** POST /api/tickets */
export async function crear(req, res) {
  const nuevo = await ticketsServicio.crear(req.body);
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/tickets/5/validar */
export async function validar(req, res) {
  const ticket = await ticketsServicio.validar(leerId(req));
  res.json({ ok: true, datos: ticket });
}

/** PUT /api/tickets/5/rechazar */
export async function rechazar(req, res) {
  const { motivo } = req.body;
  const ticket = await ticketsServicio.rechazar(leerId(req), motivo);
  res.json({ ok: true, datos: ticket });
}
