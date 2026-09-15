/**
 * Controlador de usuarios autorizados (HU-8).
 */
import * as autorizadosServicio from '../servicios/autorizados.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

/**
 * Lee el :legajo de la direccion.
 *
 * Se deja como texto, no como numero: la columna autorizado_legajo es un
 * VARCHAR, asi que un legajo puede tener ceros adelante ("0042") o letras.
 */
function leerLegajo(req) {
  const legajo = String(req.params.legajo ?? '').trim();
  if (!legajo) throw datoInvalido('Falta el legajo del usuario autorizado.');
  return legajo;
}

/** Toma del cuerpo solo los campos de la persona (el legajo se lee aparte: es inmutable). */
function leerCuerpo(req) {
  const { nombre, dni, cuil, email, telefono, fechaNacimiento, idArea } = req.body;
  return { nombre, dni, cuil, email, telefono, fechaNacimiento, idArea };
}

/**
 * GET /api/autorizados
 * GET /api/autorizados?area_id=3  -> solo los responsables de esa area
 */
export async function listar(req, res) {
  const autorizados = await autorizadosServicio.obtenerTodos({ area_id: req.query.area_id });
  res.json({ ok: true, datos: autorizados });
}

/** GET /api/autorizados/:legajo */
export async function obtener(req, res) {
  const autorizado = await autorizadosServicio.obtenerPorId(leerLegajo(req));
  res.json({ ok: true, datos: autorizado });
}

/** POST /api/autorizados */
export async function crear(req, res) {
  const nuevo = await autorizadosServicio.crear({ legajo: req.body.legajo, ...leerCuerpo(req) });
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/autorizados/:legajo */
export async function actualizar(req, res) {
  const autorizado = await autorizadosServicio.actualizar(leerLegajo(req), leerCuerpo(req));
  res.json({ ok: true, datos: autorizado });
}

/** DELETE /api/autorizados/:legajo */
export async function eliminar(req, res) {
  const autorizado = await autorizadosServicio.eliminar(leerLegajo(req));
  res.json({ ok: true, datos: autorizado, mensaje: `Se elimino a "${autorizado.nombre}".` });
}
