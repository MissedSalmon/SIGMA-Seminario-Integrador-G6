/**
 * Servicio de especialidades.
 *
 * HU-4 (el ABM completo de especialidades) todavia no esta implementada en el
 * proyecto: la tabla especialidad existe en la base (con datos de semilla,
 * ver supabase/migrations/20260829210000_tecnico_datos_personales.sql) pero
 * no hay ninguna pantalla para darlas de alta todavia. Este servicio solo
 * expone lo que Tecnicos (HU-5) necesita para su selector: listarlas.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos() {
  // Traemos las especialidades con la relacion tecnico_especialidad para
  // poder informar la cantidad de tecnicos por especialidad.
  const { data, error } = await supabase
    .from('especialidad')
    .select('especialidad_id, especialidad_nom, tecnico_especialidad ( tecnico_legajo )')
    .order('especialidad_nom', { ascending: true });

  if (error) throw new Error(error.message);

  return data.map((especialidad) => ({
    idEspecialidad: especialidad.especialidad_id,
    nombre: especialidad.especialidad_nom,
    cantidadTecnicos: (especialidad.tecnico_especialidad ?? []).length,
  }));
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('especialidad')
    .select('especialidad_id, especialidad_nom')
    .eq('especialidad_id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado('No existe la especialidad solicitada.');

  return { idEspecialidad: data.especialidad_id, nombre: data.especialidad_nom };
}

export async function crear(nombreRaw) {
  const nombre = limpiar(nombreRaw);
  if (!nombre) throw datoInvalido('El nombre de la especialidad es obligatorio.');

  // Evitar duplicados (case-insensitive)
  const { data: existe, error: errExiste } = await supabase
    .from('especialidad')
    .select('especialidad_id')
    .ilike('especialidad_nom', nombre)
    .maybeSingle();
  if (errExiste) throw new Error(errExiste.message);
  if (existe) throw conflicto('Ya existe una especialidad con ese nombre.');

  const { data, error } = await supabase.from('especialidad').insert({ especialidad_nom: nombre }).select().single();
  if (error) throw new Error(error.message);

  return { idEspecialidad: data.especialidad_id, nombre: data.especialidad_nom };
}

export async function actualizar(id, nombreRaw) {
  const nombre = limpiar(nombreRaw);
  if (!nombre) throw datoInvalido('El nombre de la especialidad es obligatorio.');

  // Verificar conflicto de nombre con otra fila
  const { data: existe, error: errExiste } = await supabase
    .from('especialidad')
    .select('especialidad_id')
    .ilike('especialidad_nom', nombre)
    .neq('especialidad_id', id)
    .maybeSingle();
  if (errExiste) throw new Error(errExiste.message);
  if (existe) throw conflicto('Ya existe otra especialidad con ese nombre.');

  const { data, error } = await supabase
    .from('especialidad')
    .update({ especialidad_nom: nombre })
    .eq('especialidad_id', id)
    .select()
    .single();

  if (error || !data) throw noEncontrado('No existe la especialidad solicitada.');

  return { idEspecialidad: data.especialidad_id, nombre: data.especialidad_nom };
}

export async function eliminar(id) {
  // No se puede borrar si tiene tecnicos asignados
  const { count, error: errAsign } = await supabase
    .from('tecnico_especialidad')
    .select('*', { count: 'exact', head: true })
    .eq('especialidad_id', id);
  if (errAsign) throw new Error(errAsign.message);
  if (count > 0) {
    throw conflicto(`No se puede eliminar la especialidad porque tiene ${count} técnico${count !== 1 ? 's' : ''} asignado${count !== 1 ? 's' : ''}.`);
  }

  const { data, error } = await supabase.from('especialidad').delete().eq('especialidad_id', id).select().single();
  if (error || !data) throw noEncontrado('No existe la especialidad solicitada.');

  return { idEspecialidad: data.especialidad_id, nombre: data.especialidad_nom };
}
