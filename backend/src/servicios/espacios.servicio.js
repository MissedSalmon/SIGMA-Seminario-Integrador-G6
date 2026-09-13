import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos(edificio_id = null) {
  let query = supabase.from('espacio').select(`
    espacio_id,
    edificio_id,
    espacio_num,
    tipo_espacio_id,
    espacio_piso,
    espacio_dim,
    espacio_nom,
    edificio (
      edificio_nom
    ),
    tipo_espacio (
      tipo_espacio_nom
    )
  `);
  
  if (edificio_id) {
    query = query.eq('edificio_id', edificio_id);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.map(espacio => ({
    idEspacio: espacio.espacio_id,
    idEdificio: espacio.edificio_id,
    espacio_num: espacio.espacio_num,
    espacio_piso: espacio.espacio_piso,
    piso: espacio.espacio_piso, 
    numero: espacio.espacio_num,
    idTipoEspacio: espacio.tipo_espacio_id,
    tipo: espacio.tipo_espacio ? espacio.tipo_espacio.tipo_espacio_nom : '',
    nombre: espacio.espacio_nom || '',
    dimensiones: espacio.espacio_dim || '',
    nombreEdificio: espacio.edificio ? espacio.edificio.edificio_nom : '(edificio eliminado)'
  }));
}

export async function obtenerPorId(espacio_id) {
  const { data, error } = await supabase.from('espacio')
    .select('*, edificio(edificio_nom), tipo_espacio(tipo_espacio_nom)')
    .eq('espacio_id', espacio_id)
    .single();

  if (error || !data) throw noEncontrado(`No existe el espacio ${espacio_id}.`);

  return {
    idEspacio: data.espacio_id,
    idEdificio: data.edificio_id,
    espacio_num: data.espacio_num,
    espacio_piso: data.espacio_piso,
    piso: data.espacio_piso,
    numero: data.espacio_num,
    idTipoEspacio: data.tipo_espacio_id,
    tipo: data.tipo_espacio ? data.tipo_espacio.tipo_espacio_nom : '',
    nombre: data.espacio_nom || '',
    dimensiones: data.espacio_dim || '',
    nombreEdificio: data.edificio ? data.edificio.edificio_nom : ''
  };
}

export async function crear(datos) {
  const edificio = Number(datos.idEdificio);
  const numeroLimpio = limpiar(datos.numero) || limpiar(datos.espacio_num);
  const pisoLimpio = limpiar(datos.piso) || limpiar(datos.espacio_piso);
  const tipo_espacio_id = datos.idTipoEspacio ? Number(datos.idTipoEspacio) : null;
  const dimensionesLimpio = limpiar(datos.dimensiones);
  const nombreLimpio = limpiar(datos.nombre);

  if (!Number.isInteger(edificio)) throw datoInvalido('El edificio_id es obligatorio.');
  if (!numeroLimpio) throw datoInvalido('El numero de espacio es obligatorio.');
  if (!tipo_espacio_id) throw datoInvalido('El tipo de espacio es obligatorio.');

  const { data: existeEdificio } = await supabase.from('edificio').select('edificio_id').eq('edificio_id', edificio).maybeSingle();
  if (!existeEdificio) throw datoInvalido(`No existe el edificio ${edificio}.`);

  const { data: duplicado } = await supabase.from('espacio')
    .select('espacio_num')
    .eq('edificio_id', edificio)
    .eq('espacio_num', numeroLimpio)
    .maybeSingle();

  if (duplicado) throw conflicto(`El espacio ${numeroLimpio} ya existe en el edificio ${edificio}.`);

  const { data, error } = await supabase.from('espacio').insert({
    edificio_id: edificio,
    espacio_num: numeroLimpio,
    espacio_piso: pisoLimpio,
    tipo_espacio_id: tipo_espacio_id,
    espacio_dim: dimensionesLimpio ? parseFloat(dimensionesLimpio) : null,
    espacio_nom: nombreLimpio
  }).select().single();

  if (error) throw new Error(error.message);

  return data;
}

export async function actualizar(espacio_id, datos) {
  const pisoLimpio = limpiar(datos.piso) || limpiar(datos.espacio_piso);
  const tipo_espacio_id = datos.idTipoEspacio ? Number(datos.idTipoEspacio) : null;
  const dimensionesLimpio = limpiar(datos.dimensiones);
  const nombreLimpio = limpiar(datos.nombre);

  const { data, error } = await supabase.from('espacio').update({
    espacio_piso: pisoLimpio,
    tipo_espacio_id: tipo_espacio_id,
    espacio_dim: dimensionesLimpio ? parseFloat(dimensionesLimpio) : null,
    espacio_nom: nombreLimpio
  }).eq('espacio_id', espacio_id).select().single();

  if (error || !data) throw noEncontrado(`No existe el espacio.`);

  return data;
}

export async function eliminar(espacio_id) {
  const { data, error } = await supabase.from('espacio').delete()
    .eq('espacio_id', espacio_id)
    .select().single();
    
  if (error || !data) throw noEncontrado(`No existe el espacio.`);

  return data;
}

export async function obtenerTipos() {
  const { data, error } = await supabase.from('tipo_espacio').select('tipo_espacio_id, tipo_espacio_nom').order('tipo_espacio_nom');
  if (error) return [];
  return data.map(t => ({ idTipoEspacio: t.tipo_espacio_id, nombre: t.tipo_espacio_nom }));
}
