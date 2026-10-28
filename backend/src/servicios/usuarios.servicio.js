/**
 * Gestion de usuarios (HU Gestion de usuarios, Sprint 6).
 *
 * Un usuario es la cuenta con la que una persona ya registrada (administrador,
 * tecnico o usuario autorizado) entra al sistema. Vive en la tabla `usuario`
 * (la misma que usa el login de HU-30) y tiene un unico rol, que es el tipo de
 * persona a la que pertenece.
 *
 * La baja es logica: desactivar pone `activo = false` y nada mas. La fila no se
 * borra, asi que todo lo que la persona registro queda como estaba. Un usuario
 * desactivado no puede iniciar sesion (ver validarCredenciales en auth.servicio.js).
 *
 * Cada usuario llega a la API como
 * { idUsuario, nombreUsuario, rol, legajo, persona, activo, fechaCreacion, fechaActualizacion }.
 * La contraseña (ni siquiera cifrada) nunca sale de aca.
 */
import bcrypt from 'bcryptjs';

import { supabase } from '../config/supabase.js';
import { ENUM_ROL } from '../utiles/enumerados.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado } from '../utiles/errores.js';

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

/** Lo minimo que tiene que tener la contraseña inicial (igual que al cambiarla, HU-30). */
export const LARGO_MINIMO_PASSWORD = 6;
const LARGO_MAXIMO_NOMBRE = 50;

function limpiar(valor) {
  return typeof valor === 'string' ? valor.trim() : String(valor ?? '').trim();
}

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

function validarDatos(datos = {}) {
  const rol = limpiar(datos.rol);
  if (!rol) throw datoInvalido('El rol es obligatorio.');
  if (!ENUM_ROL.incluye(rol)) {
    throw datoInvalido(`"${rol}" no es un rol válido. Son: ${ENUM_ROL.textos.join(', ')}.`);
  }

  const legajo = limpiar(datos.legajo);
  if (!legajo) throw datoInvalido('Hay que elegir la persona.');

  const nombreUsuario = limpiar(datos.nombreUsuario);
  if (!nombreUsuario) throw datoInvalido('El nombre de usuario es obligatorio.');
  if (/\s/.test(nombreUsuario)) throw datoInvalido('El nombre de usuario no puede tener espacios.');
  if (nombreUsuario.length > LARGO_MAXIMO_NOMBRE) {
    throw datoInvalido(`El nombre de usuario no puede tener más de ${LARGO_MAXIMO_NOMBRE} caracteres.`);
  }

  // La contraseña no se recorta: un espacio al final tambien es parte de ella.
  const password = typeof datos.password === 'string' ? datos.password : '';
  if (password.length < LARGO_MINIMO_PASSWORD) {
    throw datoInvalido(`La contraseña tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`);
  }

  return { rol, legajo, nombreUsuario, password };
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

/** GET /api/usuarios. Filtros opcionales: rol ('tecnico') y activo ('true' / 'false'). */
export async function obtenerTodos({ rol, activo } = {}) {
  const { data, error } = await supabase.from('usuario').select(COLUMNAS).order('identificador');
  if (error) throw errorDeBase(error, 'de usuarios');

  let usuarios = data.map(aUsuario);

  if (rol) usuarios = usuarios.filter((usuario) => usuario.rol === rol);
  if (activo === 'true' || activo === 'false') {
    usuarios = usuarios.filter((usuario) => usuario.activo === (activo === 'true'));
  }

  return usuarios;
}

export async function obtenerPorId(idUsuario) {
  return aUsuario(await obtenerFila(idUsuario));
}

/**
 * Las personas registradas que todavia no tienen usuario. Son las que se
 * pueden elegir al dar de alta uno. Llegan como { rol, legajo, nombre }.
 */
export async function obtenerPersonasSinUsuario() {
  const { data: usuarios, error } = await supabase
    .from('usuario')
    .select('admin_legajo, tecnico_legajo, autorizado_legajo');
  if (error) throw errorDeBase(error, 'de usuarios');

  const personas = [];

  for (const [rol, persona] of Object.entries(PERSONAS)) {
    const conUsuario = new Set(usuarios.map((usuario) => usuario[persona.legajo]).filter(Boolean));

    const { data: filas, error: errorPersonas } = await supabase
      .from(persona.tabla)
      .select(`${persona.legajo}, ${persona.nombre}`)
      .order(persona.nombre);
    if (errorPersonas) throw errorDeBase(errorPersonas);

    for (const fila of filas) {
      const legajo = String(fila[persona.legajo]);
      if (!conUsuario.has(legajo)) personas.push({ rol, legajo, nombre: fila[persona.nombre] ?? legajo });
    }
  }

  return personas;
}

/**
 * Alta de un usuario para una persona ya registrada.
 *
 * Controla, en este orden: que los datos esten bien, que la persona exista,
 * que no tenga ya un usuario y que el nombre de usuario no este en uso. La
 * base repite los dos ultimos controles (UNIQUE), por si dos altas llegan a la vez.
 *
 * La contraseña inicial se guarda cifrada con bcrypt y el usuario tiene que
 * cambiarla la primera vez que entra (igual que los que se crean con HU-30).
 */
export async function crear(datos) {
  const { rol, legajo, nombreUsuario, password } = validarDatos(datos);
  const persona = PERSONAS[rol];

  const { data: registrada, error: errorPersona } = await supabase
    .from(persona.tabla)
    .select(`${persona.legajo}, ${persona.nombre}`)
    .eq(persona.legajo, legajo)
    .maybeSingle();
  if (errorPersona) throw errorDeBase(errorPersona);
  if (!registrada) throw noEncontrado(`No hay ningún ${rol} registrado con el legajo ${legajo}.`);

  const { data: usuarioDeLaPersona, error: errorUsuario } = await supabase
    .from('usuario')
    .select('usuario_id')
    .eq(persona.legajo, legajo)
    .maybeSingle();
  if (errorUsuario) throw errorDeBase(errorUsuario, 'de usuarios');
  if (usuarioDeLaPersona) {
    throw conflicto(`${registrada[persona.nombre] ?? `El legajo ${legajo}`} ya tiene un usuario.`);
  }

  const { data: mismoNombre, error: errorNombre } = await supabase
    .from('usuario')
    .select('usuario_id')
    .eq('identificador', nombreUsuario)
    .maybeSingle();
  if (errorNombre) throw errorDeBase(errorNombre, 'de usuarios');
  if (mismoNombre) throw conflicto(`El nombre de usuario "${nombreUsuario}" ya está en uso.`);

  const passwordHash = await bcrypt.hash(password, 10);

  const { data: nuevo, error } = await supabase
    .from('usuario')
    .insert({
      identificador: nombreUsuario,
      password_hash: passwordHash,
      rol: ENUM_ROL.codigo(rol),
      require_password_change: true,
      activo: true,
      [persona.legajo]: legajo,
    })
    .select('usuario_id')
    .single();

  if (error) {
    // 23505: otro pedido gano la carrera y la base freno el duplicado.
    if (error.code === '23505') throw conflicto('La persona ya tiene un usuario o el nombre de usuario ya está en uso.');
    throw errorDeBase(error, 'de usuarios');
  }

  return obtenerPorId(nuevo.usuario_id);
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
