import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import { ENUM_ROL } from '../utiles/enumerados.js';
import { validarPasswordNueva } from '../utiles/contrasenas.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado, prohibido } from '../utiles/errores.js';
import {
  normalizarCuil,
  normalizarDni,
  normalizarTelefono,
  validarCuil,
  validarDni,
  validarEmail,
  validarTelefono,
} from '../utiles/validaciones.js';

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
 * Donde estan los datos personales de cada rol. Las tres tablas guardan lo
 * mismo (22/11/2026), cada una con su prefijo de columna.
 */
const TABLAS_PERFIL = {
  administrador: { tabla: 'administrador', prefijo: 'admin' },
  tecnico: { tabla: 'tecnico', prefijo: 'tecnico' },
  autorizado: { tabla: 'autorizado', prefijo: 'autorizado' },
};

function columnasDe(prefijo) {
  return {
    legajo: `${prefijo}_legajo`,
    nombre: `${prefijo}_nom_ape`,
    dni: `${prefijo}_dni`,
    cuil: `${prefijo}_cuil`,
    email: `${prefijo}_email`,
    telefono: `${prefijo}_tel`,
    fechaNacimiento: `${prefijo}_fecha_nac`,
  };
}

/** Un guion suelto cuenta como vacio: el administrador inicial se cargo asi. */
function textoOVacio(valor) {
  const limpio = String(valor ?? '').trim();
  return limpio === '-' ? '' : limpio;
}

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** Los anios cumplidos que pide el alta de un solicitante, y que se respetan aca. */
const EDAD_MINIMA = 18;

/**
 * Obtiene el perfil de quien inicio sesion, con los mismos datos para los tres
 * roles: { identificador, rol, legajo, nombre, dni, cuil, email, telefono, fechaNacimiento }.
 */
export async function obtenerPerfil(identificador, rol) {
  if (!identificador || !rol) return null;

  const rolTexto = ENUM_ROL.texto(rol) ?? rol;
  const destino = TABLAS_PERFIL[rolTexto];
  const base = { identificador, rol: rolTexto, legajo: identificador };

  if (!destino) return base;

  const columnas = columnasDe(destino.prefijo);

  const leer = (lista) =>
    supabase.from(destino.tabla).select(lista.join(', ')).eq(columnas.legajo, identificador).single();

  let { data, error } = await leer(Object.values(columnas));

  // 42703: falta la migracion 20261122120000 (DNI, CUIL, email y fecha de
  // tecnico y administrador). Se leen las columnas de siempre, asi el perfil
  // sigue mostrando el nombre y el telefono hasta que se aplique.
  if (error?.code === '42703') {
    ({ data, error } = await leer([columnas.legajo, columnas.nombre, columnas.telefono]));
  }

  // Si no encuentra la persona, devuelve al menos la info base.
  if (error || !data) return base;

  return {
    ...base,
    legajo: data[columnas.legajo] ?? identificador,
    nombre: textoOVacio(data[columnas.nombre]),
    dni: textoOVacio(data[columnas.dni]),
    cuil: textoOVacio(data[columnas.cuil]),
    email: textoOVacio(data[columnas.email]),
    telefono: textoOVacio(data[columnas.telefono]),
    fechaNacimiento: data[columnas.fechaNacimiento] ? String(data[columnas.fechaNacimiento]).slice(0, 10) : '',
  };
}

/**
 * Guarda los datos personales que la persona corrige desde «Mi perfil».
 *
 * El legajo y el rol no se tocan: el legajo sale de la sesion y no del pedido,
 * y el rol ni siquiera se lee. Las reglas de cada dato son las de
 * utiles/validaciones.js. Al solicitante se le siguen pidiendo el DNI y la
 * fecha de nacimiento, como en su alta (autorizados.servicio.js).
 */
export async function actualizarPerfil(identificador, rol, datos = {}) {
  const rolTexto = ENUM_ROL.texto(rol) ?? rol;
  const destino = TABLAS_PERFIL[rolTexto];
  if (!identificador || !destino) throw noEncontrado('Perfil no encontrado.');

  const nombre = limpiar(datos.nombre);
  const email = limpiar(datos.email);
  const fechaNacimiento = limpiar(datos.fechaNacimiento);

  if (!nombre) throw datoInvalido('El nombre y apellido es obligatorio.');
  if (nombre.length > 150) throw datoInvalido('El nombre y apellido no puede pasar los 150 caracteres.');

  if (rolTexto === 'autorizado') {
    if (!String(datos.dni ?? '').trim()) throw datoInvalido('El DNI es obligatorio.');
    if (!fechaNacimiento) throw datoInvalido('La fecha de nacimiento es obligatoria.');
  }

  const problema =
    validarDni(datos.dni) ||
    validarCuil(datos.cuil, datos.dni) ||
    validarTelefono(datos.telefono) ||
    validarEmail(email);

  if (problema) throw datoInvalido(problema);
  if (email && email.length > 150) throw datoInvalido('El email no puede pasar los 150 caracteres.');

  if (fechaNacimiento) {
    const fechaNac = new Date(`${fechaNacimiento}T00:00:00`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento) || Number.isNaN(fechaNac.getTime())) {
      throw datoInvalido('La fecha de nacimiento no es válida.');
    }

    const limite = new Date();
    limite.setFullYear(limite.getFullYear() - EDAD_MINIMA);

    if (fechaNac > new Date()) throw datoInvalido('La fecha de nacimiento no puede ser posterior a hoy.');
    if (fechaNac > limite) throw datoInvalido(`Tenés que tener al menos ${EDAD_MINIMA} años cumplidos.`);
  }

  const columnas = columnasDe(destino.prefijo);

  const { data, error } = await supabase
    .from(destino.tabla)
    .update({
      [columnas.nombre]: nombre,
      [columnas.dni]: normalizarDni(datos.dni),
      [columnas.cuil]: normalizarCuil(datos.cuil),
      [columnas.email]: email,
      [columnas.telefono]: normalizarTelefono(datos.telefono),
      [columnas.fechaNacimiento]: fechaNacimiento,
    })
    .eq(columnas.legajo, identificador)
    .select(columnas.legajo)
    .maybeSingle();

  if (error) {
    // 23505: DNI o CUIL repetido (son UNIQUE en la base).
    if (error.code === '23505') {
      throw conflicto('Ya hay otra persona cargada con ese DNI o ese CUIL.');
    }
    // 42703 / PGRST204: la columna no existe, falta la migracion 20261122120000.
    if (error.code === '42703' || error.code === 'PGRST204') {
      throw new Error('Falta aplicar la migración de datos personales en la base de datos (npm run db:push).');
    }
    throw errorDeBase(error, 'del perfil');
  }
  if (!data) throw noEncontrado('Perfil no encontrado.');

  return obtenerPerfil(identificador, rolTexto);
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
