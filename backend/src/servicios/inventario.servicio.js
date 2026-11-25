import { supabase } from '../config/supabase.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado } from '../utiles/errores.js';
import { ENUM_ESTADO_HERRAMIENTA } from '../utiles/enumerados.js';
import { controlarTecnicoActivo } from './usuarios.servicio.js';

/**
 * Catálogo del depósito (HU-15): materiales (se consumen) y modelos de
 * herramientas, cuyas unidades físicas se prestan y se devuelven por separado.
 */
const CLASES = ['Material', 'Herramienta'];
const UNIDADES_MEDIDA = ['par', 'unidad', 'metro', 'pulgada', 'kilogramo', 'litro', 'metro cuadrado'];
const LARGO_UNIDAD_MEDIDA = 40;
// 23505: indice unico repetido; 23514: CHECK viejo de la columna; 42P01/PGRST205: la tabla unidad_medida todavia no esta.
const DUPLICADO = '23505';
const FALTA_TABLA_UNIDADES = ['42P01', 'PGRST205'];

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
    unidadMedida: fila.mat_unidad_medida || 'unidad',
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
 * El texto del estado guardado en la base (1=Disponible, 2=En uso, 3=Fuera de
 * servicio; ver utiles/enumerados.js).
 */
function normalizarEstado(codigo) {
  return ENUM_ESTADO_HERRAMIENTA.texto(codigo) ?? 'Disponible';
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
    codigoModelo: fila.herr_modelo_cod ?? null,
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
    fechaAlta: fila.herr_fecha_alta ?? null,
    idRemito: fila.remito_id ?? null,
  };
}

const COLUMNAS = '*, inventariotipo (inventariotiponom)';
const COLUMNAS_MODELO = '*, inventariotipo (inventariotiponom)';

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

async function buscarModeloHerramienta(codigo) {
  const { data, error } = await supabase
    .from('herramienta_modelo')
    .select(COLUMNAS_MODELO)
    .eq('herr_modelo_cod', codigo)
    .maybeSingle();
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

/** Devuelve una fila del catálogo: un material o un modelo de herramienta. */
export async function obtenerItemCatalogo(codigo) {
  const material = await buscarMaterial(codigo);
  if (material) return aMaterial(material);
  const modelo = await buscarModeloHerramienta(codigo);
  if (!modelo) {
    const unidad = await buscarHerramienta(codigo);
    if (unidad) return aHerramienta(unidad, await obtenerPrestamosAbiertos(codigo));
  }
  if (modelo) {
    const unidades = await obtenerUnidadesHerramienta(codigo);
    const disponibles = unidades.filter((unidad) => unidad.estado === 'Disponible').length;
    return {
      codigo: modelo.herr_modelo_cod,
      nombre: modelo.herr_modelo_nom,
      descripcion: modelo.herr_modelo_desc || '',
      idTipo: modelo.inventariotipoid,
      nombreTipo: modelo.inventariotipo?.inventariotiponom || '',
      clase: 'Herramienta',
      stockActual: disponibles,
      cantidadTotal: unidades.length,
      cantidadEnUso: unidades.filter((unidad) => unidad.estado === 'En uso').length,
      cantidadFueraDeServicio: unidades.filter((unidad) => unidad.estado === 'Fuera de servicio').length,
      unidades,
    };
  }
  throw noEncontrado(`No existe el código "${codigo}" en el depósito.`);
}

/** Unidades físicas de un modelo (o todas), cada una identificada por su código. */
export async function obtenerUnidadesHerramienta(codigoModelo = null) {
  let consulta = supabase
    .from('herramienta')
    .select(`${COLUMNAS}, herr_modelo_cod, herr_fecha_alta, remito_id`)
    .order('herr_cod');
  if (codigoModelo) consulta = consulta.eq('herr_modelo_cod', codigoModelo);
  const [{ data, error }, prestamos] = await Promise.all([consulta, obtenerPrestamosAbiertos()]);
  if (error) throw new Error(error.message);
  return data.map((fila) => aHerramienta(fila, prestamos));
}

/** Registra el ingreso manual de unidades con fecha de alta. */
export async function registrarIngresoHerramienta(codigoModelo, datos = {}) {
  const fecha = texto(datos.fecha);
  const cantidad = Number(datos.cantidad);
  if (!fecha) throw datoInvalido('Hay que indicar la fecha del ingreso.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    throw datoInvalido(`"${fecha}" no es una fecha válida.`);
  }
  if (fecha > new Date().toISOString().slice(0, 10)) {
    throw datoInvalido('La fecha del ingreso no puede ser posterior a hoy.');
  }
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw datoInvalido('La cantidad tiene que ser un número entero mayor que cero.');
  }

  const { error } = await supabase.rpc('registrar_ingreso_herramienta_manual', {
    p_modelo_cod: codigoModelo,
    p_fecha: fecha,
    p_cantidad: cantidad,
  });
  if (error?.code === 'P0001') throw datoInvalido(error.message);
  if (error?.code === DUPLICADO) throw conflicto('No se pudo generar un código único para una herramienta.');
  if (error) throw errorDeBase(error, 'del ingreso manual de herramientas');
  return obtenerItemCatalogo(codigoModelo);
}

export async function obtenerUnidadesMedida() {
  const [{ data: catalogo, error: errorCatalogo }, { data: materiales, error: errorMateriales }] = await Promise.all([
    supabase.from('unidad_medida').select('unidad_medida_nom'),
    supabase.from('material').select('mat_unidad_medida'),
  ]);

  if (errorCatalogo && !FALTA_TABLA_UNIDADES.includes(errorCatalogo.code)) {
    throw errorDeBase(errorCatalogo, 'de las unidades de medida');
  }
  if (errorMateriales) throw new Error(errorMateriales.message);

  const vistas = new Map();
  const agregar = (valor) => {
    const limpio = texto(valor);
    if (!limpio) return;
    const clave = limpio.toLowerCase();
    if (!vistas.has(clave)) vistas.set(clave, limpio);
  };

  for (const base of UNIDADES_MEDIDA) agregar(base);
  for (const fila of catalogo ?? []) agregar(fila.unidad_medida_nom);
  for (const fila of materiales ?? []) agregar(fila.mat_unidad_medida);

  return [...vistas.values()].sort((a, b) => a.localeCompare(b, 'es'));
}

export async function crearUnidadMedida(datos = {}) {
  const nombre = texto(datos.nombre ?? datos.unidadMedida)?.toLowerCase() ?? null;
  if (!nombre) throw datoInvalido('El nombre de la unidad de medida es obligatorio.');
  if (nombre.length > LARGO_UNIDAD_MEDIDA) {
    throw datoInvalido(`La unidad de medida no puede tener más de ${LARGO_UNIDAD_MEDIDA} caracteres.`);
  }

  const actuales = await obtenerUnidadesMedida();
  if (actuales.some((una) => una.toLowerCase() === nombre)) {
    throw conflicto(`Ya existe la unidad de medida "${nombre}".`);
  }

  const { data, error } = await supabase
    .from('unidad_medida')
    .insert({ unidad_medida_nom: nombre })
    .select('unidad_medida_nom')
    .single();

  if (error?.code === DUPLICADO) {
    throw conflicto(`Ya existe la unidad de medida "${nombre}".`);
  }
  if (error && !FALTA_TABLA_UNIDADES.includes(error.code)) {
    throw errorDeBase(error, 'de las unidades de medida');
  }

  return data?.unidad_medida_nom ?? nombre;
}

async function registrarUnidadEnCatalogo(unidadMedida) {
  if (!unidadMedida || UNIDADES_MEDIDA.includes(unidadMedida)) return;
  const { error } = await supabase.from('unidad_medida').insert({ unidad_medida_nom: unidadMedida });
  if (error && error.code !== DUPLICADO && !FALTA_TABLA_UNIDADES.includes(error.code)) {
    throw errorDeBase(error, 'de las unidades de medida');
  }
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
  const usados =
    (await contar('material', 'inventariotipoid', id)) +
    (await contar('herramienta_modelo', 'inventariotipoid', id));
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
    const { data, error } = await supabase.from('herramienta_modelo').select(COLUMNAS_MODELO);
    if (error) throw new Error(error.message);
    const unidades = await obtenerUnidadesHerramienta();
    const porModelo = new Map();
    for (const unidad of unidades) {
      const conteo = porModelo.get(unidad.codigoModelo) ?? {
        disponibles: 0,
        enUso: 0,
        fueraDeServicio: 0,
      };
      if (unidad.estado === 'Disponible') conteo.disponibles += 1;
      if (unidad.estado === 'En uso') conteo.enUso += 1;
      if (unidad.estado === 'Fuera de servicio') conteo.fueraDeServicio += 1;
      porModelo.set(unidad.codigoModelo, conteo);
    }
    items.push(
      ...data.map((fila) => {
        const conteo = porModelo.get(fila.herr_modelo_cod) ?? {
          disponibles: 0,
          enUso: 0,
          fueraDeServicio: 0,
        };
        return {
          codigo: fila.herr_modelo_cod,
          nombre: fila.herr_modelo_nom,
          descripcion: fila.herr_modelo_desc || '',
          idTipo: fila.inventariotipoid,
          nombreTipo: fila.inventariotipo?.inventariotiponom || '',
          clase: 'Herramienta',
          estado: null,
          stockActual: conteo.disponibles,
          cantidadTotal: conteo.disponibles + conteo.enUso + conteo.fueraDeServicio,
          cantidadEnUso: conteo.enUso,
          cantidadFueraDeServicio: conteo.fueraDeServicio,
          tecnico: null,
          legajoTecnico: null,
          asignadaDesde: null,
        };
      })
    );
  }

  return items.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/**
 * Las alertas de stock minimo (HU-33): los materiales cuyo stock actual esta
 * por debajo del minimo, con cuanto falta para llegar a el.
 *
 * La alerta no se guarda en una tabla: se calcula del stock cada vez que se
 * pide. Asi aparece sola cuando un consumo en una tarea baja el stock (HU-22)
 * y se resuelve sola cuando un remito lo vuelve a subir (HU-16), sin que nadie
 * tenga que acordarse de crearla ni de cerrarla.
 *
 * Van primero los que mas faltan; a igual faltante, por nombre.
 */
export async function obtenerAlertasStock() {
  const materiales = await obtenerItems('Material');
  return materiales
    .filter((material) => material.bajoMinimo)
    .map((material) => ({
      codigo: material.codigo,
      nombre: material.nombre,
      nombreTipo: material.nombreTipo,
      unidadMedida: material.unidadMedida,
      stockActual: material.stockActual,
      stockMinimo: material.stockMinimo,
      faltante: material.stockMinimo - material.stockActual,
    }))
    .sort((a, b) => b.faltante - a.faltante || a.nombre.localeCompare(b.nombre, 'es'));
}

function leerDatos(datos) {
  const nombre = texto(datos.nombre);
  const clase = leerClase(datos.clase);
  const descripcion = texto(datos.descripcion);
  const unidadMedida = texto(datos.unidadMedida)?.toLowerCase() ?? null;
  const idTipo = Number(datos.idTipo);
  const hayMinimo = datos.stockMinimo !== '' && datos.stockMinimo != null;
  const stockMinimo = hayMinimo ? Number(datos.stockMinimo) : null;

  if (!nombre) throw datoInvalido('El nombre es obligatorio.');
  if (!Number.isInteger(idTipo)) throw datoInvalido('Hay que indicar un tipo.');
  if (clase === 'Material' && !unidadMedida) {
    throw datoInvalido('Elegí una unidad de medida válida para el material.');
  }
  if (clase === 'Material' && unidadMedida.length > LARGO_UNIDAD_MEDIDA) {
    throw datoInvalido(`La unidad de medida no puede tener más de ${LARGO_UNIDAD_MEDIDA} caracteres.`);
  }
  if (clase === 'Material' && (!Number.isInteger(stockMinimo) || stockMinimo < 0)) {
    throw datoInvalido('El stock mínimo del material es obligatorio y no puede ser negativo.');
  }
  if (clase === 'Herramienta' && hayMinimo) {
    throw datoInvalido('Una herramienta no lleva stock mínimo.');
  }

  return { nombre, clase, descripcion, unidadMedida, idTipo, stockMinimo };
}

export async function crearItem(datos) {
  const codigo = texto(datos.codigo);
  if (!codigo) throw datoInvalido('El código es obligatorio.');
  if (/^HE-\d{3}$/.test(codigo)) {
    throw datoInvalido('Los códigos HE-000 a HE-999 están reservados para las unidades de herramienta.');
  }
  const item = leerDatos(datos);
  await verificarTipo(item.idTipo, item.clase);

  const [material, herramienta, modelo] = await Promise.all([
    buscarMaterial(codigo),
    buscarHerramienta(codigo),
    buscarModeloHerramienta(codigo),
  ]);
  if (material || herramienta || modelo) {
    throw conflicto(`Ya existe un material o una herramienta con el código "${codigo}".`);
  }

  if (item.clase === 'Material') {
    await registrarUnidadEnCatalogo(item.unidadMedida);
    const { data, error } = await supabase
      .from('material')
      .insert({
        mat_cod: codigo,
        mat_nom: item.nombre,
        mat_desc: item.descripcion,
        mat_unidad_medida: item.unidadMedida,
        inventariotipoid: item.idTipo,
        mat_stock_actual: 0,
        mat_stock_min: item.stockMinimo,
      })
      .select(COLUMNAS)
      .single();
    if (error?.code === '23514') throw errorDeBase({ code: 'PGRST205' }, 'de las unidades de medida');
    if (error) throw new Error(error.message);
    return aMaterial(data);
  }

  const { data, error } = await supabase
    .from('herramienta_modelo')
    .insert({
      herr_modelo_cod: codigo,
      herr_modelo_nom: item.nombre,
      herr_modelo_desc: item.descripcion,
      inventariotipoid: item.idTipo,
    })
    .select(COLUMNAS)
    .single();
  if (error) throw new Error(error.message);
  return obtenerItemCatalogo(data.herr_modelo_cod);
}

export async function actualizarItem(codigo, datos) {
  const actual = await obtenerItemCatalogo(codigo);
  const codigoCatalogo = actual.codigo;
  if (datos.clase !== actual.clase) throw datoInvalido('La clase no se puede cambiar después del alta.');
  const item = leerDatos(datos);
  await verificarTipo(item.idTipo, item.clase);

  if (actual.clase === 'Material') {
    await registrarUnidadEnCatalogo(item.unidadMedida);
    const { data, error } = await supabase
      .from('material')
      .update({
        mat_nom: item.nombre,
        mat_desc: item.descripcion,
        mat_unidad_medida: item.unidadMedida,
        inventariotipoid: item.idTipo,
        mat_stock_min: item.stockMinimo,
      })
      .eq('mat_cod', codigoCatalogo)
      .select(COLUMNAS)
      .single();
    if (error?.code === '23514') throw errorDeBase({ code: 'PGRST205' }, 'de las unidades de medida');
    if (error) throw new Error(error.message);
    return aMaterial(data);
  }

  const { error } = await supabase.rpc('actualizar_modelo_herramienta', {
    p_codigo: codigoCatalogo,
    p_nombre: item.nombre,
    p_descripcion: item.descripcion,
    p_tipo_id: item.idTipo,
  });
  if (error?.code === 'P0001') throw datoInvalido(error.message);
  if (error) throw errorDeBase(error, 'del modelo de herramienta');
  return obtenerItemCatalogo(codigoCatalogo);
}
/**
 * El historial de movimientos de un item (HU-16), del mas nuevo al mas viejo.
 *
 * Un movimiento de Ingreso viene de un remito y trae su numero y su proveedor.
 * Un Consumo sale de una tarea de OT y no tiene remito: por eso remito_id es
 * anulable y aca el origen queda en null. Un Ingreso manual o un Egreso manual lo
 * carga el administrador a mano (06/11/2026) y puede traer una observacion.
 */
export async function obtenerMovimientos(codigo) {
  // Que el item exista: si no, el historial vacio no se distingue de un codigo
  // mal escrito.
  const item = await obtenerItemCatalogo(codigo);
  const codigoCatalogo = item.codigo;

  const { data, error } = await supabase
    .from('inventariomovimiento')
    .select(`
      inventariomovimientoid,
      inventariomovimientotipo,
      inventariomovimientocantidad,
      inventariomovimientofecha,
      inventariomovimientousuario,
      inventariomovimientoobs,
      remito_id,
      remito (
        remito_num,
        remito_proveedor
      )
    `)
    .eq('inventarioitemcod', codigoCatalogo)
    .order('inventariomovimientofecha', { ascending: false })
    .order('inventariomovimientoid', { ascending: false });

  // 42703: falta la columna de la observacion, que llega con la migracion de los ajustes.
  if (error?.code === '42703') throw errorDeBase({ code: 'PGRST202' }, 'de los ajustes de stock');
  // El historial se une con remito, que llega con la migracion de HU-16.
  if (error) throw errorDeBase(error, 'del remito');

  return data.map((fila) => ({
    id: fila.inventariomovimientoid,
    tipo: fila.inventariomovimientotipo,
    cantidad: fila.inventariomovimientocantidad,
    fecha: fila.inventariomovimientofecha,
    usuario: fila.inventariomovimientousuario ?? null,
    observacion: fila.inventariomovimientoobs ?? null,
    idRemito: fila.remito_id ?? null,
    numeroRemito: fila.remito?.remito_num ?? null,
    proveedor: fila.remito?.remito_proveedor ?? null,
  }));
}

/** Para donde mueve el stock un ajuste. */
export const TIPOS_AJUSTE = ['Entrada', 'Salida'];

/**
 * Ajuste de stock de un material (06/11/2026): sumar unidades que no vienen de
 * una compra o descontar las que no se usaron en una tarea (se rompieron, se
 * perdieron, se vencieron). No lleva motivo: la observacion es opcional.
 *
 * Una herramienta no tiene stock: si se rompe o se pierde se da de baja y
 * queda fuera de servicio (eliminarItem).
 *
 * El trabajo lo hace registrar_ajuste_stock() en la base, que mueve el stock y
 * anota el movimiento todo junto. Ahi tambien se controla que la fecha no sea
 * anterior al ultimo movimiento del material. Devuelve el material como queda,
 * con bajoMinimo ya recalculado: la alerta de stock minimo sale de ese numero.
 *
 * @param {string} codigo
 * @param {object} datos - { tipo: 'Entrada' | 'Salida', cantidad, fecha: '2026-11-06', observacion }
 * @param {string} usuario - el identificador de la sesion
 */
export async function registrarAjuste(codigo, datos = {}, usuario = null) {
  const tipo = texto(datos.tipo);
  if (!TIPOS_AJUSTE.includes(tipo)) throw datoInvalido('Hay que elegir si es un ingreso o un egreso.');

  const cantidad = Number(datos.cantidad);
  if (!Number.isInteger(cantidad) || cantidad <= 0) {
    throw datoInvalido('La cantidad tiene que ser un número entero mayor que cero.');
  }

  const fecha = texto(datos.fecha);
  if (!fecha) throw datoInvalido('Hay que indicar la fecha del ajuste.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) || Number.isNaN(Date.parse(fecha))) {
    throw datoInvalido(`"${fecha}" no es una fecha válida.`);
  }
  if (fecha > new Date().toISOString().slice(0, 10)) {
    throw datoInvalido('La fecha del ajuste no puede ser posterior a hoy.');
  }

  const observacion = texto(datos.observacion);
  if (observacion && observacion.length > 500) {
    throw datoInvalido('La observación puede tener hasta 500 caracteres.');
  }

  const [material, herramienta, modelo] = await Promise.all([
    buscarMaterial(codigo),
    buscarHerramienta(codigo),
    buscarModeloHerramienta(codigo),
  ]);
  if (!material && !herramienta && !modelo) {
    throw noEncontrado(`No existe el código "${codigo}" en el depósito.`);
  }
  if (!material) {
    throw datoInvalido('Una herramienta no tiene stock: si se rompe o se pierde, se da de baja y queda fuera de servicio.');
  }
  const item = aMaterial(material);
  if (tipo === 'Salida' && cantidad > item.stockActual) {
    throw datoInvalido(
      `No hay stock suficiente de "${item.nombre}": quedan ${item.stockActual} y querés descontar ${cantidad}.`
    );
  }

  const { error } = await supabase.rpc('registrar_ajuste_stock', {
    p_codigo: codigo,
    p_tipo: tipo,
    p_cantidad: cantidad,
    p_fecha: fecha,
    p_obs: observacion,
    p_usuario: usuario,
  });

  if (error) {
    // P0001: la funcion corto con RAISE EXCEPTION y el mensaje ya es para el administrador.
    if (error.code === 'P0001') throw datoInvalido(error.message);
    throw errorDeBase(error, 'de los ajustes de stock');
  }

  return aMaterial(await buscarMaterial(codigo));
}

/**
 * En que tareas se consumio el material (HU-35), de la mas nueva a la mas vieja.
 *
 * Sale de tarea_ot_consume_material: una fila por tarea, con la cantidad ya
 * sumada si se registro mas de una vez y la fecha del ultimo registro
 * (decision del 23/10/2026, para no cambiar el modelo de datos).
 *
 * El tecnico se trae aparte porque tecnico_asignado_tarea_ot apunta a la tarea
 * con dos columnas y no se puede embeber.
 */
export async function obtenerConsumos(codigo) {
  const item = await obtenerItem(codigo);
  if (item.clase !== 'Material') throw datoInvalido('Una herramienta no se consume: se presta y se devuelve.');

  const { data, error } = await supabase
    .from('tarea_ot_consume_material')
    .select('ot_id, tarea_id, tamat_cant, tamat_fecha_cons, tarea_ot ( tarea_desc )')
    .eq('mat_cod', codigo)
    .order('tamat_fecha_cons', { ascending: false });
  if (error) throw errorDeBase(error, 'de los materiales usados');
  if (data.length === 0) return [];

  const { data: asignaciones, error: errorAsignaciones } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select('ot_id, tarea_id, tecnico ( tecnico_nom_ape )')
    .in('ot_id', [...new Set(data.map((fila) => fila.ot_id))]);
  if (errorAsignaciones) throw errorDeBase(errorAsignaciones, 'de las tareas');

  const tecnicos = new Map(
    asignaciones.map((fila) => [`${fila.ot_id}-${fila.tarea_id}`, fila.tecnico?.tecnico_nom_ape ?? null])
  );

  return data.map((fila) => ({
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    tarea: fila.tarea_ot?.tarea_desc ?? '',
    cantidad: Number(fila.tamat_cant),
    fecha: fila.tamat_fecha_cons,
    tecnico: tecnicos.get(`${fila.ot_id}-${fila.tarea_id}`) ?? null,
  }));
}

/**
 * Guarda el estado de la herramienta en la columna. "En uso" tambien queda
 * guardado (07/10/2026), aunque el que manda sigue siendo el prestamo abierto.
 */
async function guardarEstado(codigo, estado) {
  const { error } = await supabase
    .from('herramienta')
    .update({ herr_estado: ENUM_ESTADO_HERRAMIENTA.codigo(estado) })
    .eq('herr_cod', codigo);
  if (error) throw new Error(error.message);
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
  await controlarTecnicoActivo(legajo);

  // Si se toma desde una tarea, el prestamo guarda la OT y la tarea (22/10/2026).
  const desdeTarea = datos.idOt && datos.idTarea ? { ot_id: datos.idOt, tarea_id: datos.idTarea } : {};

  const prestar = (tarea) =>
    supabase.from('tecnico_utiliza_herramienta').insert({ tecnico_legajo: legajo, herr_cod: codigo, ...tarea });

  let { error } = await prestar(desdeTarea);

  // Si la base todavia no tiene la migracion 20261022120000 (falta ot_id), el
  // prestamo se guarda igual, sin la tarea. 42703 o PGRST204: columna inexistente.
  if (error && ['42703', 'PGRST204'].includes(error.code)) {
    ({ error } = await prestar({}));
  }
  if (error) {
    // 23505: otro pedido la asigno al mismo tiempo y el indice unico lo freno.
    if (error.code === '23505') throw conflicto(`"${herramienta.nombre}" ya está asignada a otro técnico.`);
    throw new Error(error.message);
  }

  await guardarEstado(codigo, 'En uso');
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

  await guardarEstado(codigo, 'Disponible');
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
    .update({ herr_estado: ENUM_ESTADO_HERRAMIENTA.codigo('Disponible') })
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
      .update({ herr_estado: ENUM_ESTADO_HERRAMIENTA.codigo('Fuera de servicio') })
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
