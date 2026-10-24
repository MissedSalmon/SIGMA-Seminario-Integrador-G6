import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { supabase } from '../config/supabase.js';
import { datoInvalido, errorDeBase, noEncontrado, prohibido } from '../utiles/errores.js';

/**
 * Genera una contraseña provisoria y registra el restablecimiento en una sola
 * operación de base de datos.
 */
export async function restablecerContrasena(identificador, administradorUsuarioId) {
  const identificadorLimpio =
    typeof identificador === 'string' ? identificador.trim() : '';
  if (!identificadorLimpio) {
    throw datoInvalido('Falta el identificador del usuario.');
  }
  if (!administradorUsuarioId) {
    throw prohibido('Solo un administrador puede restablecer contraseñas.');
  }

  const { data: usuario, error: errorUsuario } = await supabase
    .from('usuario')
    .select('usuario_id, identificador')
    .eq('identificador', identificadorLimpio)
    .maybeSingle();

  if (errorUsuario) {
    throw errorDeBase(errorUsuario, 'de cuentas de usuario');
  }
  if (!usuario) {
    throw noEncontrado(`No existe una cuenta para el usuario ${identificadorLimpio}.`);
  }

  const contrasenaProvisoria = randomBytes(18).toString('base64url');
  const hashContrasena = await bcrypt.hash(contrasenaProvisoria, 10);
  const { error } = await supabase.rpc('restablecer_contrasena_usuario', {
    p_usuario_id: usuario.usuario_id,
    p_password_hash: hashContrasena,
    p_administrador_usuario_id: administradorUsuarioId,
  });

  if (error?.code === '42501') {
    throw prohibido('Solo un administrador activo puede restablecer contraseñas.');
  }
  if (error?.code === 'P0002') {
    throw noEncontrado(`No existe una cuenta para el usuario ${identificadorLimpio}.`);
  }
  if (error) {
    throw errorDeBase(error, 'de restablecimiento de contraseña');
  }

  return { identificador: usuario.identificador, contrasenaProvisoria };
}
