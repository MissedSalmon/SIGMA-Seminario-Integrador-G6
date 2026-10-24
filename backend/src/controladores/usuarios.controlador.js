import * as usuariosServicio from '../servicios/usuarios.servicio.js';
import { datoInvalido } from '../utiles/errores.js';

function leerIdentificador(req) {
  const identificador = String(req.params.identificador ?? '').trim();
  if (!identificador) throw datoInvalido('Falta el identificador del usuario.');
  return identificador;
}

/** POST /api/usuarios/:identificador/restablecer-contrasena */
export async function restablecerContrasena(req, res) {
  const datos = await usuariosServicio.restablecerContrasena(
    leerIdentificador(req),
    req.usuario.usuarioId
  );
  res.json({ ok: true, datos });
}
