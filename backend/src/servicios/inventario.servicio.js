import { supabase } from '../config/supabase.js';
import { conflicto, datoInvalido, noEncontrado } from '../utiles/errores.js';

const CLASES = ['Material', 'Herramienta'];

function texto(valor) {
  if (typeof valor !== 'string') return null;
  const resultado = valor.trim();
  return resultado || null;
}

function leerClase(valor) {
  if (!CLASES.includes(valor)) throw datoInvalido('La clase debe ser Material o Herramienta.');
  return valor;
}

function aTipo(fila) {
  return {
    idTipo: fila.inventariotipoid,
    nombre: fila.inventariotiponom,
    descripcion: fila.inventariotipodesc || '',
    clase: fila.inventariotipoclase,
  };
}

function aItem(fila) {
  return {
    codigo: fila.inventarioitemcod,
    nombre: fila.inventarioitemnom,
    descripcion: fila.inventarioitemdesc || '',
    idTipo: fila.inventariotipoid,
    nombreTipo: fila.inventariotipo?.inventariotiponom || '',
    clase: fila.inventarioitemclase,
    stockActual: fila.inventarioitemstockactual,
    stockMinimo: fila.inventarioitemstockmin,
    fechaVencimiento: fila.inventarioitemfechavenc,
    estado: fila.inventarioitemestado,
  };
}

const COLUMNAS = `
  *,
  inventariotipo (inventariotiponom)
`;

async function verificarTipo(idTipo, clase) {
  const { data, error } = await supabase
    .from('inventariotipo')
    .select('*')
    .eq('inventariotipoid', idTipo)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw datoInvalido('El tipo de inventario no existe.');
  if (data.inventariotipoclase !== clase) {
    throw datoInvalido('El tipo elegido no corresponde a la clase del ítem.');
  }
}

function leerItem(datos) {
  const codigo = texto(datos.codigo);
  const nombre = texto(datos.nombre);
  const clase = leerClase(datos.clase);
  const idTipo = Number(datos.idTipo);
  const stockMinimo = datos.stockMinimo === '' || datos.stockMinimo == null ? null : Number(datos.stockMinimo);

  if (!codigo) throw datoInvalido('El codigo del item es obligatorio.');
  if (!nombre) throw datoInvalido('El nombre del item es obligatorio.');
  if (!Number.isInteger(idTipo)) throw datoInvalido('Hay que indicar un tipo de inventario.');
  if (clase === 'Material' && (!Number.isInteger(stockMinimo) || stockMinimo < 0)) {
    throw datoInvalido('El stock minimo del material es obligatorio y no puede ser negativo.');
  }
  if (clase === 'Herramienta' && (stockMinimo !== null || datos.fechaVencimiento)) {
    throw datoInvalido('Una herramienta no lleva stock minimo ni fecha de vencimiento.');
  }

  return { codigo, nombre, clase, idTipo, stockMinimo, descripcion: texto(datos.descripcion), fechaVencimiento: datos.fechaVencimiento || null };
}

export async function obtenerTipos(clase) {
  let consulta = supabase.from('inventariotipo').select('*').order('inventariotiponom');
  if (clase) consulta = consulta.eq('inventariotipoclase', leerClase(clase));
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return data.map(aTipo);
}

export async function obtenerTipo(id) {
  const { data, error } = await supabase.from('inventariotipo').select('*').eq('inventariotipoid', id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el tipo de inventario ${id}.`);
  return aTipo(data);
}

export async function crearTipo(datos) {
  const nombre = texto(datos.nombre);
  const clase = leerClase(datos.clase);
  if (!nombre) throw datoInvalido('El nombre del tipo es obligatorio.');
  const { data: existente } = await supabase.from('inventariotipo').select('inventariotipoid').ilike('inventariotiponom', nombre).eq('inventariotipoclase', clase).maybeSingle();
  if (existente) throw conflicto(`Ya existe el tipo "${nombre}" para ${clase.toLowerCase()}.`);
  const { data, error } = await supabase.from('inventariotipo').insert({ inventariotiponom: nombre, inventariotipodesc: texto(datos.descripcion), inventariotipoclase: clase }).select().single();
  if (error) throw new Error(error.message);
  return aTipo(data);
}

export async function actualizarTipo(id, datos) {
  const nombre = texto(datos.nombre);
  const clase = leerClase(datos.clase);
  if (!nombre) throw datoInvalido('El nombre del tipo es obligatorio.');
  const { data: existente } = await supabase.from('inventariotipo').select('inventariotipoid').ilike('inventariotiponom', nombre).eq('inventariotipoclase', clase).neq('inventariotipoid', id).maybeSingle();
  if (existente) throw conflicto(`Ya existe el tipo "${nombre}" para ${clase.toLowerCase()}.`);
  const { data, error } = await supabase.from('inventariotipo').update({ inventariotiponom: nombre, inventariotipodesc: texto(datos.descripcion), inventariotipoclase: clase }).eq('inventariotipoid', id).select().maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el tipo de inventario ${id}.`);
  return aTipo(data);
}

export async function eliminarTipo(id) {
  const { count } = await supabase.from('inventarioitem').select('*', { count: 'exact', head: true }).eq('inventariotipoid', id);
  if (count) throw conflicto('No se puede eliminar un tipo que tiene items asociados.');
  const tipo = await obtenerTipo(id);
  const { error } = await supabase.from('inventariotipo').delete().eq('inventariotipoid', id);
  if (error) throw new Error(error.message);
  return tipo;
}

export async function obtenerItems(clase) {
  let consulta = supabase.from('inventarioitem').select(COLUMNAS).order('inventarioitemnom');
  if (clase) consulta = consulta.eq('inventarioitemclase', leerClase(clase));
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return data.map(aItem);
}

export async function obtenerItem(codigo) {
  const { data, error } = await supabase.from('inventarioitem').select(COLUMNAS).eq('inventarioitemcod', codigo).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el item "${codigo}".`);
  return aItem(data);
}

export async function crearItem(datos) {
  const item = leerItem(datos);
  const { data: repetido } = await supabase.from('inventarioitem').select('inventarioitemcod').ilike('inventarioitemcod', item.codigo).maybeSingle();
  if (repetido) throw conflicto(`Ya existe un item con el codigo "${item.codigo}".`);
  await verificarTipo(item.idTipo, item.clase);
  const { data, error } = await supabase.from('inventarioitem').insert({ inventarioitemcod: item.codigo, inventarioitemnom: item.nombre, inventarioitemdesc: item.descripcion, inventariotipoid: item.idTipo, inventarioitemclase: item.clase, inventarioitemstockmin: item.stockMinimo, inventarioitemfechavenc: item.fechaVencimiento, inventarioitemestado: item.clase === 'Herramienta' ? 'Disponible' : 'Disponible' }).select(COLUMNAS).single();
  if (error) throw new Error(error.message);
  return aItem(data);
}

export async function actualizarItem(codigo, datos) {
  const item = leerItem({ ...datos, codigo });
  await obtenerItem(codigo);
  await verificarTipo(item.idTipo, item.clase);
  const { data, error } = await supabase.from('inventarioitem').update({ inventarioitemnom: item.nombre, inventarioitemdesc: item.descripcion, inventariotipoid: item.idTipo, inventarioitemclase: item.clase, inventarioitemstockmin: item.stockMinimo, inventarioitemfechavenc: item.fechaVencimiento }).eq('inventarioitemcod', codigo).select(COLUMNAS).single();
  if (error) throw new Error(error.message);
  return aItem(data);
}

export async function eliminarItem(codigo) {
  const { count } = await supabase.from('inventariomovimiento').select('*', { count: 'exact', head: true }).eq('inventarioitemcod', codigo);
  if (count) throw conflicto('No se puede eliminar un item que tiene movimientos registrados.');
  const item = await obtenerItem(codigo);
  const { error } = await supabase.from('inventarioitem').delete().eq('inventarioitemcod', codigo);
  if (error) throw new Error(error.message);
  return item;
}

export { CLASES };