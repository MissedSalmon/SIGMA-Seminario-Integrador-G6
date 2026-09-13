import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('tipo_espacio').select('*').order('tipo_espacio_nom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(tipo => ({
    idTipoEspacio: tipo.tipo_espacio_id,
    nombre: tipo.tipo_espacio_nom
  }));
}

export async function obtenerPorId(idTipoEspacio) {
  const { data, error } = await supabase.from('tipo_espacio').select('*').eq('tipo_espacio_id', idTipoEspacio).single();
  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);
  
  return {
    idTipoEspacio: data.tipo_espacio_id,
    nombre: data.tipo_espacio_nom
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de espacio es obligatorio.');

  const { data: existente } = await supabase.from('tipo_espacio').select('tipo_espacio_id').ilike('tipo_espacio_nom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de espacio con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('tipo_espacio').select('tipo_espacio_id').order('tipo_espacio_id', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].tipo_espacio_id + 1 : 1;

  const record = {
    tipo_espacio_id: nextId,
    tipo_espacio_nom: nombreLimpio
  };

  const { data, error } = await supabase.from('tipo_espacio').insert(record).select().single();

  if (error) throw new Error(error.message);

  return {
    idTipoEspacio: data.tipo_espacio_id,
    nombre: data.tipo_espacio_nom
  };
}

export async function actualizar(idTipoEspacio, datos) {
  const nombreLimpio = limpiar(datos.nombre);

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de espacio es obligatorio.');

  const { data: existente } = await supabase.from('tipo_espacio').select('tipo_espacio_id').ilike('tipo_espacio_nom', nombreLimpio).neq('tipo_espacio_id', idTipoEspacio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de espacio con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('tipo_espacio').update({
    tipo_espacio_nom: nombreLimpio
  }).eq('tipo_espacio_id', idTipoEspacio).select().single();

  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);

  return {
    idTipoEspacio: data.tipo_espacio_id,
    nombre: data.tipo_espacio_nom
  };
}

export async function eliminar(idTipoEspacio) {
  const { data: espacios, error: errorEspacios } = await supabase.from('espacio').select('espacio_num').eq('tipo_espacio_id', idTipoEspacio);
  
  if (espacios && espacios.length > 0) {
    throw conflicto(`No se puede eliminar porque hay espacios asignados a este tipo.`);
  }

  const { data, error } = await supabase.from('tipo_espacio').delete().eq('tipo_espacio_id', idTipoEspacio).select().single();
  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);

  return {
    idTipoEspacio: data.tipo_espacio_id,
    nombre: data.tipo_espacio_nom
  };
}
