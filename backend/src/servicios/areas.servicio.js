import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('area').select(`
    area_id,
    area_nom,
    autorizado_legajo,
    espacio_id,
    espacio (
      espacio_num,
      edificio_id,
      edificio (
        edificio_nom
      )
    )
  `).order('area_nom', { ascending: true });
  
  if (error) throw new Error(error.message);
  
  return data.map(area => ({
    idArea: area.area_id,
    nombre: area.area_nom,
    idEspacio: area.espacio_id,
    nombreEspacio: area.espacio ? area.espacio.espacio_num : '(espacio eliminado)',
    nombreEdificio: (area.espacio && area.espacio.edificio) ? area.espacio.edificio.edificio_nom : ''
  }));
}

export async function obtenerPorId(idArea) {
  const { data, error } = await supabase.from('area').select(`
    area_id,
    area_nom,
    espacio_id
  `).eq('area_id', idArea).single();
  
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);
  
  return {
    idArea: data.area_id,
    nombre: data.area_nom,
    idEspacio: data.espacio_id
  };
}

async function obtenerEdificioDeEspacio(espacio_id) {
  const { data } = await supabase.from('espacio').select('edificio_id').eq('espacio_id', espacio_id).maybeSingle();
  if (!data) throw datoInvalido(`No existe el espacio ${espacio_id}.`);
  return data.edificio_id;
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const idEspacio = Number(datos.idEspacio);
  
  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');
  if (!idEspacio || isNaN(idEspacio)) throw datoInvalido('El espacio es obligatorio.');

  const { data: existente } = await supabase.from('area').select('area_id').ilike('area_nom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const idEdificio = await obtenerEdificioDeEspacio(idEspacio);

  const { data, error } = await supabase.from('area').insert({
    area_nom: nombreLimpio,
    autorizado_legajo: null,
    espacio_id: idEspacio,
    edificio_id: idEdificio
  }).select().single();

  if (error) throw new Error(error.message);

  return {
    idArea: data.area_id,
    nombre: data.area_nom
  };
}

export async function actualizar(idArea, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const idEspacio = Number(datos.idEspacio);

  if (!nombreLimpio) throw datoInvalido('El nombre del area es obligatorio.');
  if (!idEspacio || isNaN(idEspacio)) throw datoInvalido('El espacio es obligatorio.');

  const { data: existente } = await supabase.from('area').select('area_id').ilike('area_nom', nombreLimpio).neq('area_id', idArea).maybeSingle();
  if (existente) throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);

  const idEdificio = await obtenerEdificioDeEspacio(idEspacio);

  const { data, error } = await supabase.from('area').update({
    area_nom: nombreLimpio,
    espacio_id: idEspacio,
    edificio_id: idEdificio
  }).eq('area_id', idArea).select().single();

  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  return {
    idArea: data.area_id,
    nombre: data.area_nom
  };
}

export async function eliminar(idArea) {
  const { data, error } = await supabase.from('area').delete().eq('area_id', idArea).select().single();
  if (error || !data) throw noEncontrado(`No existe el area ${idArea}.`);

  return {
    idArea: data.area_id,
    nombre: data.area_nom
  };
}
