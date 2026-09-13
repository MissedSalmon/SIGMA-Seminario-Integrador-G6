import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('edificio').select('*').order('edificio_nom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(edificio => ({
    idEdificio: edificio.edificio_id,
    nombre: edificio.edificio_nom,
    direccion: edificio.edificio_dir
  }));
}

export async function obtenerPorId(idEdificio) {
  const { data, error } = await supabase.from('edificio').select('*').eq('edificio_id', idEdificio).single();
  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);
  
  return {
    idEdificio: data.edificio_id,
    nombre: data.edificio_nom,
    direccion: data.edificio_dir
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const direccion = limpiar(datos.direccion);

  if (!nombreLimpio) throw datoInvalido('El nombre del edificio es obligatorio.');

  const { data: existente } = await supabase.from('edificio').select('edificio_id').ilike('edificio_nom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un edificio con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('edificio').select('edificio_id').order('edificio_id', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].edificio_id + 1 : 1;

  const { data, error } = await supabase.from('edificio').insert({
    edificio_id: nextId,
    edificio_nom: nombreLimpio,
    edificio_dir: direccion
  }).select().single();

  if (error) throw new Error(error.message);

  return {
    idEdificio: data.edificio_id,
    nombre: data.edificio_nom,
    direccion: data.edificio_dir
  };
}

export async function actualizar(idEdificio, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const direccion = limpiar(datos.direccion);

  if (!nombreLimpio) throw datoInvalido('El nombre del edificio es obligatorio.');

  const { data: existente } = await supabase.from('edificio').select('edificio_id').ilike('edificio_nom', nombreLimpio).neq('edificio_id', idEdificio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un edificio con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('edificio').update({
    edificio_nom: nombreLimpio,
    edificio_dir: direccion
  }).eq('edificio_id', idEdificio).select().single();

  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);

  return {
    idEdificio: data.edificio_id,
    nombre: data.edificio_nom,
    direccion: data.edificio_dir
  };
}

export async function eliminar(idEdificio) {
  const { data: espacios, error: errorEspacios } = await supabase.from('espacio').select('espacio_num').eq('edificio_id', idEdificio);
  
  if (espacios && espacios.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${espacios.length} espacio(s) cargado(s). Elimina primero los espacios.`);
  }

  const { data, error } = await supabase.from('edificio').delete().eq('edificio_id', idEdificio).select().single();
  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);

  return {
    idEdificio: data.edificio_id,
    nombre: data.edificio_nom,
    direccion: data.edificio_dir
  };
}
