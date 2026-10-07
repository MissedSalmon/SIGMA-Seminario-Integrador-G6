import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto, errorDeBase } from '../utiles/errores.js';

/**
 * Tipos de prestador de servicio (HU-24): la clase de servicio que da una
 * empresa o un profesional de afuera. Es una tabla de apoyo de los
 * prestadores (HU-33).
 */

const QUE_FALTA = 'de tipos de prestador';

// Codigo de Postgres cuando se rompe un indice unico.
const DUPLICADO = '23505';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

function mapear(fila) {
  return {
    idTipoPrestador: fila.tipo_prestador_id,
    nombre: fila.tipo_prestador_nom,
    descripcion: fila.tipo_prestador_desc ?? '',
  };
}

function validar(datos) {
  const nombre = limpiar(datos.nombre);
  const descripcion = limpiar(datos.descripcion);

  if (!nombre) throw datoInvalido('El nombre del tipo de prestador es obligatorio.');
  if (nombre.length > 100) throw datoInvalido('El nombre no puede tener más de 100 caracteres.');
  if (descripcion && descripcion.length > 300) {
    throw datoInvalido('La descripción no puede tener más de 300 caracteres.');
  }

  return { tipo_prestador_nom: nombre, tipo_prestador_desc: descripcion };
}

async function revisarNombreRepetido(nombre, idQueSeEdita = null) {
  let consulta = supabase
    .from('tipo_prestador')
    .select('tipo_prestador_id')
    .ilike('tipo_prestador_nom', nombre);

  if (idQueSeEdita !== null) consulta = consulta.neq('tipo_prestador_id', idQueSeEdita);

  const { data, error } = await consulta.limit(1);
  if (error) throw errorDeBase(error, QUE_FALTA);

  if (data.length > 0) throw conflicto(`Ya existe un tipo de prestador con el nombre "${nombre}".`);
}

export async function obtenerTodos() {
  const { data, error } = await supabase
    .from('tipo_prestador')
    .select('*')
    .order('tipo_prestador_nom', { ascending: true });

  if (error) throw errorDeBase(error, QUE_FALTA);

  return (data ?? []).map(mapear);
}

export async function obtenerPorId(idTipoPrestador) {
  const { data, error } = await supabase
    .from('tipo_prestador')
    .select('*')
    .eq('tipo_prestador_id', idTipoPrestador)
    .maybeSingle();

  if (error) throw errorDeBase(error, QUE_FALTA);
  if (!data) throw noEncontrado(`No existe el tipo de prestador ${idTipoPrestador}.`);

  return mapear(data);
}

export async function crear(datos) {
  const fila = validar(datos);
  await revisarNombreRepetido(fila.tipo_prestador_nom);

  const { data, error } = await supabase.from('tipo_prestador').insert(fila).select().single();

  if (error?.code === DUPLICADO) {
    throw conflicto(`Ya existe un tipo de prestador con el nombre "${fila.tipo_prestador_nom}".`);
  }
  if (error) throw errorDeBase(error, QUE_FALTA);

  return mapear(data);
}

export async function actualizar(idTipoPrestador, datos) {
  const fila = validar(datos);
  await obtenerPorId(idTipoPrestador);
  await revisarNombreRepetido(fila.tipo_prestador_nom, idTipoPrestador);

  const { data, error } = await supabase
    .from('tipo_prestador')
    .update(fila)
    .eq('tipo_prestador_id', idTipoPrestador)
    .select()
    .single();

  if (error?.code === DUPLICADO) {
    throw conflicto(`Ya existe un tipo de prestador con el nombre "${fila.tipo_prestador_nom}".`);
  }
  if (error) throw errorDeBase(error, QUE_FALTA);

  return mapear(data);
}

export async function eliminar(idTipoPrestador) {
  const tipo = await obtenerPorId(idTipoPrestador);

  // No se borra un tipo que ya tiene prestadores: quedarian sin tipo.
  const { count, error: errorUso } = await supabase
    .from('prestador_servicio')
    .select('prestador_serv_id', { count: 'exact', head: true })
    .eq('tipo_prestador_id', idTipoPrestador);

  if (errorUso) throw errorDeBase(errorUso, QUE_FALTA);
  if (count > 0) {
    throw conflicto(`No se puede eliminar "${tipo.nombre}" porque hay prestadores de ese tipo.`);
  }

  const { error } = await supabase.from('tipo_prestador').delete().eq('tipo_prestador_id', idTipoPrestador);
  if (error) throw errorDeBase(error, QUE_FALTA);

  return tipo;
}
