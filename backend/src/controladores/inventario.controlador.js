import * as servicio from '../servicios/inventario.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) throw datoInvalido('El id del tipo de inventario no es valido.');
  return id;
}

function leerCodigo(req) {
  const codigo = String(req.params.codigo || '').trim();
  if (!codigo) throw datoInvalido('Falta el codigo del item.');
  return codigo;
}

export async function listarTipos(req, res) { res.json({ ok: true, datos: await servicio.obtenerTipos(req.query.clase) }); }
export async function obtenerTipo(req, res) { res.json({ ok: true, datos: await servicio.obtenerTipo(leerId(req)) }); }
export async function crearTipo(req, res) { res.status(201).json({ ok: true, datos: await servicio.crearTipo(req.body) }); }
export async function actualizarTipo(req, res) { res.json({ ok: true, datos: await servicio.actualizarTipo(leerId(req), req.body) }); }
export async function eliminarTipo(req, res) { res.json({ ok: true, datos: await servicio.eliminarTipo(leerId(req)) }); }
export async function listarItems(req, res) { res.json({ ok: true, datos: await servicio.obtenerItems(req.query.clase) }); }
export async function obtenerItem(req, res) { res.json({ ok: true, datos: await servicio.obtenerItem(leerCodigo(req)) }); }
export async function crearItem(req, res) { res.status(201).json({ ok: true, datos: await servicio.crearItem(req.body) }); }
export async function actualizarItem(req, res) { res.json({ ok: true, datos: await servicio.actualizarItem(leerCodigo(req), req.body) }); }
export async function eliminarItem(req, res) { res.json({ ok: true, datos: await servicio.eliminarItem(leerCodigo(req)) }); }