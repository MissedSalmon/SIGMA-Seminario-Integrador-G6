import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('tipo_activo').select(`
    *,
    activo (count)
  `).order('tipo_activo_nom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(tipo => ({
    idTipoActivo: tipo.tipo_activo_id,
    nombre: tipo.tipo_activo_nom,

    cantidadActivos: tipo.activo ? tipo.activo[0].count : 0
  }));
}

export async function obtenerPorId(idTipoActivo) {
  const { data, error } = await supabase.from('tipo_activo').select('*').eq('tipo_activo_id', idTipoActivo).single();
  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);
  
  return {
    idTipoActivo: data.tipo_activo_id,
    nombre: data.tipo_activo_nom,

  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de activo es obligatorio.');

  const { data: existente } = await supabase.from('tipo_activo').select('tipo_activo_id').ilike('tipo_activo_nom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de activo con el nombre "${nombreLimpio}".`);


  // Insert description only if the DB has the column, but we will pass it anyway
  // Note: If the column is not in the DB, Supabase might ignore it or throw.
  // We'll only insert it if we are sure it's updated. Let's try inserting it.
  const record = {
    tipo_activo_nom: nombreLimpio
  };
  // We will assume the migration has been run.


  const { data, error } = await supabase.from('tipo_activo').insert(record).select().single();

  if (error) throw new Error(error.message);

  return {
    idTipoActivo: data.tipo_activo_id,
    nombre: data.tipo_activo_nom,

  };
}

export async function actualizar(idTipoActivo, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de activo es obligatorio.');

  const { data: existente } = await supabase.from('tipo_activo').select('tipo_activo_id').ilike('tipo_activo_nom', nombreLimpio).neq('tipo_activo_id', idTipoActivo).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de activo con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('tipo_activo').update({
    tipo_activo_nom: nombreLimpio,

  }).eq('tipo_activo_id', idTipoActivo).select().single();

  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);

  return {
    idTipoActivo: data.tipo_activo_id,
    nombre: data.tipo_activo_nom,

  };
}

export async function eliminar(idTipoActivo) {
  const { data: activos, error: errorActivos } = await supabase.from('activo').select('activo_codigo').eq('tipo_activo_id', idTipoActivo);
  
  if (activos && activos.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${activos.length} activo(s) clasificado(s) en el. Elimina primero los activos.`);
  }

  // Verificamos si tiene planes de mantenimiento preventivo
  const { data: mantenimientos, error: errorMantenimientos } = await supabase.from('mantenimiento_preventivo').select('mant_prev_id').eq('tipo_activo_id', idTipoActivo);

  if (mantenimientos && mantenimientos.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${mantenimientos.length} plan(es) de mantenimiento preventivo asociado(s).`);
  }

  const { data, error } = await supabase.from('tipo_activo').delete().eq('tipo_activo_id', idTipoActivo).select().single();
  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);

  return {
    idTipoActivo: data.tipo_activo_id,
    nombre: data.tipo_activo_nom,

  };
}
