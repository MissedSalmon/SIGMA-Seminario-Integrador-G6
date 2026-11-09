/**
 * Controlador de tecnicos (HU-5).
 */
import * as tecnicosServicio from '../servicios/tecnicos.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

/** Convierte el :legajo de la direccion en numero. Si no es un numero, error 400. */
function leerLegajo(req) {
  const legajo = Number(req.params.legajo);

  if (!Number.isInteger(legajo) || legajo <= 0) {
    throw datoInvalido(`"${req.params.legajo}" no es un legajo válido.`);
  }

  return legajo;
}

function leerDia(valor, nombre) {
  if (!valor) return null;

  const texto = String(valor);
  const fecha = new Date(`${texto}T00:00:00.000Z`);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(texto) ||
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== texto
  ) {
    throw datoInvalido(`"${texto}" no es una fecha válida para "${nombre}". Tiene que ser AAAA-MM-DD.`);
  }

  return texto;
}

function leerFiltrosCarga(query, incluirEspecialidad = false) {
  const desde = leerDia(query.desde, 'desde');
  const hasta = leerDia(query.hasta, 'hasta');

  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  let especialidad_id = null;
  if (incluirEspecialidad && query.especialidad_id) {
    especialidad_id = Number(query.especialidad_id);
    if (!Number.isInteger(especialidad_id) || especialidad_id <= 0) {
      throw datoInvalido(`"${query.especialidad_id}" no es un número válido de especialidad.`);
    }
  }

  return { desde, hasta, especialidad_id };
}

/** Toma del cuerpo solo los campos que son del tecnico (el legajo se lee aparte: es inmutable). */
function leerCuerpo(req) {
  const { nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, disponibilidad, especialidades } = req.body;
  return { nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, disponibilidad, especialidades };
}

/**
 * GET /api/tecnicos
 * GET /api/tecnicos?especialidad_id=2&disponibilidad=Disponible  -> filtros combinables
 */
export async function listar(req, res) {
  const { especialidad_id, disponibilidad } = req.query;
  const tecnicos = await tecnicosServicio.obtenerTodos({ especialidad_id, disponibilidad });
  res.json({ ok: true, datos: tecnicos });
}

/** GET /api/tecnicos/carga-trabajo?desde=...&hasta=...&especialidad_id=... */
export async function listarCargaTrabajo(req, res) {
  const filtros = leerFiltrosCarga(req.query, true);
  const carga = await tecnicosServicio.obtenerCargaTrabajo(filtros);
  res.json({ ok: true, datos: carga });
}

/** GET /api/tecnicos/:legajo/carga-trabajo?desde=...&hasta=... */
export async function listarTareasDeCarga(req, res) {
  const legajo = leerLegajo(req);
  const filtros = leerFiltrosCarga(req.query);
  const tareas = await tecnicosServicio.obtenerTareasDeCarga(legajo, filtros);
  res.json({ ok: true, datos: tareas });
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
  res.json({ ok: true, datos: tecnico, mensaje: `Se eliminó a "${tecnico.nombre} ${tecnico.apellido}".` });
}
