import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('area').select(`
    areaid,
    areanom,
    autorizadolegajo,
    espacio (
      espacionum,
      edificio (
        edificionom
      )
    )
  `).order('areanom', { ascending: true });
  
  if (error) throw new Error(error.message);
  
  return data.map(area => ({
    idArea: area.areaid,
    nombre: area.areanom,
    // Como ahora un area puede estar en muchos espacios, agarramos el primero (o nulo)
    // para mantener la compatibilidad temporal con el frontend viejo.
    idEspacio: (area.espacio && area.espacio.length > 0) ? area.espacio[0].espacionum : null,
    nombreEspacio: (area.espacio && area.espacio.length > 0) ? area.espacio[0].espacionum : '(espacio eliminado)',
    nombreEdificio: (area.espacio && area.espacio.length > 0 && area.espacio[0].edificio) ? area.espacio[0].edificio.edificionom : ''
  }));
}

export async function obtenerPorId(idArea) {
  const { data, error } = await supabase.from('area').select('*').eq('areaid', idArea).single();
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);
  
  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  
  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');

  const { data: existente } = await supabase.from('area').select('areaid').ilike('areanom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('area').select('areaid').order('areaid', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].areaid + 1 : 1;

  const { data, error } = await supabase.from('area').insert({
    areaid: nextId,
    areanom: nombreLimpio,
    autorizadolegajo: null // Se asignara luego segun requerimientos
  }).select().single();

  if (error) throw new Error(error.message);

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}

export async function actualizar(idArea, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');

  const { data: existente } = await supabase.from('area').select('areaid').ilike('areanom', nombreLimpio).neq('areaid', idArea).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('area').update({
    areanom: nombreLimpio
  }).eq('areaid', idArea).select().single();

  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}

export async function eliminar(idArea) {
  const { data, error } = await supabase.from('area').delete().eq('areaid', idArea).select().single();
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}
