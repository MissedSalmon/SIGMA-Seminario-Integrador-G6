/**
 * Controlador de las tareas del tecnico (HU-21).
 *
 * El legajo del tecnico sale SIEMPRE de la sesion (req.usuario, que arma el
 * middleware de autenticacion). No se acepta por la direccion: si se aceptara,
 * un tecnico podria pedir las tareas de otro.
 */
import * as tareasServicio from '../servicios/tareas.servicio.js';
import { PRIORIDADES } from '../servicios/tareas.servicio.js';
import { datoInvalido } from '../utiles/errores.js';
import { registrarObservacion } from '../servicios/observaciones.servicio.js';

export async function agregarObservacion(req, res) {
  const { idOt, idTarea } = leerTarea(req);
  const observacion = await registrarObservacion(req.usuario.identificador, idOt, idTarea, req.body?.texto);
  res.status(201).json({ ok: true, datos: observacion });
}

/** Un dia escrito como "2026-10-01". Si viene y no es eso, se avisa. */
function leerDia(valor, nombre) {
  if (!valor) return null;

  const texto = String(valor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto) || Number.isNaN(Date.parse(texto))) {
    throw datoInvalido(`"${texto}" no es una fecha válida para "${nombre}". Tiene que ser AAAA-MM-DD.`);
  }

  return texto;
}

function leerNumero(valor, nombre) {
  const numero = Number(valor);

  if (!Number.isInteger(numero) || numero <= 0) {
    throw datoInvalido(`"${valor}" no es un número válido de ${nombre}.`);
  }

  return numero;
}

/**
 * GET /api/tareas/mias
 * GET /api/tareas/mias?prioridad=Alta&desde=2026-10-01&hasta=2026-10-31
 *
 * Responde { tareas, pendientes }: la lista ya ordenada por prioridad y fecha
 * prevista, y cuantas tareas le quedan pendientes al tecnico (sin filtros).
 */
export async function listarMias(req, res) {
  const { prioridad } = req.query;

  if (prioridad && !PRIORIDADES.includes(prioridad)) {
    throw datoInvalido(`"${prioridad}" no es una prioridad válida. Son: ${PRIORIDADES.join(', ')}.`);
  }

  const desde = leerDia(req.query.desde, 'desde');
  const hasta = leerDia(req.query.hasta, 'hasta');

  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  const datos = await tareasServicio.obtenerDelTecnico(req.usuario.identificador, {
    prioridad: prioridad || null,
    desde,
    hasta,
  });

  res.json({ ok: true, datos });
}

/** GET /api/tareas/mias/:idOt/:idTarea */
export async function obtenerMia(req, res) {
  const idOt = leerNumero(req.params.idOt, 'orden de trabajo');
  const idTarea = leerNumero(req.params.idTarea, 'tarea');

  const tarea = await tareasServicio.obtenerUnaDelTecnico(req.usuario.identificador, idOt, idTarea);
  res.json({ ok: true, datos: tarea });
}

function leerTarea(req) {
  return {
    idOt: leerNumero(req.params.idOt, 'orden de trabajo'),
    idTarea: leerNumero(req.params.idTarea, 'tarea'),
  };
}

/** POST /api/tareas/mias/:idOt/:idTarea/iniciar (HU-22) */
export async function iniciar(req, res) {
  const { idOt, idTarea } = leerTarea(req);
  const tarea = await tareasServicio.iniciarTarea(req.usuario.identificador, idOt, idTarea);
  res.json({ ok: true, datos: tarea });
}

/**
 * POST /api/tareas/mias/:idOt/:idTarea/finalizar (HU-22)
 *
 * Responde { tarea, ordenFinalizada }: si con esta tarea se cerro la OT (HU-26).
 */
export async function finalizar(req, res) {
  const { idOt, idTarea } = leerTarea(req);
  const datos = await tareasServicio.finalizarTarea(req.usuario.identificador, idOt, idTarea);
  res.json({ ok: true, datos });
}

/**
 * POST /api/tareas/mias/:idOt/:idTarea/materiales (HU-22)
 * Cuerpo: { items: [{ codigo: "MAT-002", cantidad: 4 }, ...] }
 */
export async function registrarMateriales(req, res) {
  const { idOt, idTarea } = leerTarea(req);
  const tarea = await tareasServicio.registrarMateriales(
    req.usuario.identificador,
    idOt,
    idTarea,
    req.body?.items
  );
  res.status(201).json({ ok: true, datos: tarea });
}

/**
 * POST /api/tareas/mias/:idOt/:idTarea/herramientas (HU-22)
 * Cuerpo: { codigo: "HER-001" }
 */
export async function tomarHerramienta(req, res) {
  const { idOt, idTarea } = leerTarea(req);
  const datos = await tareasServicio.tomarHerramienta(
    req.usuario.identificador,
    idOt,
    idTarea,
    req.body?.codigo
  );
  res.status(201).json({ ok: true, datos });
}

/** GET /api/tareas/materiales: los del deposito con su stock. */
export async function listarMateriales(req, res) {
  res.json({ ok: true, datos: await tareasServicio.listarMateriales() });
}

/** GET /api/tareas/herramientas: { mias, disponibles } */
export async function listarHerramientas(req, res) {
  res.json({ ok: true, datos: await tareasServicio.listarHerramientas(req.usuario.identificador) });
}

/** GET /api/tareas/historial/materiales: lo que se usó en las tareas del técnico. */
export async function historialMateriales(req, res) {
  res.json({ ok: true, datos: await tareasServicio.historialMateriales(req.usuario.identificador) });
}

/** GET /api/tareas/historial/herramientas: las que tiene y las que tuvo. */
export async function historialHerramientas(req, res) {
  res.json({ ok: true, datos: await tareasServicio.historialHerramientas(req.usuario.identificador) });
}

/** POST /api/tareas/herramientas/:codigo/devolver */
export async function devolverHerramienta(req, res) {
  const datos = await tareasServicio.devolverHerramienta(req.usuario.identificador, req.params.codigo);
  res.json({ ok: true, datos });
}

/** GET /api/tareas/prioridades: para el filtro, de mas urgente a menos. */
export function listarPrioridades(req, res) {
  res.json({ ok: true, datos: PRIORIDADES });
}
