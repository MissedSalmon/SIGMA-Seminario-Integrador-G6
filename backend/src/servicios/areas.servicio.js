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
      edificioid,
      edificio (
        edificionom
      )
    )
  `).order('areanom', { ascending: true });
  
  if (error) throw new Error(error.message);
  
  return data.map(area => ({
    idArea: area.areaid,
    nombre: area.areanom,
    idEspacio: (area.espacio && area.espacio.length > 0) ? `${area.espacio[0].edificioid}-${area.espacio[0].espacionum}` : null,
    nombreEspacio: (area.espacio && area.espacio.length > 0) ? area.espacio[0].espacionum : '(espacio eliminado)',
    nombreEdificio: (area.espacio && area.espacio.length > 0 && area.espacio[0].edificio) ? area.espacio[0].edificio.edificionom : ''
  }));
}

export async function obtenerPorId(idArea) {
  const { data, error } = await supabase.from('area').select(`
    areaid,
    areanom,
    espacio (
      espacionum,
      edificioid
    )
  `).eq('areaid', idArea).single();
  
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);
  
  return {
    idArea: data.areaid,
    nombre: data.areanom,
    idEspacio: (data.espacio && data.espacio.length > 0) ? `${data.espacio[0].edificioid}-${data.espacio[0].espacionum}` : null
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const idEspacio = limpiar(datos.idEspacio);
  
  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');
  if (!idEspacio) throw datoInvalido('El espacio es obligatorio.');

  const [idEdificio, espacioNum] = idEspacio.split('-');

  const { data: existente } = await supabase.from('area').select('areaid').ilike('areanom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('area').select('areaid').order('areaid', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].areaid + 1 : 1;

  const { data, error } = await supabase.from('area').insert({
    areaid: nextId,
    areanom: nombreLimpio,
    autorizadolegajo: null
  }).select().single();

  if (error) throw new Error(error.message);

  // Vincular el espacio
  if (idEdificio && espacioNum) {
    await supabase.from('espacio').update({ areaid: nextId }).eq('edificioid', idEdificio).eq('espacionum', espacioNum);
  }

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}

export async function actualizar(idArea, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const idEspacio = limpiar(datos.idEspacio);

  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');
  if (!idEspacio) throw datoInvalido('El espacio es obligatorio.');

  const [idEdificio, espacioNum] = idEspacio.split('-');

  const { data: existente } = await supabase.from('area').select('areaid').ilike('areanom', nombreLimpio).neq('areaid', idArea).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('area').update({
    areanom: nombreLimpio
  }).eq('areaid', idArea).select().single();

  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  // Limpiar espacios previos de esta area (asumiendo relacion 1 a N del lado del espacio, UI 1 a 1)
  await supabase.from('espacio').update({ areaid: null }).eq('areaid', idArea);
  // Vincular el nuevo espacio
  if (idEdificio && espacioNum) {
    await supabase.from('espacio').update({ areaid: idArea }).eq('edificioid', idEdificio).eq('espacionum', espacioNum);
  }

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}

export async function eliminar(idArea) {
  // Desvincular espacios primero
  await supabase.from('espacio').update({ areaid: null }).eq('areaid', idArea);

  const { data, error } = await supabase.from('area').delete().eq('areaid', idArea).select().single();
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  return {
    idArea: data.areaid,
    nombre: data.areanom
  };
}
