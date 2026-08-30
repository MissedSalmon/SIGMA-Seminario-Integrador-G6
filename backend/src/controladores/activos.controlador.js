/**
 * Controlador de activos (HU-7).
 */
import * as activosServicio from '../servicios/activos.servicio.js';
import { ESTADOS, ESTADOS_MANUALES } from '../servicios/activos.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

/**
 * La clave de un activo es su codigo de inventario, que es un texto
 * ("AC-014"), no un numero. Por eso aca no se valida con Number.isInteger
 * como en el resto de los modulos.
 */
function leerCodigo(req) {
  const codigo = String(req.params.codigo ?? '').trim();

  if (!codigo) {
    throw datoInvalido('Falta el codigo del activo.');
  }

  return codigo;
}

/** Toma del cuerpo solo los campos que son del activo. */
function leerCuerpo(req) {
  const { codigo, descripcion, idTipoActivo, idEdificio, espacioNum, fechaInstalacion, estado } =
    req.body;

  return { codigo, descripcion, idTipoActivo, idEdificio, espacioNum, fechaInstalacion, estado };
}

/**
 * GET /api/activos
 * GET /api/activos?idEdificio=1&espacioNum=12&idTipoActivo=3&estado=Operativo
 *
 * Los filtros se combinan: si vienen varios, tienen que cumplirse todos.
 */
export async function listar(req, res) {
  const { idEdificio, espacioNum, idTipoActivo, estado } = req.query;

  if (estado && !ESTADOS.includes(estado)) {
    throw datoInvalido(`"${estado}" no es un estado de activo valido.`);
  }

  const activos = await activosServicio.obtenerTodos({
    idEdificio: idEdificio ? Number(idEdificio) : null,
    espacioNum: espacioNum || null,
    idTipoActivo: idTipoActivo ? Number(idTipoActivo) : null,
    estado: estado || null,
  });

  res.json({ ok: true, datos: activos });
}

/**
 * GET /api/activos/estados
 *
 * Los estados posibles y cuales se pueden elegir a mano, para que la pantalla
 * no tenga que repetir la lista.
 */
export async function listarEstados(req, res) {
  res.json({ ok: true, datos: { todos: ESTADOS, manuales: ESTADOS_MANUALES } });
}

/** GET /api/activos/AC-014 */
export async function obtener(req, res) {
  const activo = await activosServicio.obtenerPorId(leerCodigo(req));
  res.json({ ok: true, datos: activo });
}

/** POST /api/activos */
export async function crear(req, res) {
  const nuevo = await activosServicio.crear(leerCuerpo(req));
  res.status(201).json({ ok: true, datos: nuevo });
}

/** PUT /api/activos/AC-014 */
export async function actualizar(req, res) {
  const activo = await activosServicio.actualizar(leerCodigo(req), leerCuerpo(req));
  res.json({ ok: true, datos: activo });
}

/**
 * DELETE /api/activos/AC-014
 *
 * No borra: pasa el activo a Retirado. Se usa el verbo DELETE porque para el
 * que llama es "dar de baja", pero el registro queda en la base con su
 * historial.
 */
export async function eliminar(req, res) {
  const activo = await activosServicio.darDeBaja(leerCodigo(req));
  res.json({
    ok: true,
    datos: activo,
    mensaje: `Se dio de baja el activo "${activo.codigo}". Queda como Retirado.`,
  });
}
