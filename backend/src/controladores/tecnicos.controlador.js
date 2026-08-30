/**
 * Controlador de tecnicos (HU-5).
 */
import * as tecnicosServicio from '../servicios/tecnicos.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

/** Convierte el :legajo de la direccion en numero. Si no es un numero, error 400. */
function leerLegajo(req) {
  const legajo = Number(req.params.legajo);

  if (!Number.isInteger(legajo)) {
    throw datoInvalido(`"${req.params.legajo}" no es un legajo valido.`);
  }

  return legajo;
}

/** Toma del cuerpo solo los campos que son del tecnico (el legajo se lee aparte: es inmutable). */
function leerCuerpo(req) {
  const { nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, disponibilidad, especialidades } = req.body;
  return { nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, disponibilidad, especialidades };
}

/**
 * GET /api/tecnicos
 * GET /api/tecnicos?especialidadId=2&disponibilidad=Disponible  -> filtros combinables
 */
export async function listar(req, res) {
  const { especialidadId, disponibilidad } = req.query;
  const tecnicos = await tecnicosServicio.obtenerTodos({ especialidadId, disponibilidad });
  res.json({ ok: true, datos: tecnicos });
}

/** GET /api/tecnicos/:legajo */
export async function obtener(req, res) {
  const tecnico = await tecnicosServicio.obtenerPorId(leerLegajo(req));
  res.json({ ok: true, datos: tecnico });
}

/** POST /api/tecnicos */
export async function crear(req, res) {
  const nuevo = await tecnicosServicio.crear({ legajo: req.body.legajo, ...leerCuerpo(req) });
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/tecnicos/:legajo */
export async function actualizar(req, res) {
  const tecnico = await tecnicosServicio.actualizar(leerLegajo(req), leerCuerpo(req));
  res.json({ ok: true, datos: tecnico });
}

/** DELETE /api/tecnicos/:legajo */
export async function eliminar(req, res) {
  const tecnico = await tecnicosServicio.eliminar(leerLegajo(req));
  res.json({ ok: true, datos: tecnico, mensaje: `Se elimino a "${tecnico.nombre} ${tecnico.apellido}".` });
}
