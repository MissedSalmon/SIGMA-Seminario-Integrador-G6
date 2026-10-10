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

/** GET /api/tareas/prioridades: para el filtro, de mas urgente a menos. */
export function listarPrioridades(req, res) {
  res.json({ ok: true, datos: PRIORIDADES });
}
