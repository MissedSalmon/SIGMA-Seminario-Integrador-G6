import * as espaciosServicio from '../servicios/espacios.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerId(req) {
  const idStr = req.params.id;
  const idNum = Number(idStr);

  if (!idStr || !Number.isInteger(idNum)) {
    throw datoInvalido(`"${req.params.id}" no es un numero de espacio valido.`);
  }

  return idNum;
}

function leerCuerpo(req) {
  const { idEdificio, nombre, tipo, idTipoEspacio, piso, numero, dimensiones } = req.body;
  return { idEdificio, nombre, tipo, idTipoEspacio, piso, numero, dimensiones };
}

export async function listar(req, res) {
  const filtro = req.query.idEdificio ? Number(req.query.idEdificio) : null;

  if (filtro !== null && !Number.isInteger(filtro)) {
    throw datoInvalido(`"${req.query.idEdificio}" no es un numero de edificio valido.`);
  }

  const espacios = await espaciosServicio.obtenerTodos(filtro);
  res.json({ ok: true, datos: espacios });
}

export async function listarTipos(req, res) {
  const tipos = await espaciosServicio.obtenerTipos();
  res.json({ ok: true, datos: tipos });
}

export async function obtener(req, res) {
  const espacio_id = leerId(req);
  const espacio = await espaciosServicio.obtenerPorId(espacio_id);
  res.json({ ok: true, datos: espacio });
}

export async function crear(req, res) {
  const nuevo = await espaciosServicio.crear(leerCuerpo(req));
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function actualizar(req, res) {
  const espacio_id = leerId(req);
  const espacio = await espaciosServicio.actualizar(espacio_id, leerCuerpo(req));
  res.json({ ok: true, datos: espacio });
}

export async function eliminar(req, res) {
  const espacio_id = leerId(req);
  const espacio = await espaciosServicio.eliminar(espacio_id);
  res.json({ ok: true, datos: espacio, mensaje: `Se elimino el espacio.` });
}
