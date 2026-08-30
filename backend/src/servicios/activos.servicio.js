/**
 * Activos: el inventario de lo que hay instalado en la facultad (HU-7).
 *
 * Dos reglas del dominio se cumplen aca adentro, no en la pantalla:
 *
 * 1. Un activo NUNCA se borra. Dar de baja es pasarlo a "Retirado", asi se
 *    conserva su historial de intervenciones (los tickets y las OT apuntan al
 *    codigo del activo).
 * 2. "En mantenimiento" no se pone a mano: lo va a poner la orden de trabajo
 *    cuando entre en ejecucion. Por eso el estado esta separado en dos listas.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

/** Todos los estados que puede tener un activo. */
export const ESTADOS = ['Operativo', 'En mantenimiento', 'Fuera de servicio', 'Retirado'];

/**
 * Los unicos que el administrador puede elegir.
 * "En mantenimiento" lo pone la OT y "Retirado" se pone dando de baja.
 */
export const ESTADOS_MANUALES = ['Operativo', 'Fuera de servicio'];

const ESTADO_INICIAL = 'Operativo';
const ESTADO_BAJA = 'Retirado';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** La fecha de hoy en formato AAAA-MM-DD, que es lo que espera una columna DATE. */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/*
 * Lo que se le pide a la base. El espacio se trae anidado porque su nombre y el
 * de su edificio se muestran en la tabla, y asi se evita una segunda consulta.
 */
const COLUMNAS = `
  activocodigo,
  activodesc,
  tipoactivoid,
  edificioid,
  espacionum,
  activofechaalta,
  activofechainst,
  activofechaultmant,
  activofechaultreub,
  activoestado,
  tipoactivo (
    tipoactivonom
  ),
  espacio (
    espacionom,
    edificio (
      edificionom
    )
  )
`;

/**
 * Pasa una fila de la base al formato que usa la aplicacion.
 *
 * Queda plano a proposito: el buscador de la tabla del frontend solo mira
 * campos de primer nivel, asi que el nombre del tipo y el del espacio suben al
 * nivel de arriba en lugar de quedar anidados.
 */
function aActivo(fila) {
  return {
    codigo: fila.activocodigo,
    descripcion: fila.activodesc || '',
    idTipoActivo: fila.tipoactivoid,
    nombreTipo: fila.tipoactivo ? fila.tipoactivo.tipoactivonom : '',
    idEdificio: fila.edificioid,
    espacioNum: fila.espacionum,
    nombreEspacio: fila.espacio ? fila.espacio.espacionom || fila.espacionum : '',
    nombreEdificio: fila.espacio && fila.espacio.edificio ? fila.espacio.edificio.edificionom : '',
    fechaAlta: fila.activofechaalta,
    fechaInstalacion: fila.activofechainst,
    fechaUltimoMantenimiento: fila.activofechaultmant,
    fechaUltimaReubicacion: fila.activofechaultreub,
    estado: fila.activoestado || ESTADO_INICIAL,
  };
}

/** Se fija que el espacio exista antes de mandar un activo ahi. */
async function verificarEspacio(idEdificio, espacioNum) {
  const { data } = await supabase
    .from('espacio')
    .select('espacionum')
    .eq('edificioid', idEdificio)
    .eq('espacionum', espacioNum)
    .maybeSingle();

  if (!data) {
    throw datoInvalido(`No existe el espacio ${espacioNum} en el edificio ${idEdificio}.`);
  }
}

/** Se fija que el tipo de activo exista. */
async function verificarTipo(idTipoActivo) {
  const { data } = await supabase
    .from('tipoactivo')
    .select('tipoactivoid')
    .eq('tipoactivoid', idTipoActivo)
    .maybeSingle();

  if (!data) {
    throw datoInvalido(`No existe el tipo de activo ${idTipoActivo}.`);
  }
}

/**
 * Lee la ubicacion y el tipo del cuerpo del pedido, con los avisos de siempre.
 * Los usan tanto el alta como la modificacion.
 */
function leerUbicacion(datos) {
  const idEdificio = Number(datos.idEdificio);
  const espacioNum = limpiar(datos.espacioNum);
  const idTipoActivo = Number(datos.idTipoActivo);

  if (!Number.isInteger(idEdificio) || !espacioNum) {
    throw datoInvalido('Hay que indicar en que espacio esta el activo.');
  }

  if (!Number.isInteger(idTipoActivo)) {
    throw datoInvalido('Hay que indicar el tipo de activo.');
  }

  return { idEdificio, espacioNum, idTipoActivo };
}

/**
 * @param {object} [filtros]
 * @param {number} [filtros.idEdificio]  - junto con espacioNum, filtra por espacio
 * @param {string} [filtros.espacioNum]
 * @param {number} [filtros.idTipoActivo]
 * @param {string} [filtros.estado]
 */
export async function obtenerTodos(filtros = {}) {
  let consulta = supabase.from('activo').select(COLUMNAS).order('activocodigo');

  // El espacio es una clave compuesta: filtrar por uno solo no tendria sentido.
  if (filtros.idEdificio && filtros.espacioNum) {
    consulta = consulta.eq('edificioid', filtros.idEdificio).eq('espacionum', filtros.espacioNum);
  }

  if (filtros.idTipoActivo) {
    consulta = consulta.eq('tipoactivoid', filtros.idTipoActivo);
  }

  if (filtros.estado) {
    consulta = consulta.eq('activoestado', filtros.estado);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  return data.map(aActivo);
}

export async function obtenerPorId(codigo) {
  const { data, error } = await supabase
    .from('activo')
    .select(COLUMNAS)
    .eq('activocodigo', codigo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}

/**
 * Alta de un activo.
 *
 * El estado no se toma del pedido: todo activo nuevo nace Operativo.
 */
export async function crear(datos) {
  const codigo = limpiar(datos.codigo);

  if (!codigo) {
    throw datoInvalido('El codigo de inventario es obligatorio.');
  }

  const { idEdificio, espacioNum, idTipoActivo } = leerUbicacion(datos);

  // El codigo de inventario no se puede repetir: es la forma de identificar
  // fisicamente al activo. Se compara sin distinguir mayusculas.
  const { data: repetido } = await supabase
    .from('activo')
    .select('activocodigo')
    .ilike('activocodigo', codigo)
    .maybeSingle();

  if (repetido) {
    throw conflicto(`Ya hay un activo con el codigo "${codigo}".`);
  }

  await verificarTipo(idTipoActivo);
  await verificarEspacio(idEdificio, espacioNum);

  const { data, error } = await supabase
    .from('activo')
    .insert({
      activocodigo: codigo,
      activodesc: limpiar(datos.descripcion),
      tipoactivoid: idTipoActivo,
      edificioid: idEdificio,
      espacionum: espacioNum,
      activofechaalta: hoy(),
      activofechainst: limpiar(datos.fechaInstalacion),
      activoestado: ESTADO_INICIAL,
    })
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);

  return aActivo(data);
}

/**
 * Modificacion de un activo.
 *
 * Cambiar el espacio es reubicarlo, asi que cuando cambia se anota la fecha:
 * es lo que deja registrado el movimiento.
 */
export async function actualizar(codigo, datos) {
  const actual = await obtenerPorId(codigo);

  if (actual.estado === ESTADO_BAJA) {
    throw conflicto(
      `El activo "${codigo}" esta retirado y no se puede modificar. Se conserva como historial.`
    );
  }

  const { idEdificio, espacioNum, idTipoActivo } = leerUbicacion(datos);

  const estado = limpiar(datos.estado) ?? actual.estado;

  // Solo se aceptan los estados que el administrador puede elegir. Si el activo
  // ya venia En mantenimiento, se permite dejarlo como estaba: ese estado lo
  // maneja la orden de trabajo, no esta pantalla.
  if (estado !== actual.estado && !ESTADOS_MANUALES.includes(estado)) {
    throw datoInvalido(
      `"${estado}" no es un estado que se pueda poner a mano. Los estados posibles son: ${ESTADOS_MANUALES.join(', ')}.`
    );
  }

  await verificarTipo(idTipoActivo);

  const cambioDeEspacio = idEdificio !== actual.idEdificio || espacioNum !== actual.espacioNum;

  if (cambioDeEspacio) {
    await verificarEspacio(idEdificio, espacioNum);
  }

  const cambios = {
    activodesc: limpiar(datos.descripcion),
    tipoactivoid: idTipoActivo,
    edificioid: idEdificio,
    espacionum: espacioNum,
    activofechainst: limpiar(datos.fechaInstalacion),
    activoestado: estado,
  };

  if (cambioDeEspacio) {
    cambios.activofechaultreub = hoy();
  }

  const { data, error } = await supabase
    .from('activo')
    .update(cambios)
    .eq('activocodigo', codigo)
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}

/**
 * Baja de un activo: pasa a Retirado.
 *
 * No hay borrado. El activo queda en la base para no perder los tickets y las
 * ordenes de trabajo que le apuntan.
 */
export async function darDeBaja(codigo) {
  const actual = await obtenerPorId(codigo);

  if (actual.estado === ESTADO_BAJA) {
    throw conflicto(`El activo "${codigo}" ya estaba retirado.`);
  }

  const { data, error } = await supabase
    .from('activo')
    .update({ activoestado: ESTADO_BAJA })
    .eq('activocodigo', codigo)
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}
