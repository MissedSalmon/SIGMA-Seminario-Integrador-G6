import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto, errorDeBase } from '../utiles/errores.js';
import {
  validarCuil,
  normalizarCuil,
  validarTelefono,
  normalizarTelefono,
  validarEmail,
} from '../utiles/validaciones.js';

/**
 * Prestadores de servicio (HU-25): las empresas o profesionales de afuera que
 * hacen los trabajos que el equipo propio no cubre.
 *
 * Cada prestador tiene uno o mas tipos de prestador (HU-24), guardados en la
 * tabla intermedia prestador_tipo_prestador. Al armar la OT se elige un
 * prestador como responsable de una tarea (HU-14).
 */

const QUE_FALTA = 'de prestadores';

// Codigo de Postgres cuando se rompe un indice unico (el CUIL es UNIQUE).
const DUPLICADO = '23505';

const COLUMNAS_CON_TIPOS = `*,
  prestador_tipo_prestador (
    tipo_prestador_id,
    tipo_prestador (
      tipo_prestador_nom
    )
  )
`;

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

function mapear(fila) {
  return {
    idPrestador: fila.prestador_serv_id,
    nombre: fila.prestador_serv_nom,
    cuil: fila.prestador_serv_cuil ?? '',
    telefono: fila.prestador_serv_tel ?? '',
    email: fila.prestador_serv_email ?? '',
    garantia: fila.prestador_serv_garantia ?? '',
    tipos: (fila.prestador_tipo_prestador ?? [])
      .map((relacion) => ({
        idTipoPrestador: relacion.tipo_prestador_id,
        nombre: relacion.tipo_prestador?.tipo_prestador_nom ?? '',
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre)),
  };
}

/** Valida y normaliza lo que llega del formulario. Devuelve la fila y los tipos aparte. */
function validar(datos) {
  const nombre = limpiar(datos.nombre);
  const email = limpiar(datos.email);
  const garantia = limpiar(datos.garantia);
  const tipos = Array.isArray(datos.tipos)
    ? [...new Set(datos.tipos.map(Number).filter((id) => Number.isInteger(id) && id > 0))]
    : [];

  if (!nombre) throw datoInvalido('El nombre del prestador es obligatorio.');
  if (nombre.length > 150) throw datoInvalido('El nombre no puede tener más de 150 caracteres.');

  if (!limpiar(datos.cuil)) throw datoInvalido('El CUIL del prestador es obligatorio.');
  const problemaCuil = validarCuil(datos.cuil);
  if (problemaCuil) throw datoInvalido(problemaCuil);

  const problemaTelefono = validarTelefono(datos.telefono);
  if (problemaTelefono) throw datoInvalido(problemaTelefono);

  const problemaEmail = validarEmail(email);
  if (problemaEmail) throw datoInvalido(problemaEmail);
  if (email && email.length > 150) throw datoInvalido('El email no puede tener más de 150 caracteres.');

  if (garantia && garantia.length > 200) {
    throw datoInvalido('La garantía no puede tener más de 200 caracteres.');
  }

  if (tipos.length === 0) throw datoInvalido('Hay que elegir al menos un tipo de prestador.');

  return {
    fila: {
      prestador_serv_nom: nombre,
      prestador_serv_cuil: normalizarCuil(datos.cuil),
      prestador_serv_tel: normalizarTelefono(datos.telefono),
      prestador_serv_email: email,
      prestador_serv_garantia: garantia,
    },
    tipos,
  };
}

/** Corta el alta o la edicion si algun tipo elegido no existe. */
async function revisarTiposExisten(idsTipo) {
  const { data, error } = await supabase
    .from('tipo_prestador')
    .select('tipo_prestador_id')
    .in('tipo_prestador_id', idsTipo);

  if (error) throw errorDeBase(error, QUE_FALTA);
  if (!data || data.length !== idsTipo.length) {
    throw datoInvalido('Alguno de los tipos de prestador elegidos no existe.');
  }
}

async function revisarCuilRepetido(cuil, idQueSeEdita = null) {
  let consulta = supabase
    .from('prestador_servicio')
    .select('prestador_serv_nom')
    .eq('prestador_serv_cuil', cuil);

  if (idQueSeEdita !== null) consulta = consulta.neq('prestador_serv_id', idQueSeEdita);

  const { data, error } = await consulta.limit(1);
  if (error) throw errorDeBase(error, QUE_FALTA);

  if (data.length > 0) {
    throw conflicto(`El CUIL ${cuil} ya está cargado en el prestador "${data[0].prestador_serv_nom}".`);
  }
}

/** Reemplaza por completo los tipos de un prestador (se usa en alta y en edicion). */
async function asignarTipos(idPrestador, idsTipo) {
  const { error: errorBorrado } = await supabase
    .from('prestador_tipo_prestador')
    .delete()
    .eq('prestador_serv_id', idPrestador);
  if (errorBorrado) throw errorDeBase(errorBorrado, QUE_FALTA);

  const filas = idsTipo.map((idTipo) => ({
    prestador_serv_id: idPrestador,
    tipo_prestador_id: idTipo,
  }));

  const { error } = await supabase.from('prestador_tipo_prestador').insert(filas);
  if (error) throw errorDeBase(error, QUE_FALTA);
}

export async function obtenerTodos({ idTipoPrestador } = {}) {
  const { data, error } = await supabase
    .from('prestador_servicio')
    .select(COLUMNAS_CON_TIPOS)
    .order('prestador_serv_nom', { ascending: true });

  if (error) throw errorDeBase(error, QUE_FALTA);

  let prestadores = (data ?? []).map(mapear);

  // PostgREST no deja filtrar la tabla principal por una columna de una
  // relacion N:M, asi que el filtro por tipo se aplica aca (igual que tecnicos).
  if (idTipoPrestador) {
    const idNumerico = Number(idTipoPrestador);
    prestadores = prestadores.filter((prestador) =>
      prestador.tipos.some((tipo) => tipo.idTipoPrestador === idNumerico)
    );
  }

  return prestadores;
}

export async function obtenerPorId(idPrestador) {
  const { data, error } = await supabase
    .from('prestador_servicio')
    .select(COLUMNAS_CON_TIPOS)
    .eq('prestador_serv_id', idPrestador)
    .maybeSingle();

  if (error) throw errorDeBase(error, QUE_FALTA);
  if (!data) throw noEncontrado(`No existe el prestador ${idPrestador}.`);

  return mapear(data);
}

export async function crear(datos) {
  const { fila, tipos } = validar(datos);
  await revisarTiposExisten(tipos);
  await revisarCuilRepetido(fila.prestador_serv_cuil);

  const { data, error } = await supabase
    .from('prestador_servicio')
    .insert(fila)
    .select('prestador_serv_id')
    .single();

  if (error?.code === DUPLICADO) {
    throw conflicto(`El CUIL ${fila.prestador_serv_cuil} ya está cargado en otro prestador.`);
  }
  if (error) throw errorDeBase(error, QUE_FALTA);

  try {
    await asignarTipos(data.prestador_serv_id, tipos);
  } catch (fallo) {
    // Sin tipos el prestador quedaria a medias: se deshace el alta.
    await supabase.from('prestador_servicio').delete().eq('prestador_serv_id', data.prestador_serv_id);
    throw fallo;
  }

  return obtenerPorId(data.prestador_serv_id);
}

export async function actualizar(idPrestador, datos) {
  const { fila, tipos } = validar(datos);
  await obtenerPorId(idPrestador);
  await revisarTiposExisten(tipos);
  await revisarCuilRepetido(fila.prestador_serv_cuil, idPrestador);

  const { error } = await supabase
    .from('prestador_servicio')
    .update(fila)
    .eq('prestador_serv_id', idPrestador);

  if (error?.code === DUPLICADO) {
    throw conflicto(`El CUIL ${fila.prestador_serv_cuil} ya está cargado en otro prestador.`);
  }
  if (error) throw errorDeBase(error, QUE_FALTA);

  await asignarTipos(idPrestador, tipos);

  return obtenerPorId(idPrestador);
}

export async function eliminar(idPrestador) {
  const prestador = await obtenerPorId(idPrestador);

  // Criterio de la HU-25: un prestador con tareas asignadas no se borra, para
  // no perder el historial de quien hizo cada trabajo.
  const { count, error: errorUso } = await supabase
    .from('tarea_ot')
    .select('tarea_id', { count: 'exact', head: true })
    .eq('prestador_serv_id', idPrestador);

  if (errorUso) throw errorDeBase(errorUso, QUE_FALTA);
  if (count > 0) {
    throw conflicto(
      `No se puede eliminar "${prestador.nombre}" porque tiene ${count === 1 ? 'una tarea asignada' : `${count} tareas asignadas`}.`
    );
  }

  // Sus tipos se van solos (ON DELETE CASCADE en prestador_tipo_prestador).
  const { error } = await supabase.from('prestador_servicio').delete().eq('prestador_serv_id', idPrestador);
  if (error) throw errorDeBase(error, QUE_FALTA);

  return prestador;
}
