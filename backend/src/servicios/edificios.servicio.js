import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('edificio').select('*').order('edificionom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(edificio => ({
    idEdificio: edificio.edificioid,
    nombre: edificio.edificionom,
    direccion: edificio.edificiodir
  }));
}

export async function obtenerPorId(idEdificio) {
  const { data, error } = await supabase.from('edificio').select('*').eq('edificioid', idEdificio).single();
  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);
  
  return {
    idEdificio: data.edificioid,
    nombre: data.edificionom,
    direccion: data.edificiodir
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const direccion = limpiar(datos.direccion);

  if (!nombreLimpio) throw datoInvalido('El nombre del edificio es obligatorio.');

  const { data: existente } = await supabase.from('edificio').select('edificioid').ilike('edificionom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un edificio con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('edificio').select('edificioid').order('edificioid', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].edificioid + 1 : 1;

  const { data, error } = await supabase.from('edificio').insert({
    edificioid: nextId,
    edificionom: nombreLimpio,
    edificiodir: direccion
  }).select().single();

  if (error) throw new Error(error.message);

  return {
    idEdificio: data.edificioid,
    nombre: data.edificionom,
    direccion: data.edificiodir
  };
}

export async function actualizar(idEdificio, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const direccion = limpiar(datos.direccion);

  if (!nombreLimpio) throw datoInvalido('El nombre del edificio es obligatorio.');

  const { data: existente } = await supabase.from('edificio').select('edificioid').ilike('edificionom', nombreLimpio).neq('edificioid', idEdificio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un edificio con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('edificio').update({
    edificionom: nombreLimpio,
    edificiodir: direccion
  }).eq('edificioid', idEdificio).select().single();

  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);

  return {
    idEdificio: data.edificioid,
    nombre: data.edificionom,
    direccion: data.edificiodir
  };
}

export async function eliminar(idEdificio) {
  const { data: espacios, error: errorEspacios } = await supabase.from('espacio').select('espacionum').eq('edificioid', idEdificio);
  
  if (espacios && espacios.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${espacios.length} espacio(s) cargado(s). Elimina primero los espacios.`);
  }

  const { data, error } = await supabase.from('edificio').delete().eq('edificioid', idEdificio).select().single();
  if (error || !data) throw noEncontrado(`No existe el edificio ${idEdificio}.`);

  return {
    idEdificio: data.edificioid,
    nombre: data.edificionom,
    direccion: data.edificiodir
  };
}
