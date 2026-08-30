import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function obtenerTodos(idEdificio = null) {
  let query = supabase.from('espacio').select(`
    edificioid,
    espacionum,
    areaid,
    espaciopiso,
    espacionom,
    espaciotipo,
    espaciodim,
    edificio (
      edificionom
    )
  `);
  
  if (idEdificio) {
    query = query.eq('edificioid', idEdificio);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return data.map(espacio => ({
    idEdificio: espacio.edificioid,
    espacioNum: espacio.espacionum,
    areaId: espacio.areaid,
    espacioPiso: espacio.espaciopiso,
    nombre: espacio.espacionom || '',
    tipo: espacio.espaciotipo || '',
    dimensiones: espacio.espaciodim || '',
    nombreEdificio: espacio.edificio ? espacio.edificio.edificionom : '(edificio eliminado)'
  }));
}

export async function obtenerPorId(edificioId, espacioNum) {
  const { data, error } = await supabase.from('espacio')
    .select('*, edificio(edificionom)')
    .eq('edificioid', edificioId)
    .eq('espacionum', espacioNum)
    .single();

  if (error || !data) throw noEncontrado(`No existe el espacio ${espacioNum} en el edificio ${edificioId}.`);

  return {
    idEdificio: data.edificioid,
    espacioNum: data.espacionum,
    areaId: data.areaid,
    espacioPiso: data.espaciopiso,
    nombre: data.espacionom || '',
    tipo: data.espaciotipo || '',
    dimensiones: data.espaciodim || '',
    nombreEdificio: data.edificio ? data.edificio.edificionom : ''
  };
}

export async function crear(datos) {
  const edificio = Number(datos.idEdificio);
  const numeroLimpio = limpiar(datos.numero) || limpiar(datos.espacioNum);
  const pisoLimpio = limpiar(datos.piso) || limpiar(datos.espacioPiso);
  const area = datos.areaId ? Number(datos.areaId) : null;
  const nombreLimpio = limpiar(datos.nombre);
  const tipoLimpio = limpiar(datos.tipo);
  const dimensionesLimpio = limpiar(datos.dimensiones);

  if (!Number.isInteger(edificio)) throw datoInvalido('El edificioId es obligatorio.');
  if (!numeroLimpio) throw datoInvalido('El numero de espacio es obligatorio.');

  const { data: existeEdificio } = await supabase.from('edificio').select('edificioid').eq('edificioid', edificio).maybeSingle();
  if (!existeEdificio) throw datoInvalido(`No existe el edificio ${edificio}.`);

  const { data: duplicado } = await supabase.from('espacio')
    .select('espacionum')
    .eq('edificioid', edificio)
    .eq('espacionum', numeroLimpio)
    .maybeSingle();

  if (duplicado) throw conflicto(`El espacio ${numeroLimpio} ya existe en el edificio ${edificio}.`);

  const { data, error } = await supabase.from('espacio').insert({
    edificioid: edificio,
    espacionum: numeroLimpio,
    espaciopiso: pisoLimpio,
    areaid: area,
    espacionom: nombreLimpio,
    espaciotipo: tipoLimpio,
    espaciodim: dimensionesLimpio
  }).select().single();

  if (error) throw new Error(error.message);

  return data;
}

export async function actualizar(edificioIdViejo, espacioNumViejo, datos) {
  const pisoLimpio = limpiar(datos.piso) || limpiar(datos.espacioPiso);
  const area = datos.areaId ? Number(datos.areaId) : null;
  const nombreLimpio = limpiar(datos.nombre);
  const tipoLimpio = limpiar(datos.tipo);
  const dimensionesLimpio = limpiar(datos.dimensiones);

  const { data, error } = await supabase.from('espacio').update({
    espaciopiso: pisoLimpio,
    areaid: area,
    espacionom: nombreLimpio,
    espaciotipo: tipoLimpio,
    espaciodim: dimensionesLimpio
  }).eq('edificioid', edificioIdViejo).eq('espacionum', espacioNumViejo).select().single();

  if (error || !data) throw noEncontrado(`No existe el espacio.`);

  return data;
}

export async function eliminar(edificioId, espacioNum) {
  const { data, error } = await supabase.from('espacio').delete()
    .eq('edificioid', edificioId)
    .eq('espacionum', espacioNum)
    .select().single();
    
  if (error || !data) throw noEncontrado(`No existe el espacio.`);

  return data;
}

export async function obtenerTipos() {
  return ['Aula', 'Laboratorio', 'Oficina', 'Pasillo', 'Área común'];
}
