import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';

/**
 * Valida credenciales contra la base de datos
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

  if (error || !usuario) {
    return null;
  }

  // 2. Verificar contraseña
  const passwordValida = await bcrypt.compare(passwordPlana, usuario.password_hash);
  
  if (!passwordValida) {
    return null;
  }

  return {
    usuarioId: usuario.usuario_id,
    identificador: usuario.identificador,
    rol: usuario.rol,
    requirePasswordChange: usuario.require_password_change,
  };
}

/**
 * Obtiene el perfil combinando usuario y la tabla especifica del rol
 */
export async function obtenerPerfil(identificador, rol) {
  if (!identificador || !rol) return null;

  let tablaRol = '';
  let columnaId = '';
  let campos = '';

  if (rol === 'administrador') {
    tablaRol = 'administrador';
    columnaId = 'admin_legajo';
    campos = 'admin_nom_ape, admin_tel, admin_fecha_asun';
  } else if (rol === 'tecnico') {
    tablaRol = 'tecnico';
    columnaId = 'tecnico_legajo';
    campos = 'tecnico_nom_ape, tecnico_tel, tecnico_disponibilidad';
  } else if (rol === 'autorizado') {
    tablaRol = 'autorizado';
    columnaId = 'autorizado_legajo';
    campos = 'autorizado_legajo, autorizado_nom_ape, autorizado_dni, autorizado_cuil, autorizado_tel, autorizado_email';
  } else {
    return { identificador, rol };
  }

  const { data, error } = await supabase
    .from(tablaRol)
    .select(campos)
    .eq(columnaId, identificador)
    .single();

  if (error || !data) {
    // Si no encuentra el perfil en la tabla especifica, devuelve al menos la info base
    return { identificador, rol };
  }

  return { ...data, identificador, rol };
}

/**
 * Cambia la contraseña
 */
export async function cambiarPassword(identificador, passwordActual, passwordNueva) {
  if (!identificador || !passwordActual || !passwordNueva || typeof passwordNueva !== 'string' || passwordNueva.length < 6) {
    return false;
  }

  const idLimpio = identificador.trim();

  const { data: usuario, error } = await supabase
    .from('usuario')
    .select('usuario_id, password_hash')
    .eq('identificador', idLimpio)
    .single();

  if (error || !usuario) return false;

  const passwordValida = await bcrypt.compare(passwordActual, usuario.password_hash);
  if (!passwordValida) return false;

  const nuevoHash = await bcrypt.hash(passwordNueva, 10);

  const { error: updateError } = await supabase
    .from('usuario')
    .update({ 
      password_hash: nuevoHash, 
      require_password_change: false,
    })
    .eq('usuario_id', usuario.usuario_id);

  return !updateError;
}
