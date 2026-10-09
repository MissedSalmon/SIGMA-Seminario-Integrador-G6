/**
 * Ingreso de materiales y herramientas por remito (HU-16).
 *
 * El remito es el comprobante con el que el deposito recibe la mercaderia. Al
 * confirmarlo suben los stocks y queda anotado un movimiento de Ingreso por
 * cada item, para poder reconstruir despues como llego el stock al numero que
 * se ve hoy.
 *
 * EL REMITO NO DA DE ALTA ITEMS. Solo se puede ingresar algo que ya este en el
 * catalogo del deposito (HU-13). Si el item no existe, primero hay que darlo de
 * alta en el catalogo.
 *
 * POR QUE LA CONFIRMACION PASA POR UNA FUNCION DE POSTGRES
 *
 * Confirmar el remito son cuatro escrituras (cabecera, renglones, movimientos y
 * stock) y tienen que pasar las cuatro o ninguna: si se cortan por la mitad, el
 * stock queda mintiendo. El cliente de Supabase no maneja transacciones, asi
 * que el trabajo lo hace registrar_remito(), que es una funcion de Postgres y
 * por lo tanto una transaccion. Ver la migracion
 * 20260929004641_remito_ingreso_stock.sql.
 *
 * Las validaciones estan de los dos lados a proposito: aca, con los mensajes
 * cuidados que lee el administrador, y adentro de la funcion, que es la ultima
 * linea y vale aunque alguien la llame por afuera del backend.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, errorDeBase, noEncontrado } from '../utiles/errores.js';

function texto(valor) {
  if (typeof valor !== 'string') return null;
  const resultado = valor.trim();
  return resultado || null;
}

/** La fecha de hoy como "2026-09-28", para comparar contra la de recepcion. */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

const COLUMNAS = `
  remito_id,
  remito_proveedor,
  remito_num,
  remito_fecha_recepcion,
  remito_obs,
  remito_creado_por,
  remito_creado_en,
  remito_item (
    inventarioitemcod,
    remito_item_cant
  )
`;

/**
 * Los datos de cada codigo, sea material o herramienta. El catalogo vive en dos
 * tablas y el codigo es unico entre las dos, asi que no hay una clave foranea
 * que las una: se buscan por separado. Devuelve un Map
 * codigo -> { nombre, clase, stockActual }. Las herramientas no llevan stock.
 */
async function detallesDeItems(codigos) {
  const detalles = new Map();
  if (codigos.length === 0) return detalles;

  const [materiales, herramientas] = await Promise.all([
    supabase.from('material').select('mat_cod, mat_nom, mat_stock_actual').in('mat_cod', codigos),
    supabase.from('herramienta').select('herr_cod, herr_nom').in('herr_cod', codigos),
  ]);

  if (materiales.error) throw new Error(materiales.error.message);
  if (herramientas.error) throw new Error(herramientas.error.message);

  for (const fila of materiales.data) {
    detalles.set(fila.mat_cod, {
      nombre: fila.mat_nom,
      clase: 'Material',
      stockActual: Number(fila.mat_stock_actual ?? 0),
    });
  }
  for (const fila of herramientas.data) {
    detalles.set(fila.herr_cod, { nombre: fila.herr_nom, clase: 'Herramienta', stockActual: null });
  }

  return detalles;
}

function aRenglon(fila, detalles) {
  const detalle = detalles.get(fila.inventarioitemcod);
  return {
    codigo: fila.inventarioitemcod,
    nombre: detalle?.nombre ?? '',
    clase: detalle?.clase ?? '',
    stockActual: detalle?.stockActual ?? null,
    cantidad: fila.remito_item_cant,
  };
}

function aRemito(fila, detalles) {
  const renglones = (fila.remito_item ?? []).map((renglon) => aRenglon(renglon, detalles));

  return {
    id: fila.remito_id,
    proveedor: fila.remito_proveedor,
    numero: fila.remito_num ?? null,
    fechaRecepcion: fila.remito_fecha_recepcion,
    observaciones: fila.remito_obs ?? null,
    creadoPor: fila.remito_creado_por ?? null,
    creadoEn: fila.remito_creado_en,
    items: renglones,
    // Los dos numeros que se muestran en el listado sin tener que abrir el
    // remito: cuantos items distintos trajo y cuantas unidades en total.
    cantidadItems: renglones.length,
    totalUnidades: renglones.reduce((suma, renglon) => suma + renglon.cantidad, 0),
  };
}

/**
 * Revisa los renglones que llegaron de la pantalla y los deja listos para la
 * funcion de Postgres: { codigo, cantidad }.
 */
function leerItems(valor) {
  if (!Array.isArray(valor) || valor.length === 0) {
    throw datoInvalido('El remito tiene que tener al menos un ítem.');
  }

  const vistos = new Set();

  return valor.map((renglon, indice) => {
    const codigo = texto(renglon?.codigo);

    if (!codigo) {
      throw datoInvalido(`Falta elegir el ítem del renglón ${indice + 1}.`);
    }

    if (vistos.has(codigo)) {
      throw datoInvalido(
        `El ítem "${codigo}" está repetido. Cargá una sola línea por ítem, con la cantidad total.`
      );
    }
    vistos.add(codigo);

    const cantidad = Number(renglon?.cantidad);

    if (!Number.isInteger(cantidad)) {
      throw datoInvalido(`La cantidad de "${codigo}" tiene que ser un número entero.`);
    }

    if (cantidad <= 0) {
      throw datoInvalido(`La cantidad de "${codigo}" tiene que ser mayor que cero.`);
    }

    return { codigo, cantidad };
  });
}

/**
 * Que todos los codigos esten en el catalogo. Se revisa antes de llamar a la
 * funcion para poder nombrar todos los que faltan de una sola vez, en lugar de
 * ir de a uno.
 */
async function verificarItems(items) {
  const codigos = items.map((renglon) => renglon.codigo);

  const enCatalogo = await detallesDeItems(codigos);
  const faltan = codigos.filter((codigo) => !enCatalogo.has(codigo));

  if (faltan.length > 0) {
    throw datoInvalido(
      `${faltan.length === 1 ? 'El código' : 'Los códigos'} ${faltan
        .map((codigo) => `"${codigo}"`)
        .join(', ')} no ${faltan.length === 1 ? 'está' : 'están'} en el catálogo del depósito. ` +
        'Hay que darlo de alta antes de cargar el remito.'
    );
  }
}

/** Los remitos, del mas nuevo al mas viejo por fecha de recepcion. */
export async function obtenerTodos(filtros = {}) {
  let consulta = supabase
    .from('remito')
    .select(COLUMNAS)
    .order('remito_fecha_recepcion', { ascending: false })
    .order('remito_id', { ascending: false })
    // Los renglones vienen sin orden garantizado: se ordenan por codigo para
    // que el remito se lea siempre igual.
    .order('inventarioitemcod', { referencedTable: 'remito_item' });

  if (filtros.desde) consulta = consulta.gte('remito_fecha_recepcion', filtros.desde);
  if (filtros.hasta) consulta = consulta.lte('remito_fecha_recepcion', filtros.hasta);

  const { data, error } = await consulta;
  if (error) throw errorDeBase(error, 'del remito');

  const detalles = await detallesDeItems([
    ...new Set(data.flatMap((fila) => (fila.remito_item ?? []).map((renglon) => renglon.inventarioitemcod))),
  ]);

  return data.map((fila) => aRemito(fila, detalles));
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('remito')
    .select(COLUMNAS)
    .eq('remito_id', id)
    .order('inventarioitemcod', { referencedTable: 'remito_item' })
    .maybeSingle();

  if (error) throw errorDeBase(error, 'del remito');
  if (!data) throw noEncontrado(`No existe el remito ${id}.`);

  const detalles = await detallesDeItems((data.remito_item ?? []).map((renglon) => renglon.inventarioitemcod));

  return aRemito(data, detalles);
}

/**
 * Registra el remito y actualiza el stock.
 *
 * @param {object} datos
 * @param {string} datos.proveedor
 * @param {string} datos.fechaRecepcion  - "2026-09-28"
 * @param {Array}  datos.items           - [{ codigo, cantidad }]
 * @param {string} datos.numero         - "0001-00012345"
 * @param {string} [datos.observaciones]
 */
export async function crear(datos) {
  const proveedor = texto(datos?.proveedor);
  const fechaRecepcion = texto(datos?.fechaRecepcion);

  if (!proveedor) {
    throw datoInvalido('Hay que indicar el proveedor que entregó la mercadería.');
  }

  if (!fechaRecepcion) {
    throw datoInvalido('Hay que indicar la fecha de recepción del remito.');
  }

  if (Number.isNaN(Date.parse(fechaRecepcion))) {
    throw datoInvalido(`"${fechaRecepcion}" no es una fecha válida.`);
  }

  if (fechaRecepcion.slice(0, 10) > hoy()) {
    throw datoInvalido('La fecha de recepción no puede ser posterior a hoy.');
  }

  // Obligatorio y como el del papel: "0001-00012345", sólo números y guion, hasta 13.
  const numero = texto(datos?.numero);
  if (!numero) {
    throw datoInvalido('Hay que indicar el número de remito.');
  }

  if (!/^[0-9-]{1,13}$/.test(numero)) {
    throw datoInvalido('El número de remito lleva sólo números y guion, hasta 13 caracteres.');
  }

  const items = leerItems(datos?.items);
  await verificarItems(items);

  const { data, error } = await supabase.rpc('registrar_remito', {
    p_proveedor: proveedor,
    p_fecha_recepcion: fechaRecepcion.slice(0, 10),
    p_items: items,
    p_num: numero,
    p_obs: texto(datos?.observaciones),
    // Todavia no hay login: cuando lo haya, aca va el usuario de la sesion.
    p_usuario: null,
  });

  if (error) {
    /*
     * P0001 es lo que devuelve Postgres cuando la funcion corta con RAISE
     * EXCEPTION. Esos mensajes ya estan escritos para que los lea el
     * administrador, asi que se pasan tal cual.
     */
    if (error.code === 'P0001') {
      throw datoInvalido(error.message);
    }

    throw errorDeBase(error, 'del remito');
  }

  return obtenerPorId(data);
}
