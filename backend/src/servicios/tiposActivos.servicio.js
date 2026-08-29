import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  const { data, error } = await supabase.from('tipoactivo').select(`
    *,
    activo (count)
  `).order('tipoactivonom', { ascending: true });
  if (error) throw new Error(error.message);
  
  return data.map(tipo => ({
    idTipoActivo: tipo.tipoactivoid,
    nombre: tipo.tipoactivonom,
    descripcion: tipo.tipoactivodesc || '', // Use desc if exists
    cantidadActivos: tipo.activo ? tipo.activo[0].count : 0
  }));
}

export async function obtenerPorId(idTipoActivo) {
  const { data, error } = await supabase.from('tipoactivo').select('*').eq('tipoactivoid', idTipoActivo).single();
  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);
  
  return {
    idTipoActivo: data.tipoactivoid,
    nombre: data.tipoactivonom,
    descripcion: data.tipoactivodesc || ''
  };
}

export async function crear(datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const descripcionLimpia = limpiar(datos.descripcion) || '';

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de activo es obligatorio.');

  const { data: existente } = await supabase.from('tipoactivo').select('tipoactivoid').ilike('tipoactivonom', nombreLimpio).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de activo con el nombre "${nombreLimpio}".`);

  const { data: lastIdData } = await supabase.from('tipoactivo').select('tipoactivoid').order('tipoactivoid', { ascending: false }).limit(1);
  const nextId = lastIdData && lastIdData.length > 0 ? lastIdData[0].tipoactivoid + 1 : 1;

  // Insert description only if the DB has the column, but we will pass it anyway
  // Note: If the column is not in the DB, Supabase might ignore it or throw.
  // We'll only insert it if we are sure it's updated. Let's try inserting it.
  const record = {
    tipoactivoid: nextId,
    tipoactivonom: nombreLimpio
  };
  // We will assume the migration has been run.
  record.tipoactivodesc = descripcionLimpia;

  const { data, error } = await supabase.from('tipoactivo').insert(record).select().single();

  if (error) throw new Error(error.message);

  return {
    idTipoActivo: data.tipoactivoid,
    nombre: data.tipoactivonom,
    descripcion: data.tipoactivodesc || ''
  };
}

export async function actualizar(idTipoActivo, datos) {
  const nombreLimpio = limpiar(datos.nombre);
  const descripcionLimpia = limpiar(datos.descripcion) || '';

  if (!nombreLimpio) throw datoInvalido('El nombre del tipo de activo es obligatorio.');

  const { data: existente } = await supabase.from('tipoactivo').select('tipoactivoid').ilike('tipoactivonom', nombreLimpio).neq('tipoactivoid', idTipoActivo).maybeSingle();
  if (existente) throw conflicto(`Ya existe un tipo de activo con el nombre "${nombreLimpio}".`);

  const { data, error } = await supabase.from('tipoactivo').update({
    tipoactivonom: nombreLimpio,
    tipoactivodesc: descripcionLimpia
  }).eq('tipoactivoid', idTipoActivo).select().single();

  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);

  return {
    idTipoActivo: data.tipoactivoid,
    nombre: data.tipoactivonom,
    descripcion: data.tipoactivodesc || ''
  };
}

export async function eliminar(idTipoActivo) {
  const { data: activos, error: errorActivos } = await supabase.from('activo').select('activocodigo').eq('tipoactivoid', idTipoActivo);
  
  if (activos && activos.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${activos.length} activo(s) clasificado(s) en el. Elimina primero los activos.`);
  }

  // Verificamos si tiene planes de mantenimiento preventivo
  const { data: mantenimientos, error: errorMantenimientos } = await supabase.from('mantenimientopreventivo').select('mantprevid').eq('tipoactivoid', idTipoActivo);

  if (mantenimientos && mantenimientos.length > 0) {
    throw conflicto(`No se puede eliminar porque tiene ${mantenimientos.length} plan(es) de mantenimiento preventivo asociado(s).`);
  }

  const { data, error } = await supabase.from('tipoactivo').delete().eq('tipoactivoid', idTipoActivo).select().single();
  if (error || !data) throw noEncontrado(`No existe el tipo de activo ${idTipoActivo}.`);

  return {
    idTipoActivo: data.tipoactivoid,
    nombre: data.tipoactivonom,
    descripcion: data.tipoactivodesc || ''
  };
}
