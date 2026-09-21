/**
 * Controlador de ordenes de trabajo (HU-14: crear la OT a partir de un ticket).
 */
import * as ordenesServicio from '../servicios/ordenesTrabajo.servicio.js';
import { ESTADOS, PRIORIDADES } from '../servicios/ordenesTrabajo.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un número de orden de trabajo válido.`);
  }

  return id;
}

function leerNumeroDeTarea(req) {
  const idTarea = Number(req.params.idTarea);

  if (!Number.isInteger(idTarea) || idTarea <= 0) {
    throw datoInvalido(`"${req.params.idTarea}" no es un número de tarea válido.`);
  }

  return idTarea;
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
 * GET /api/ordenes-trabajo
 * GET /api/ordenes-trabajo?estado=Creada&prioridad=Alta&codigoActivo=AC-001&desde=...&hasta=...
 *
 * Los filtros se combinan: si vienen varios, tienen que cumplirse todos.
 * Siempre de la mas nueva a la mas vieja.
 */
export async function listar(req, res) {
  const { estado, prioridad, codigoActivo, desde, hasta } = req.query;

  if (estado && !ESTADOS.includes(estado)) {
    throw datoInvalido(`"${estado}" no es un estado de orden de trabajo válido.`);
  }

  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    throw datoInvalido(`"${prioridad}" no es una prioridad válida.`);
  }

  const ordenes = await ordenesServicio.obtenerTodas({
    estado: estado || null,
    prioridad: prioridad || null,
    codigoActivo: codigoActivo ? String(codigoActivo).trim() : null,
    desde: leerFecha(desde, 'desde'),
    hasta: leerFecha(hasta, 'hasta'),
  });

  res.json({ ok: true, datos: ordenes });
}

/**
 * GET /api/ordenes-trabajo/estados
 * GET /api/ordenes-trabajo/prioridades
 *
 * Para que las pantallas no repitan las listas.
 */
export async function listarEstados(req, res) {
  res.json({ ok: true, datos: ESTADOS });
}

export async function listarPrioridades(req, res) {
  res.json({ ok: true, datos: PRIORIDADES });
}

/** GET /api/ordenes-trabajo/5 */
export async function obtener(req, res) {
  const orden = await ordenesServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: orden });
}

/**
 * POST /api/ordenes-trabajo   { idTicket, descripcion }
 *
 * La OT se genera sola al validar el ticket. Esta direccion es el respaldo:
 * sirve para el ticket que quedo validado sin OT.
 */
export async function crear(req, res) {
  const idTicket = Number(req.body?.idTicket);

  if (!Number.isInteger(idTicket) || idTicket <= 0) {
    throw datoInvalido('Hay que indicar de qué ticket se genera la orden de trabajo.');
  }

  const orden = await ordenesServicio.crearDesdeTicket(idTicket, { descripcion: req.body?.descripcion });
  res.status(201).json({ ok: true, datos: orden });
}

/** PUT /api/ordenes-trabajo/5   { descripcion } */
export async function actualizar(req, res) {
  const orden = await ordenesServicio.actualizar(leerId(req), req.body ?? {});
  res.json({ ok: true, datos: orden });
}

/** POST /api/ordenes-trabajo/5/tareas */
export async function agregarTarea(req, res) {
  const orden = await ordenesServicio.agregarTarea(leerId(req), req.body ?? {});
  res.status(201).json({ ok: true, datos: orden });
}

/** PUT /api/ordenes-trabajo/5/tareas/2 */
export async function actualizarTarea(req, res) {
  const orden = await ordenesServicio.actualizarTarea(leerId(req), leerNumeroDeTarea(req), req.body ?? {});
  res.json({ ok: true, datos: orden });
}

/** DELETE /api/ordenes-trabajo/5/tareas/2 */
export async function eliminarTarea(req, res) {
  const idTarea = leerNumeroDeTarea(req);
  const orden = await ordenesServicio.eliminarTarea(leerId(req), idTarea);

  res.json({ ok: true, datos: orden, mensaje: `Se eliminó la tarea ${idTarea}.` });
}
