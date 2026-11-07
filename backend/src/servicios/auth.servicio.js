import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { ENUM_ROL } from '../utiles/enumerados.js';
import { validarPasswordNueva } from '../utiles/contrasenas.js';
import { datoInvalido, errorDeBase, noEncontrado, prohibido } from '../utiles/errores.js';

/**
 * Valida credenciales contra la base de datos.
 *
 * Es la unica funcion que autentica: la usa el login (POST /api/auth/login).
 * Devuelve null si el usuario no existe, si la contraseña no coincide o si el
 * usuario esta desactivado (gestion de usuarios). El login contesta lo mismo en
 * los tres casos, asi no se revela cual fue el motivo.
 */
export async function validarCredenciales(identificador, passwordPlana) {
  if (!identificador || !passwordPlana || typeof identificador !== 'string' || typeof passwordPlana !== 'string') {
    return null;
  }

  const idLimpio = identificador.trim();
  if (!idLimpio) return null;

  // 1. Buscar el usuario
  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('*')
    .eq('identificador', idLimpio)
    .eq('activo', true)
    .single();

  // La consulta ya filtra los activos; se vuelve a mirar por si la fila llega igual.
  if (error || !usuario || usuario.activo !== true) {
    return null;
  }

  // 2. Verificar contraseña
  const passwordValida = await bcrypt.compare(passwordPlana, usuario.password_hash);
  
  if (!passwordValida) {
    return null;
  }

  const rolTexto = ENUM_ROL.texto(usuario.rol) ?? usuario.rol;

  return {
    usuarioId: usuario.usuario_id,
    identificador: usuario.identificador,
    rol: rolTexto,
    requirePasswordChange: usuario.require_password_change,
  };
}

/**
 * Obtiene el perfil combinando usuario y la tabla especifica del rol
 */
export async function obtenerPerfil(identificador, rol) {
  if (!identificador || !rol) return null;

  const rolTexto = ENUM_ROL.texto(rol) ?? rol;

  let tablaRol = '';
  let columnaId = '';
  let campos = '';

  if (rolTexto === 'administrador') {
    tablaRol = 'administrador';
    columnaId = 'admin_legajo';
    campos = 'admin_nom_ape, admin_tel, admin_fecha_asun';
  } else if (rolTexto === 'tecnico') {
    tablaRol = 'tecnico';
    columnaId = 'tecnico_legajo';
    campos = 'tecnico_nom_ape, tecnico_tel, tecnico_disponibilidad';
  } else if (rolTexto === 'autorizado') {
    tablaRol = 'autorizado';
    columnaId = 'autorizado_legajo';
    campos = 'autorizado_legajo, autorizado_nom_ape, autorizado_dni, autorizado_cuil, autorizado_tel, autorizado_email';
  } else {
    return { identificador, rol: rolTexto };
  }

  const { data, error } = await supabase
    .from(tablaRol)
    .select(campos)
    .eq(columnaId, identificador)
    .single();

  if (error || !data) {
    // Si no encuentra el perfil en la tabla especifica, devuelve al menos la info base
    return { identificador, rol: rolTexto };
  }

  return { ...data, identificador, rol: rolTexto };
}

/**
 * Cambia la contraseña del usuario de la sesion: la obligatoria del primer
 * ingreso (HU-30) y la que cualquiera puede hacer desde su perfil.
 *
 * Pide la actual aunque la sesion este abierta, para que nadie la cambie desde
 * una computadora que quedo con la sesion de otro. La nueva tiene que ser
 * distinta: si no, el cambio obligatorio se podria saltear.
 */
export async function cambiarPassword(identificador, passwordActual, passwordNueva) {
  if (typeof passwordActual !== 'string' || !passwordActual) {
    throw datoInvalido('Falta la contraseña actual.');
  }

  const problema = validarPasswordNueva(passwordNueva);
  if (problema) throw datoInvalido(problema);

  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('usuario_id, password_hash, activo')
    .eq('identificador', String(identificador ?? '').trim())
    .maybeSingle();

  if (error) throw errorDeBase(error, 'de usuarios');
  if (!usuario) throw noEncontrado('El usuario de la sesión no existe.');
  // El token dura 30 minutos: si en ese tiempo lo desactivaron, ya no puede cambiar nada.
  if (usuario.activo !== true) throw prohibido('El usuario está desactivado.');

  const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValida) throw datoInvalido('La contraseña actual no es correcta.');

  if (passwordNueva === passwordActual) {
    throw datoInvalido('La contraseña nueva tiene que ser distinta de la actual.');
  }

  const nuevoHash = await bcrypt.hash(passwordNueva, 10);

  const { error: errorCambio } = await supabase
    .from('usuario')
    .update({ password_hash: nuevoHash, require_password_change: false })
    .eq('usuario_id', usuario.usuario_id);

  if (errorCambio) throw errorDeBase(errorCambio, 'de usuarios');
}
