/**
 * Áreas (HU-3). Un área tiene muchos espacios, incluso en varios edificios, y
 * cada espacio es de un área como máximo (21/11/2026). La relación la guarda
 * el espacio (espacio.area_id), pero se elige desde el formulario del área.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

const COLUMNAS = `
  area_id,
  area_nom,
  espacio (
    espacio_id,
    espacio_num,
    tipo_espacio ( tipo_espacio_nom ),
    edificio ( edificio_nom )
  )
`;

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** "Aula 11", o "Espacio 11" si el espacio no tiene tipo. */
function nombreDelEspacio(espacio) {
  return espacio.tipo_espacio
    ? `${espacio.tipo_espacio.tipo_espacio_nom} ${espacio.espacio_num}`
    : `Espacio ${espacio.espacio_num}`;
}

function aArea(fila) {
  const espacios = (fila.espacio ?? [])
    .map((espacio) => ({
      idEspacio: espacio.espacio_id,
      nombre: nombreDelEspacio(espacio),
      nombreEdificio: espacio.edificio?.edificio_nom ?? '',
    }))
    .sort((a, b) => a.nombreEdificio.localeCompare(b.nombreEdificio, 'es') || a.nombre.localeCompare(b.nombre, 'es'));

  return {
    idArea: fila.area_id,
    nombre: fila.area_nom,
    espacios,
    idsEspacios: espacios.map((espacio) => espacio.idEspacio),
    nombreEdificio: [...new Set(espacios.map((espacio) => espacio.nombreEdificio).filter(Boolean))].join(' / '),
  };
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('area').select(COLUMNAS).order('area_nom', { ascending: true });
  if (error) throw new Error(error.message);
  return data.map(aArea);
}

export async function obtenerPorId(idArea) {
  const { data, error } = await supabase.from('area').select(COLUMNAS).eq('area_id', idArea).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el área ${idArea}.`);
  return aArea(data);
}

/** Los espacios elegidos, sin repetir. Puede no haber ninguno: el área se arma y después se le suman. */
function leerEspacios(datos) {
  const lista = Array.isArray(datos.idsEspacios) ? datos.idsEspacios : [];
  const ids = [...new Set(lista.map(Number))];
  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw datoInvalido('Alguno de los espacios elegidos no es válido.');
  }
  return ids;
}

/** Que existan y que no sean de otra área. */
async function validarEspacios(ids, idArea = null) {
  if (ids.length === 0) return;

  const { data, error } = await supabase
    .from('espacio')
    .select('espacio_id, espacio_num, area_id, tipo_espacio ( tipo_espacio_nom ), area ( area_nom )')
    .in('espacio_id', ids);
  if (error) throw new Error(error.message);

  const encontrados = new Set((data ?? []).map((espacio) => espacio.espacio_id));
  const faltante = ids.find((id) => !encontrados.has(id));
  if (faltante) throw datoInvalido(`No existe el espacio ${faltante}.`);

  const deOtra = (data ?? []).find((espacio) => espacio.area_id && espacio.area_id !== idArea);
  if (deOtra) {
    throw conflicto(
      `El espacio "${nombreDelEspacio(deOtra)}" ya es del área "${deOtra.area?.area_nom ?? deOtra.area_id}". Sacalo de esa área primero.`
    );
  }
}

async function validarNombreLibre(nombre, idArea = null) {
  let consulta = supabase.from('area').select('area_id').ilike('area_nom', nombre);
  if (idArea) consulta = consulta.neq('area_id', idArea);
  const { data: existente } = await consulta.maybeSingle();
  if (existente) throw conflicto(`Ya existe un área con el nombre "${nombre}".`);
}

/** Deja al área con exactamente esos espacios: suelta los que ya no eligió y se queda con los nuevos. */
async function asignarEspacios(idArea, ids) {
  let soltar = supabase.from('espacio').update({ area_id: null }).eq('area_id', idArea);
  if (ids.length > 0) soltar = soltar.not('espacio_id', 'in', `(${ids.join(',')})`);
  const { error: errorSoltar } = await soltar;
  if (errorSoltar) throw new Error(errorSoltar.message);

  if (ids.length === 0) return;
  const { error } = await supabase.from('espacio').update({ area_id: idArea }).in('espacio_id', ids);
  if (error) throw new Error(error.message);
}

export async function crear(datos) {
  const nombre = limpiar(datos.nombre);
  if (!nombre) throw datoInvalido('El nombre del área es obligatorio.');
  const ids = leerEspacios(datos);

  await validarNombreLibre(nombre);
  await validarEspacios(ids);

  const { data, error } = await supabase
    .from('area')
    .insert({ area_nom: nombre, autorizado_legajo: null })
    .select('area_id')
    .single();
  if (error) throw new Error(error.message);

  await asignarEspacios(data.area_id, ids);
  return obtenerPorId(data.area_id);
}

export async function actualizar(idArea, datos) {
  const nombre = limpiar(datos.nombre);
  if (!nombre) throw datoInvalido('El nombre del área es obligatorio.');
  const ids = leerEspacios(datos);

  await validarNombreLibre(nombre, idArea);
  await validarEspacios(ids, idArea);

  const { data, error } = await supabase
    .from('area')
    .update({ area_nom: nombre })
    .eq('area_id', idArea)
    .select('area_id')
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el área ${idArea}.`);

  await asignarEspacios(idArea, ids);
  return obtenerPorId(idArea);
}

/** Sus espacios quedan sin área (ON DELETE SET NULL en espacio.area_id). */
export async function eliminar(idArea) {
  const { data, error } = await supabase.from('area').delete().eq('area_id', idArea).select().single();
  if (error || !data) throw noEncontrado(`No existe el área ${idArea}.`);

  return {
    idArea: data.area_id,
    nombre: data.area_nom,
  };
}
