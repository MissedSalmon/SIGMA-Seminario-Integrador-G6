/**
 * Controlador de gestion de usuarios (HU Gestion de usuarios, Sprint 6).
 *
 * Todas las direcciones son solo para un administrador activo (ver
 * rutas/usuarios.rutas.js).
 */
import * as usuariosServicio from '../servicios/usuarios.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

const FORMATO_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function leerId(req) {
  const id = req.params.id;
  if (!FORMATO_UUID.test(id)) throw datoInvalido(`"${id}" no es un id de usuario válido.`);
  return id;
}

/** GET /api/usuarios?rol=tecnico&activo=true */
export async function listar(req, res) {
  const usuarios = await usuariosServicio.obtenerTodos({
    rol: req.query.rol,
    activo: req.query.activo,
  });
  res.json({ ok: true, datos: usuarios });
}

/** GET /api/usuarios/personas-sin-usuario */
export async function personasSinUsuario(req, res) {
  const personas = await usuariosServicio.obtenerPersonasSinUsuario();
  res.json({ ok: true, datos: personas });
}

export async function crear(req, res) {
  const { rol, legajo, nombreUsuario, password } = req.body ?? {};
  const nuevo = await usuariosServicio.crear({ rol, legajo, nombreUsuario, password });
  res.status(201).json({ ok: true, datos: nuevo });
}

export async function desactivar(req, res) {
  const usuario = await usuariosServicio.desactivar(leerId(req), req.usuario.usuarioId);
  res.json({ ok: true, datos: usuario, mensaje: `Se desactivó el usuario "${usuario.nombreUsuario}".` });
}

export async function activar(req, res) {
  const usuario = await usuariosServicio.activar(leerId(req));
  res.json({ ok: true, datos: usuario, mensaje: `Se activó el usuario "${usuario.nombreUsuario}".` });
}
