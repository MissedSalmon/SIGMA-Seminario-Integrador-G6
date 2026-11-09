/**
 * Gestion de usuarios (HU Gestion de usuarios, Sprint 6).
 *
 * Un usuario es la cuenta con la que una persona (administrador, tecnico o
 * usuario autorizado) entra al sistema. Vive en la tabla `usuario` (la misma
 * que usa el login de HU-30) y tiene un unico rol, que es el tipo de persona.
 * Se crea junto con la persona (crearUsuarioDePersona) y se gestiona desde la
 * lista de cada tipo: /tecnicos y /autorizados (06/11/2026).
 *
 * La baja es logica: desactivar pone `activo = false` y nada mas. La fila no se
 * borra, asi que todo lo que la persona registro queda como estaba. Un usuario
 * desactivado no puede iniciar sesion (ver validarCredenciales en auth.servicio.js).
 *
 * Al activar o desactivar, el usuario vuelve como
 * { idUsuario, nombreUsuario, rol, legajo, persona, activo, fechaCreacion, fechaActualizacion }.
 * La contraseña (ni siquiera cifrada) nunca sale de aca.
 */
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

import { supabase } from '../config/supabase.js';
import { ENUM_ROL } from '../utiles/enumerados.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado, prohibido } from '../utiles/errores.js';

/** Donde esta registrada cada persona, segun su rol. */
const PERSONAS = {
  administrador: { tabla: 'administrador', legajo: 'admin_legajo', nombre: 'admin_nom_ape' },
  tecnico: { tabla: 'tecnico', legajo: 'tecnico_legajo', nombre: 'tecnico_nom_ape' },
  autorizado: { tabla: 'autorizado', legajo: 'autorizado_legajo', nombre: 'autorizado_nom_ape' },
};

const COLUMNAS =
  'usuario_id, identificador, rol, activo, creado_en, actualizado_en, ' +
  'admin_legajo, tecnico_legajo, autorizado_legajo, ' +
  'administrador(admin_nom_ape), tecnico(tecnico_nom_ape), autorizado(autorizado_nom_ape)';

function aUsuario(fila) {
  const rol = ENUM_ROL.texto(fila.rol);
  const persona = PERSONAS[rol];

  return {
    idUsuario: fila.usuario_id,
    nombreUsuario: fila.identificador,
    rol,
    legajo: persona ? (fila[persona.legajo] ?? '') : '',
    persona: persona ? (fila[persona.tabla]?.[persona.nombre] ?? '') : '',
    activo: fila.activo,
    fechaCreacion: fila.creado_en ?? null,
    fechaActualizacion: fila.actualizado_en ?? null,
  };
}

async function obtenerFila(idUsuario) {
  const { data, error } = await supabase
    .from('usuario')
    .select(COLUMNAS)
    .eq('usuario_id', idUsuario)
    .maybeSingle();

  if (error) throw errorDeBase(error, 'de usuarios');
  if (!data) throw noEncontrado('El usuario no existe.');

  return data;
}

/**
 * El estado del usuario de una persona, leido de su fila con `usuario(usuario_id, activo)`.
 * PostgREST lo manda como objeto (la clave es UNIQUE) o como lista, segun la version.
 * Sin usuario, `activo` es null.
 */
export function cuentaDe(fila) {
  const cuenta = Array.isArray(fila?.usuario) ? fila.usuario[0] : fila?.usuario;
  return { idUsuario: cuenta?.usuario_id ?? null, activo: cuenta ? cuenta.activo === true : null };
}

/** Corta una asignacion nueva (tarea o herramienta) a un tecnico cuyo usuario esta desactivado. */
export async function controlarTecnicoActivo(legajo) {
  const { data, error } = await supabase
    .from('usuario')
    .select('activo')
    .eq('tecnico_legajo', String(legajo))
    .maybeSingle();
  if (error) throw errorDeBase(error, 'de usuarios');
  if (data && data.activo !== true) {
    throw conflicto(`El técnico ${legajo} está desactivado: no se le pueden asignar tareas ni herramientas nuevas.`);
  }
}

/** Cuantas observaciones de tareas escribio la persona con su usuario. Frenan su eliminacion. */
export async function contarObservacionesDe(columnaLegajo, legajo) {
  const { data: cuenta, error } = await supabase
    .from('usuario')
    .select('usuario_id')
    .eq(columnaLegajo, String(legajo))
    .maybeSingle();
  if (error) throw errorDeBase(error, 'de usuarios');
  if (!cuenta) return 0;

  const { count, error: errorConteo } = await supabase
    .from('tarea_observacion')
    .select('usuario_id', { count: 'exact', head: true })
    .eq('usuario_id', cuenta.usuario_id);
  if (errorConteo) throw errorDeBase(errorConteo);
  return count ?? 0;
}

/**
 * Corta un alta si el legajo ya es el nombre de otro usuario. Pasa si un
 * tecnico y un autorizado comparten legajo: el login no sabria a quien dejar entrar.
 */
export async function controlarNombreLibre(legajo) {
  const { data, error } = await supabase
    .from('usuario')
    .select('usuario_id')
    .eq('identificador', legajo)
    .maybeSingle();
  if (error) throw errorDeBase(error, 'de usuarios');
  if (data) throw conflicto(`Ya hay un usuario con el nombre "${legajo}" (el legajo de otra persona).`);
}

/**
 * El unico lugar donde se crea un usuario (decision del 06/11/2026): lo usan el
 * alta de tecnicos, la de autorizados y la de /usuarios.
 *
 * El nombre de usuario es el legajo, y la contraseña provisoria tambien: la
 * persona la tiene que cambiar la primera vez que entra. Las tareas del tecnico
 * y los tickets del autorizado se buscan por el nombre de usuario de la sesion,
 * por eso no puede ser otro.
 */
export async function crearUsuarioDePersona(rol, legajo) {
  const persona = PERSONAS[rol];
  const nombreUsuario = String(legajo);

  const { data, error } = await supabase
    .from('usuario')
    .insert({
      identificador: nombreUsuario,
      password_hash: await bcrypt.hash(nombreUsuario, 10),
      rol: ENUM_ROL.codigo(rol),
      require_password_change: true,
      activo: true,
      [persona.legajo]: nombreUsuario,
    })
    .select('usuario_id')
    .single();

  if (error) {
    // 23505: otro pedido gano la carrera y la base freno el duplicado.
    if (error.code === '23505') throw conflicto('La persona ya tiene un usuario o su legajo ya es el nombre de otro usuario.');
    throw errorDeBase(error, 'de usuarios');
  }

  return data.usuario_id;
}

async function cambiarActivo(idUsuario, activo) {
  const { data, error } = await supabase
    .from('usuario')
    .update({ activo })
    .eq('usuario_id', idUsuario)
    .select(COLUMNAS)
    .single();

  if (error || !data) throw errorDeBase(error, 'de usuarios');

  return aUsuario(data);
}

/**
 * Baja logica: el usuario ya no puede entrar, pero no se borra nada.
 *
 * Un administrador no se puede desactivar a si mismo, y siempre tiene que
 * quedar al menos un administrador activo: si no, nadie podria volver a
 * gestionar los usuarios.
 */
export async function desactivar(idUsuario, idSolicitante) {
  const fila = await obtenerFila(idUsuario);

  if (!fila.activo) throw conflicto('El usuario ya está desactivado.');
  if (idUsuario === idSolicitante) throw conflicto('No podés desactivar tu propio usuario.');

  if (fila.rol === ENUM_ROL.codigo('administrador')) {
    const { count, error } = await supabase
      .from('usuario')
      .select('usuario_id', { count: 'exact', head: true })
      .eq('rol', ENUM_ROL.codigo('administrador'))
      .eq('activo', true);
    if (error) throw errorDeBase(error, 'de usuarios');

    if ((count ?? 0) <= 1) {
      throw conflicto('No se puede desactivar al último administrador activo.');
    }
  }

  return cambiarActivo(idUsuario, false);
}

/** Le devuelve el acceso a un usuario desactivado. */
export async function activar(idUsuario) {
  const fila = await obtenerFila(idUsuario);
  if (fila.activo) throw conflicto('El usuario ya está activo.');

  return cambiarActivo(idUsuario, true);
}

/**
 * Si el usuario de la sesion es, segun la base y no segun el token, un
 * administrador activo. El token dura 30 minutos: si en ese tiempo lo
 * desactivaron, no tiene que poder seguir gestionando usuarios.
 */
export async function esAdministradorActivo(idUsuario) {
  if (!idUsuario) return false;

  const { data, error } = await supabase
    .from('usuario')
    .select('rol, activo')
    .eq('usuario_id', idUsuario)
    .maybeSingle();

  if (error || !data) return false;

  return data.activo === true && data.rol === ENUM_ROL.codigo('administrador');
}

/**
 * Restablecer la contraseña de un usuario (HU-31).
 *
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
