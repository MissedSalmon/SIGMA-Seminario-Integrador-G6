/**
 * Controlador de remitos de ingreso al deposito (HU-16).
 */
import * as remitosServicio from '../servicios/remitos.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    throw datoInvalido(`"${req.params.id}" no es un número de remito válido.`);
  }

  return id;
}

/** Una fecha que venga en la direccion. Si viene y no se entiende, se avisa. */
function leerFecha(valor, nombre) {
  if (!valor) return null;

  if (Number.isNaN(Date.parse(valor))) {
    throw datoInvalido(`"${valor}" no es una fecha válida para "${nombre}".`);
  }

  return String(valor).slice(0, 10);
}

/**
 * GET /api/remitos
 * GET /api/remitos?desde=2026-09-01&hasta=2026-09-30
 *
 * Siempre del mas nuevo al mas viejo por fecha de recepcion.
 */
export async function listar(req, res) {
  const remitos = await remitosServicio.obtenerTodos({
    desde: leerFecha(req.query.desde, 'desde'),
    hasta: leerFecha(req.query.hasta, 'hasta'),
  });

  res.json({ ok: true, datos: remitos });
}

/** GET /api/remitos/tipos-comprobante - para que la pantalla no repita la lista. */
export async function listarTiposComprobante(req, res) {
  res.json({ ok: true, datos: remitosServicio.TIPOS_COMPROBANTE });
}

/** GET /api/remitos/5 */
export async function obtener(req, res) {
  const remito = await remitosServicio.obtenerPorId(leerId(req));
  res.json({ ok: true, datos: remito });
}

/**
 * POST /api/remitos
 *
 * { tipoComprobante, proveedor, fechaRecepcion, numero, observaciones?, items: [{ codigo, cantidad }] }
 *
 * Registra el remito y sube el stock de cada item, todo junto o nada.
 */
export async function crear(req, res) {
  const remito = await remitosServicio.crear(req.body ?? {});

  res.status(201).json({
    ok: true,
    datos: remito,
    mensaje: `Se registró ${remito.tipoComprobante === 'Factura' ? 'la factura' : 'el remito'} y se actualizó el stock de ${remito.cantidadItems} ${
      remito.cantidadItems === 1 ? 'ítem' : 'ítems'
    }.`,
  });
}
