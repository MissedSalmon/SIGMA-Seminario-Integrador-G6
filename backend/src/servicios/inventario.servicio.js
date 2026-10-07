import { supabase } from '../config/supabase.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado } from '../utiles/errores.js';

/**
 * Catalogo del deposito (HU-15): materiales (se consumen) y herramientas (se
 * prestan y se devuelven). Cada clase tiene su tabla (material y herramienta);
 * el codigo es unico entre las dos.
 */
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

function aMaterial(fila) {
  const stockActual = Number(fila.mat_stock_actual ?? 0);
  const stockMinimo = Number(fila.mat_stock_min ?? 0);
  return {
    codigo: fila.mat_cod,
    nombre: fila.mat_nom,
    descripcion: fila.mat_desc || '',
    idTipo: fila.inventariotipoid,
    nombreTipo: fila.inventariotipo?.inventariotiponom || '',
    clase: 'Material',
    stockActual,
    stockMinimo,
    bajoMinimo: stockActual < stockMinimo,
    estado: null,
    tecnico: null,
    legajoTecnico: null,
    asignadaDesde: null,
  };
}

/**
 * Deja el estado de una herramienta en uno de los tres que muestra el
 * sistema, sin importar como se haya escrito en la base ('DISPONIBLE',
 * 'Fuera_de_servicio'...). Tambien reconoce el nombre viejo ('En reparación')
 * para no perder lo que ya este guardado con ese valor.
 */
function normalizarEstado(valor) {
  const limpio = String(valor ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[_\s]+/g, ' ')
    .trim()
    .toUpperCase();
  if (limpio === 'EN USO') return 'En uso';
  if (['FUERA DE SERVICIO', 'EN REPARACION', 'NO DISPONIBLE'].includes(limpio)) return 'Fuera de servicio';
  return 'Disponible';
}

/**
 * Una herramienta esta en uso mientras tenga un prestamo abierto en
 * tecnico_utiliza_herramienta (sin fecha de devolucion), sin importar lo que
 * diga la columna herr_estado. Ese prestamo es la asignacion a un tecnico: la
 * base no deja que haya dos abiertos de la misma herramienta.
 */
async function obtenerPrestamosAbiertos(codigo) {
  let consulta = supabase
    .from('tecnico_utiliza_herramienta')
    .select('herr_cod, tecnico_legajo, tec_herr_fecha_prest, tecnico (tecnico_nom_ape)')
    .is('tec_herr_fecha_dev', null);
  if (codigo) consulta = consulta.eq('herr_cod', codigo);
  const { data, error } = await consulta;
  if (error) throw new Error(error.message);
  return new Map(
    data.map((prestamo) => [
      prestamo.herr_cod,
      {
        legajo: prestamo.tecnico_legajo,
        nombre: prestamo.tecnico?.tecnico_nom_ape ?? null,
        desde: prestamo.tec_herr_fecha_prest,
      },
    ])
  );
}

function aHerramienta(fila, prestamos = new Map()) {
  const prestamo = prestamos.get(fila.herr_cod);
  const prestada = Boolean(prestamo);
  const estadoGuardado = normalizarEstado(fila.herr_estado);
  return {
    codigo: fila.herr_cod,
    nombre: fila.herr_nom,
    descripcion: fila.herr_desc || '',
    idTipo: fila.inventariotipoid,
    nombreTipo: fila.inventariotipo?.inventariotiponom || '',
    clase: 'Herramienta',
    stockActual: null,
    stockMinimo: null,
    bajoMinimo: false,
    estado: prestada ? 'En uso' : estadoGuardado === 'En uso' ? 'Disponible' : estadoGuardado,
    tecnico: prestamo?.nombre ?? null,
    legajoTecnico: prestamo?.legajo ?? null,
    asignadaDesde: prestamo?.desde ?? null,
  };
}

const COLUMNAS = '*, inventariotipo (inventariotiponom)';

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

async function contar(tabla, columna, codigo) {
  const { count, error } = await supabase.from(tabla).select('*', { count: 'exact', head: true }).eq(columna, codigo);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

async function buscarMaterial(codigo) {
  const { data, error } = await supabase.from('material').select(COLUMNAS).eq('mat_cod', codigo).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

async function buscarHerramienta(codigo) {
  const { data, error } = await supabase.from('herramienta').select(COLUMNAS).eq('herr_cod', codigo).maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

/** Devuelve el item con ese codigo, sea material o herramienta. */
export async function obtenerItem(codigo) {
  const material = await buscarMaterial(codigo);
  if (material) return aMaterial(material);
  const herramienta = await buscarHerramienta(codigo);
  if (herramienta) return aHerramienta(herramienta, await obtenerPrestamosAbiertos(codigo));
  throw noEncontrado(`No existe el código "${codigo}" en el depósito.`);
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
  const usados = (await contar('material', 'inventariotipoid', id)) + (await contar('herramienta', 'inventariotipoid', id));
  if (usados) throw conflicto('No se puede eliminar un tipo que tiene materiales o herramientas asociados.');
  const tipo = await obtenerTipo(id);
  const { error } = await supabase.from('inventariotipo').delete().eq('inventariotipoid', id);
  if (error) throw new Error(error.message);
  return tipo;
}

export async function obtenerItems(clase) {
  if (clase) leerClase(clase);
  const items = [];

  if (clase !== 'Herramienta') {
    const { data, error } = await supabase.from('material').select(COLUMNAS);
    if (error) throw new Error(error.message);
    items.push(...data.map(aMaterial));
  }
  if (clase !== 'Material') {
    const [{ data, error }, prestamos] = await Promise.all([
      supabase.from('herramienta').select(COLUMNAS),
      obtenerPrestamosAbiertos(),
    ]);
    if (error) throw new Error(error.message);
    items.push(...data.map((fila) => aHerramienta(fila, prestamos)));
  }

  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function leerDatos(datos) {
  const nombre = texto(datos.nombre);
  const clase = leerClase(datos.clase);
  const descripcion = texto(datos.descripcion);
  const idTipo = Number(datos.idTipo);
  const hayMinimo = datos.stockMinimo !== '' && datos.stockMinimo != null;
  const stockMinimo = hayMinimo ? Number(datos.stockMinimo) : null;

  if (!nombre) throw datoInvalido('El nombre es obligatorio.');
  if (!Number.isInteger(idTipo)) throw datoInvalido('Hay que indicar un tipo.');
  if (clase === 'Material' && (!Number.isInteger(stockMinimo) || stockMinimo < 0)) {
    throw datoInvalido('El stock mínimo del material es obligatorio y no puede ser negativo.');
  }
  if (clase === 'Herramienta' && hayMinimo) {
    throw datoInvalido('Una herramienta no lleva stock mínimo.');
  }

  return { nombre, clase, descripcion, idTipo, stockMinimo };
}

export async function crearItem(datos) {
  const codigo = texto(datos.codigo);
  if (!codigo) throw datoInvalido('El código es obligatorio.');
  const item = leerDatos(datos);
  await verificarTipo(item.idTipo, item.clase);

  const [material, herramienta] = await Promise.all([buscarMaterial(codigo), buscarHerramienta(codigo)]);
  if (material || herramienta) {
    throw conflicto(`Ya existe un material o una herramienta con el código "${codigo}".`);
  }

  if (item.clase === 'Material') {
    const { data, error } = await supabase
      .from('material')
      .insert({
        mat_cod: codigo,
        mat_nom: item.nombre,
        mat_desc: item.descripcion,
        inventariotipoid: item.idTipo,
        mat_stock_actual: 0,
        mat_stock_min: item.stockMinimo,
      })
      .select(COLUMNAS)
      .single();
    if (error) throw new Error(error.message);
    return aMaterial(data);
  }

  const { data, error } = await supabase
    .from('herramienta')
    .insert({ herr_cod: codigo, herr_nom: item.nombre, herr_desc: item.descripcion, inventariotipoid: item.idTipo, herr_estado: 'Disponible' })
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(error.message);
  return aHerramienta(data);
}

export async function actualizarItem(codigo, datos) {
  const actual = await obtenerItem(codigo);
  if (datos.clase !== actual.clase) throw datoInvalido('La clase no se puede cambiar después del alta.');
  const item = leerDatos(datos);
  await verificarTipo(item.idTipo, item.clase);

  if (actual.clase === 'Material') {
    const { data, error } = await supabase
      .from('material')
      .update({
        mat_nom: item.nombre,
        mat_desc: item.descripcion,
        inventariotipoid: item.idTipo,
        mat_stock_min: item.stockMinimo,
      })
      .eq('mat_cod', codigo)
      .select(COLUMNAS)
      .single();
    if (error) throw new Error(error.message);
    return aMaterial(data);
  }

  const { data, error } = await supabase
    .from('herramienta')
    .update({ herr_nom: item.nombre, herr_desc: item.descripcion, inventariotipoid: item.idTipo })
    .eq('herr_cod', codigo)
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(error.message);
  return aHerramienta(data);
}
/**
 * El historial de movimientos de un item (HU-16), del mas nuevo al mas viejo.
 *
 * Un movimiento de Ingreso viene de un remito y trae su numero y su proveedor.
 * Un Consumo sale de una tarea de OT y no tiene remito: por eso remito_id es
 * anulable y aca el origen queda en null.
 */
export async function obtenerMovimientos(codigo) {
  // Que el item exista: si no, el historial vacio no se distingue de un codigo
  // mal escrito.
  await obtenerItem(codigo);

  const { data, error } = await supabase
    .from('inventariomovimiento')
    .select(`
      inventariomovimientoid,
      inventariomovimientotipo,
      inventariomovimientocantidad,
      inventariomovimientofecha,
      inventariomovimientousuario,
      remito_id,
      remito (
        remito_num,
        remito_proveedor
      )
    `)
    .eq('inventarioitemcod', codigo)
    .order('inventariomovimientofecha', { ascending: false })
    .order('inventariomovimientoid', { ascending: false });

  // El historial se une con remito, que llega con la migracion de HU-16.
  if (error) throw errorDeBase(error, 'del remito');

  return data.map((fila) => ({
    id: fila.inventariomovimientoid,
    tipo: fila.inventariomovimientotipo,
    cantidad: fila.inventariomovimientocantidad,
    fecha: fila.inventariomovimientofecha,
    usuario: fila.inventariomovimientousuario ?? null,
    idRemito: fila.remito_id ?? null,
    numeroRemito: fila.remito?.remito_num ?? null,
    proveedor: fila.remito?.remito_proveedor ?? null,
  }));
}

/** La herramienta con ese codigo, con su prestamo abierto si lo tiene. */
async function obtenerHerramienta(codigo) {
  const fila = await buscarHerramienta(codigo);
  if (!fila) {
    if (await buscarMaterial(codigo)) throw datoInvalido('Un material no se asigna a un técnico: se consume.');
    throw noEncontrado(`No existe la herramienta "${codigo}".`);
  }
  return aHerramienta(fila, await obtenerPrestamosAbiertos(codigo));
}

/**
 * Le asigna la herramienta a un tecnico: abre un prestamo en
 * tecnico_utiliza_herramienta. Cada herramienta la tiene un solo tecnico a la
 * vez, asi que si ya esta asignada primero hay que registrar la devolucion.
 */
export async function asignarHerramienta(codigo, datos = {}) {
  const legajo = texto(String(datos.legajo ?? ''));
  if (!legajo) throw datoInvalido('Hay que elegir el técnico.');

  const herramienta = await obtenerHerramienta(codigo);
  if (herramienta.estado === 'Fuera de servicio') {
    throw conflicto(`"${herramienta.nombre}" está fuera de servicio: no se puede asignar.`);
  }
  if (herramienta.legajoTecnico) {
    throw conflicto(
      `"${herramienta.nombre}" ya está asignada a ${herramienta.tecnico}. Primero hay que registrar la devolución.`
    );
  }

  const { data: tecnico, error: errorTecnico } = await supabase
    .from('tecnico')
    .select('tecnico_legajo')
    .eq('tecnico_legajo', legajo)
    .maybeSingle();
  if (errorTecnico) throw new Error(errorTecnico.message);
  if (!tecnico) throw datoInvalido(`No existe el técnico ${legajo}.`);

  const { error } = await supabase
    .from('tecnico_utiliza_herramienta')
    .insert({ tecnico_legajo: legajo, herr_cod: codigo });
  if (error) {
    // 23505: otro pedido la asigno al mismo tiempo y el indice unico lo freno.
    if (error.code === '23505') throw conflicto(`"${herramienta.nombre}" ya está asignada a otro técnico.`);
    throw new Error(error.message);
  }

  return obtenerHerramienta(codigo);
}

/**
 * El historial de asignaciones de una herramienta, de la mas nueva a la mas
 * vieja: que tecnico la tuvo, desde cuando y hasta cuando. La que sigue
 * abierta (sin devolucion) es la asignacion actual.
 *
 * Va aparte del historial de movimientos: aquel cuenta como cambio el stock,
 * y una asignacion o una devolucion no cambian ningun numero.
 */
export async function obtenerAsignaciones(codigo) {
  await obtenerHerramienta(codigo);

  const { data, error } = await supabase
    .from('tecnico_utiliza_herramienta')
    .select('tecnico_legajo, tec_herr_fecha_prest, tec_herr_fecha_dev, tecnico (tecnico_nom_ape)')
    .eq('herr_cod', codigo)
    .order('tec_herr_fecha_prest', { ascending: false });
  if (error) throw new Error(error.message);

  return data.map((fila) => ({
    legajo: fila.tecnico_legajo,
    tecnico: fila.tecnico?.tecnico_nom_ape ?? null,
    desde: fila.tec_herr_fecha_prest,
    hasta: fila.tec_herr_fecha_dev ?? null,
  }));
}

/** Registra que el tecnico devolvio la herramienta: cierra su prestamo abierto. */
export async function devolverHerramienta(codigo) {
  const herramienta = await obtenerHerramienta(codigo);
  if (!herramienta.legajoTecnico) {
    throw conflicto(`"${herramienta.nombre}" no está asignada a ningún técnico.`);
  }

  const { error } = await supabase
    .from('tecnico_utiliza_herramienta')
    .update({ tec_herr_fecha_dev: new Date().toISOString() })
    .eq('herr_cod', codigo)
    .is('tec_herr_fecha_dev', null);
  if (error) throw new Error(error.message);

  return obtenerHerramienta(codigo);
}

/**
 * Vuelve a poner en servicio una herramienta que estaba fuera de servicio (por
 * ejemplo, despues de repararla): queda Disponible para asignarla otra vez.
 */
export async function ponerEnServicio(codigo) {
  const herramienta = await obtenerHerramienta(codigo);
  if (herramienta.estado !== 'Fuera de servicio') {
    throw conflicto(`"${herramienta.nombre}" no está fuera de servicio.`);
  }

  const { error } = await supabase
    .from('herramienta')
    .update({ herr_estado: 'Disponible' })
    .eq('herr_cod', codigo);
  if (error) throw new Error(error.message);

  return obtenerHerramienta(codigo);
}

/**
 * Baja de un item del deposito.
 *
 * - Un MATERIAL se borra, pero solo si nunca tuvo movimientos (ingresos por
 *   remito, compras o consumos en una tarea): si no, se perderia el historial.
 * - Una HERRAMIENTA no se borra nunca: pasa a "Fuera de servicio" y queda
 *   registrada. No se puede dar de baja mientras este asignada a un tecnico:
 *   primero hay que registrar la devolucion, asi no queda asignada a nadie.
 */
export async function eliminarItem(codigo) {
  const item = await obtenerItem(codigo);

  if (item.clase === 'Herramienta') {
    if (item.estado === 'Fuera de servicio') {
      throw conflicto(`"${item.nombre}" ya está fuera de servicio.`);
    }
    if (item.legajoTecnico) {
      throw conflicto(
        `"${item.nombre}" está asignada a ${item.tecnico}. Primero hay que registrar la devolución.`
      );
    }

    const { error } = await supabase
      .from('herramienta')
      .update({ herr_estado: 'Fuera de servicio' })
      .eq('herr_cod', codigo);
    if (error) throw new Error(error.message);
    return obtenerHerramienta(codigo);
  }

  const movimientos =
    (await contar('inventariomovimiento', 'inventarioitemcod', codigo)) +
    (await contar('linea_compra', 'mat_cod', codigo)) +
    (await contar('tarea_ot_consume_material', 'mat_cod', codigo));
  if (movimientos) throw conflicto('No se puede eliminar un material que tiene movimientos registrados.');

  const { error } = await supabase.from('material').delete().eq('mat_cod', codigo);
  if (error) throw new Error(error.message);
  return item;
}

export { CLASES };
