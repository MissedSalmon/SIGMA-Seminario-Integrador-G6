import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('tipoespacio').select('*').order('tipoespacionom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(tipo => ({
    idTipoEspacio: tipo.tipoespacioid,
    nombre: tipo.tipoespacionom
  }));
}

export async function obtenerPorId(idTipoEspacio) {
  const { data, error } = await supabase.from('tipoespacio').select('*').eq('tipoespacioid', idTipoEspacio).single();
  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);
  
  return {
    idTipoEspacio: data.tipoespacioid,
    nombre: data.tipoespacionom
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de espacio es obligatorio.');

  const { data: existente } = await supabase.from('tipoespacio').select('tipoespacioid').ilike('tipoespacionom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de espacio con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('tipoespacio').select('tipoespacioid').order('tipoespacioid', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].tipoespacioid + 1 : 1;

  const record = {
    tipoespacioid: nextId,
    tipoespacionom: nombreLimpio
  };

  const { data, error } = await supabase.from('tipoespacio').insert(record).select().single();

  if (error) throw new Error(error.message);

  return {
    idTipoEspacio: data.tipoespacioid,
    nombre: data.tipoespacionom
  };
}

export async function actualizar(idTipoEspacio, datos) {
  const nombreLimpio = limpiar(datos.nombre);

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de espacio es obligatorio.');

  const { data: existente } = await supabase.from('tipoespacio').select('tipoespacioid').ilike('tipoespacionom', nombreLimpio).neq('tipoespacioid', idTipoEspacio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de espacio con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('tipoespacio').update({
    tipoespacionom: nombreLimpio
  }).eq('tipoespacioid', idTipoEspacio).select().single();

  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);

  return {
    idTipoEspacio: data.tipoespacioid,
    nombre: data.tipoespacionom
  };
}

export async function eliminar(idTipoEspacio) {
  const { data: espacios, error: errorEspacios } = await supabase.from('espacio').select('espacionum').eq('tipoespacioid', idTipoEspacio);
  
  if (espacios && espacios.length > 0) {
    throw conflicto(`No se puede eliminar porque hay espacios asignados a este tipo.`);
  }

  const { data, error } = await supabase.from('tipoespacio').delete().eq('tipoespacioid', idTipoEspacio).select().single();
  if (error || !data) throw noEncontrado(`No existe el tipo de espacio ${idTipoEspacio}.`);

  return {
    idTipoEspacio: data.tipoespacioid,
    nombre: data.tipoespacionom
  };
}
