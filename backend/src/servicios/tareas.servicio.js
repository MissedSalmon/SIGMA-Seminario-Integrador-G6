/**
 * Las tareas del tecnico con la sesion activa (HU-21).
 *
 * Un tecnico ve SOLO las tareas que le asignaron: la consulta parte de
 * `tecnico_asignado_tarea_ot` filtrada por su legajo, y el legajo sale de la
 * sesion (lo pone el controlador), nunca de la direccion. Asi no hay forma de
 * pedir las de otro.
 *
 * De cada tarea se trae lo que el tecnico necesita para ir a hacerla: que hay
 * que hacer, sobre que activo, donde esta (edificio y espacio) y a que OT
 * pertenece. El activo cuelga del ticket o del mantenimiento preventivo que
 * origino la OT, igual que en ordenesTrabajo.servicio.js.
 *
 * DECISIONES (10/10/2026, ver .claude/contexto/dominio.md):
 *   - "Pendiente" para el aviso es toda tarea que todavia no termino: la que
 *     no esta Finalizada ni Cancelada. El aviso cuenta todas, sin mirar los
 *     filtros, porque dice cuanto trabajo le queda al tecnico.
 *   - Una asignacion Cancelada ya no es del tecnico: no se muestra.
 *   - La fecha que se filtra es la prevista de inicio (tarea_fecha_ini). Una
 *     tarea sin fecha prevista no entra cuando se filtra por fecha.
 */
import { supabase } from '../config/supabase.js';
import { conflicto, datoInvalido, errorDeBase, noEncontrado } from '../utiles/errores.js';
import {
  ENUM_ESTADO_ACTIVO,
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_OT,
  ENUM_ESTADO_TAREA,
  ENUM_ESTADO_TICKET,
  ENUM_PRIORIDAD,
} from '../utiles/enumerados.js';
import * as inventario from './inventario.servicio.js';
import { observacionesDeLaTarea } from './observaciones.servicio.js';

/** De mas urgente a menos: con este orden se ofrecen en el filtro. */
export const PRIORIDADES = ENUM_PRIORIDAD.textos;

/** Una tarea en estos estados ya no es trabajo pendiente. */
const ESTADOS_TERMINADOS = ['Finalizada', 'Cancelada'];

const ASIGNACION_CANCELADA = ENUM_ESTADO_ASIGNACION_TECNICO.codigo('Cancelada');

/** Errores de la base cuando una columna no existe (42703 al leer, PGRST204 al escribir). */
const FALTA_COLUMNA = ['42703', 'PGRST204'];

/** El activo y donde esta. Se repite para el ticket y para el preventivo. */
const ACTIVO = `
  activo (
    activo_codigo,
    activo_desc,
    tipo_activo ( tipo_activo_nom ),
    espacio (
      espacio_num,
      espacio_piso,
      tipo_espacio ( tipo_espacio_nom ),
      edificio ( edificio_nom )
    )
  )
`;

const COLUMNAS = `
  ot_id,
  tarea_id,
  tec_asig_estado,
  tarea_ot!inner (
    tarea_id,
    tarea_desc,
    tarea_estado,
    tarea_prioridad,
    tarea_fecha_ini,
    tarea_fecha_fin,
    orden_trabajo (
      ot_id,
      ot_desc,
      ot_estado,
      ticket ( ticket_id, ${ACTIVO} ),
      mantenimiento_preventivo ( mant_prev_id, ${ACTIVO} )
    )
  )
`;

/**
 * El dia de una fecha, sin la hora: de "2026-09-22T00:00:00+00:00" sale
 * "2026-09-22". Asi dos fechas se comparan como texto, sin que la zona horaria
 * corra el dia.
 */
function soloElDia(valor) {
  return valor ? String(valor).slice(0, 10) : null;
}

function aTarea(fila) {
  const tarea = fila.tarea_ot;
  const orden = tarea.orden_trabajo ?? null;
  const activo = orden?.ticket?.activo ?? orden?.mantenimiento_preventivo?.activo ?? null;
  const espacio = activo?.espacio ?? null;
  const estado = ENUM_ESTADO_TAREA.texto(tarea.tarea_estado) ?? 'Creada';

  return {
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    descripcion: tarea.tarea_desc,
    estado,
    pendiente: !ESTADOS_TERMINADOS.includes(estado),
    prioridad: ENUM_PRIORIDAD.texto(tarea.tarea_prioridad) ?? 'Media',
    fechaPrevista: soloElDia(tarea.tarea_fecha_ini),
    fechaFinPrevista: soloElDia(tarea.tarea_fecha_fin),
    codigoActivo: activo?.activo_codigo ?? null,
    activo: activo
      ? {
          codigo: activo.activo_codigo,
          descripcion: activo.activo_desc ?? null,
          nombreTipo: activo.tipo_activo?.tipo_activo_nom ?? '',
        }
      : null,
    ubicacion: espacio
      ? {
          edificio: espacio.edificio?.edificio_nom ?? '',
          espacio: espacio.tipo_espacio
            ? `${espacio.tipo_espacio.tipo_espacio_nom} ${espacio.espacio_num}`
            : `Espacio ${espacio.espacio_num}`,
          piso: espacio.espacio_piso ?? null,
        }
      : null,
    ot: orden
      ? {
          id: orden.ot_id,
          descripcion: orden.ot_desc,
          estado: ENUM_ESTADO_OT.texto(orden.ot_estado),
          origen: orden.ticket ? 'Ticket' : 'Mantenimiento preventivo',
        }
      : null,
  };
}

/**
 * El orden por defecto (22/10/2026): cronologico de creacion, de la mas vieja
 * a la mas nueva. Antes era por prioridad y fecha prevista.
 *
 * La tarea no guarda cuando se creo, pero se puede reconstruir: el numero de
 * OT crece con cada OT nueva, y dentro de la OT el numero de tarea crece con
 * cada tarea que se le carga. Ordenar por los dos es ordenar por creacion
 * (salvo una tarea agregada tarde a una OT vieja, que queda con su OT).
 */
function compararTareas(una, otra) {
  return una.idOt - otra.idOt || una.idTarea - otra.idTarea;
}

/** Si la tarea cumple con los filtros. Todos juntos (AND). */
function cumpleFiltros(tarea, { soloPendientes, prioridad, desde, hasta }) {
  if (soloPendientes && !tarea.pendiente) return false;
  if (prioridad && tarea.prioridad !== prioridad) return false;
  if ((desde || hasta) && !tarea.fechaPrevista) return false;
  if (desde && tarea.fechaPrevista < desde) return false;
  if (hasta && tarea.fechaPrevista > hasta) return false;
  return true;
}

/** Las asignaciones vigentes del tecnico, sin filtrar. */
function consultarAsignaciones(legajo) {
  return supabase
    .from('tecnico_asignado_tarea_ot')
    .select(COLUMNAS)
    .eq('tecnico_legajo', legajo)
    .neq('tec_asig_estado', ASIGNACION_CANCELADA);
}

/**
 * Las tareas del tecnico, ya ordenadas, y cuantas le quedan pendientes.
 *
 * @param {string} legajo - el del tecnico con la sesion activa
 * @param {object} [filtros]
 * @param {boolean} [filtros.soloPendientes] - sin las Finalizadas ni Canceladas
 * @param {string} [filtros.prioridad] - "Alta" | "Media" | "Baja"
 * @param {string} [filtros.desde]     - "2026-10-01": fecha prevista desde (inclusive)
 * @param {string} [filtros.hasta]     - "2026-10-31": fecha prevista hasta (inclusive)
 * @returns {Promise<{ tareas: object[], pendientes: number }>}
 */
export async function obtenerDelTecnico(legajo, filtros = {}) {
  const { data, error } = await consultarAsignaciones(legajo);
  if (error) throw errorDeBase(error, 'de las tareas');

  const todas = (data ?? []).map(aTarea);

  return {
    tareas: todas.filter((tarea) => cumpleFiltros(tarea, filtros)).sort(compararTareas),
    pendientes: todas.filter((tarea) => tarea.pendiente).length,
  };
}

/** Los materiales que ya se registraron en la tarea, del mas nuevo al mas viejo. */
async function materialesDeLaTarea(idOt, idTarea) {
  const { data, error } = await supabase
    .from('tarea_ot_consume_material')
    .select('mat_cod, tamat_cant, tamat_fecha_cons, material ( mat_nom )')
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .order('tamat_fecha_cons', { ascending: false });

  if (error) throw errorDeBase(error, 'de los materiales de la tarea');

  return (data ?? []).map((fila) => ({
    codigo: fila.mat_cod,
    nombre: fila.material?.mat_nom ?? fila.mat_cod,
    cantidad: Number(fila.tamat_cant),
    fecha: fila.tamat_fecha_cons,
  }));
}

/**
 * Una tarea del tecnico, con los materiales que ya se usaron en ella. Si la
 * tarea existe pero es de otro, se responde igual que si no existiera: no se
 * le dice al tecnico que hay una tarea ajena ahi.
 */
export async function obtenerUnaDelTecnico(legajo, idOt, idTarea) {
  const { data, error } = await consultarAsignaciones(legajo)
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .maybeSingle();

  if (error) throw errorDeBase(error, 'de las tareas');
  if (!data) throw noEncontrado(`No tenés asignada la tarea ${idTarea} de la orden de trabajo ${idOt}.`);

  return {
    ...aTarea(data),
    materiales: await materialesDeLaTarea(idOt, idTarea),
    observaciones: await observacionesDeLaTarea(idOt, idTarea),
  };
}

/* ======================================================================
 * Ejecutar la tarea (HU-22) y el cierre automatico (HU-26)
 * ====================================================================== */

/** Una tarea en estos estados todavia no empezo: se puede iniciar. */
const ESTADOS_SIN_EMPEZAR = ['Creada', 'Asignada', 'Pendiente'];

/** Una OT en estos estados ya no se trabaja. */
const ESTADOS_OT_CERRADOS = ['Finalizada', 'Cancelada'];

const codigosTarea = (estados) => estados.map((estado) => ENUM_ESTADO_TAREA.codigo(estado));
const codigosOt = (estados) => estados.map((estado) => ENUM_ESTADO_OT.codigo(estado));
const codigosTicket = (estados) => estados.map((estado) => ENUM_ESTADO_TICKET.codigo(estado));

/** La OT con el codigo del activo, salga de un ticket o de un preventivo. */
async function ordenConActivo(idOt) {
  const { data, error } = await supabase
    .from('orden_trabajo')
    .select('ot_id, ot_estado, ticket_id, ticket ( activo_codigo ), mantenimiento_preventivo ( activo_codigo )')
    .eq('ot_id', idOt)
    .maybeSingle();

  if (error) throw errorDeBase(error, 'de la orden de trabajo');
  if (!data) throw noEncontrado(`No existe la orden de trabajo ${idOt}.`);

  return {
    idOt: data.ot_id,
    idTicket: data.ticket_id,
    codigoActivo: data.ticket?.activo_codigo ?? data.mantenimiento_preventivo?.activo_codigo ?? null,
  };
}

/** Cambia el estado de la asignacion del tecnico a esa tarea. */
async function cambiarAsignacion(legajo, idOt, idTarea, estado) {
  const { error } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .update({ tec_asig_estado: ENUM_ESTADO_ASIGNACION_TECNICO.codigo(estado) })
    .eq('tecnico_legajo', legajo)
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea);

  if (error) throw errorDeBase(error, 'de la asignación');
}

/**
 * Pasa la tarea de un estado a otro, solo si sigue en alguno de `desde`. Si
 * otro pedido la cambio en el medio, no se pisa: se avisa.
 */
async function cambiarEstadoTarea(idOt, idTarea, desde, hacia) {
  const { data, error } = await supabase
    .from('tarea_ot')
    .update({ tarea_estado: ENUM_ESTADO_TAREA.codigo(hacia) })
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .in('tarea_estado', codigosTarea(desde))
    .select('tarea_id');

  if (error) throw errorDeBase(error, 'de la tarea');
  if (!data || data.length === 0) {
    throw conflicto('La tarea cambió de estado mientras tanto. Volvé a abrirla para ver cómo quedó.');
  }
}

/**
 * Si el activo tiene OTRA orden de trabajo en ejecucion. Hace falta para no
 * devolverlo a Operativo mientras todavia lo estan arreglando por otra OT.
 */
async function activoSigueEnMantenimiento(codigoActivo, idOtQueTermina) {
  const enEjecucion = ENUM_ESTADO_OT.codigo('En ejecución');

  const [porTicket, porPreventivo] = await Promise.all([
    supabase
      .from('orden_trabajo')
      .select('ot_id, ticket!inner ( activo_codigo )')
      .eq('ot_estado', enEjecucion)
      .eq('ticket.activo_codigo', codigoActivo)
      .neq('ot_id', idOtQueTermina),
    supabase
      .from('orden_trabajo')
      .select('ot_id, mantenimiento_preventivo!inner ( activo_codigo )')
      .eq('ot_estado', enEjecucion)
      .eq('mantenimiento_preventivo.activo_codigo', codigoActivo)
      .neq('ot_id', idOtQueTermina),
  ]);

  if (porTicket.error) throw errorDeBase(porTicket.error, 'de las órdenes de trabajo');
  if (porPreventivo.error) throw errorDeBase(porPreventivo.error, 'de las órdenes de trabajo');

  return (porTicket.data ?? []).length + (porPreventivo.data ?? []).length > 0;
}

/**
 * El tecnico empieza la tarea (HU-22). Arrastra lo que corresponde:
 *
 *   tarea                Creada/Asignada/Pendiente -> En ejecución
 *   su asignacion        -> En curso
 *   la OT                Creada/Asignada -> En ejecución
 *   el ticket            Validado/Asignado -> En ejecución
 *   el activo            -> En mantenimiento (salvo que este Retirado)
 *
 * Cada paso solo avanza: si la OT o el ticket ya estaban mas adelante (otra
 * tarea los movio antes), no se los toca.
 */
export async function iniciarTarea(legajo, idOt, idTarea) {
  const tarea = await obtenerUnaDelTecnico(legajo, idOt, idTarea);

  if (tarea.ot && ESTADOS_OT_CERRADOS.includes(tarea.ot.estado)) {
    throw conflicto(`La orden de trabajo #${idOt} está ${tarea.ot.estado.toLowerCase()}: ya no se trabaja.`);
  }
  if (tarea.estado === 'En ejecución') throw conflicto('La tarea ya está en ejecución.');
  if (!ESTADOS_SIN_EMPEZAR.includes(tarea.estado)) {
    throw conflicto(`La tarea está ${tarea.estado.toLowerCase()}: ya no se puede iniciar.`);
  }

  // Regla C6 / D2: Requisito excluyente para tareas preventivas
  // Debe tener técnico asignado y haber llegado su fecha programada.
  if (tarea.ot?.origen === 'Mantenimiento preventivo') {
    if (!legajo) {
      throw conflicto('La tarea preventiva debe tener un técnico autorizado asignado para poder iniciarse.');
    }
    if (!tarea.fechaPrevista) {
      throw conflicto('La tarea preventiva requiere tener una fecha programada para poder iniciarse.');
    }
    const hoy = new Date().toISOString().slice(0, 10);
    if (tarea.fechaPrevista > hoy) {
      throw conflicto(
        `La tarea preventiva está programada para el ${tarea.fechaPrevista} y no puede iniciarse antes de esa fecha.`
      );
    }
  }

  await cambiarEstadoTarea(idOt, idTarea, ESTADOS_SIN_EMPEZAR, 'En ejecución');
  await cambiarAsignacion(legajo, idOt, idTarea, 'En curso');

  const orden = await ordenConActivo(idOt);

  const { error: errorOrden } = await supabase
    .from('orden_trabajo')
    .update({ ot_estado: ENUM_ESTADO_OT.codigo('En ejecución') })
    .eq('ot_id', idOt)
    .in('ot_estado', codigosOt(['Creada', 'Asignada']));
  if (errorOrden) throw errorDeBase(errorOrden, 'de la orden de trabajo');

  if (orden.idTicket) {
    const { error } = await supabase
      .from('ticket')
      .update({ ticket_estado: ENUM_ESTADO_TICKET.codigo('En ejecución') })
      .eq('ticket_id', orden.idTicket)
      .in('ticket_estado', codigosTicket(['Validado', 'Asignado']));
    if (error) throw errorDeBase(error, 'del ticket');
  }

  if (orden.codigoActivo) {
    const { error } = await supabase
      .from('activo')
      .update({ activo_estado: ENUM_ESTADO_ACTIVO.codigo('En mantenimiento') })
      .eq('activo_codigo', orden.codigoActivo)
      .neq('activo_estado', ENUM_ESTADO_ACTIVO.codigo('Retirado'));
    if (error) throw errorDeBase(error, 'del activo');
  }

  return obtenerUnaDelTecnico(legajo, idOt, idTarea);
}

/**
 * Si ya no le queda ninguna tarea por hacer, la OT se finaliza sola (HU-26):
 *
 *   la OT                -> Finalizada, con su fecha de cierre
 *   el ticket            -> Cerrado, con su fecha de cierre
 *   el activo            -> Operativo (salvo Retirado, o que otra OT lo siga arreglando)
 *
 * "No le queda nada" es que todas sus tareas esten Finalizadas o Canceladas, y
 * al menos una Finalizada: una OT con todo cancelado no se trabajo.
 *
 * Devuelve true si la cerro.
 */
async function finalizarOrdenSiTermino(idOt) {
  const { data: tareas, error: errorTareas } = await supabase
    .from('tarea_ot')
    .select('tarea_estado')
    .eq('ot_id', idOt);
  if (errorTareas) throw errorDeBase(errorTareas, 'de las tareas');

  const estados = (tareas ?? []).map((fila) => ENUM_ESTADO_TAREA.texto(fila.tarea_estado));
  const termino =
    estados.length > 0 &&
    estados.every((estado) => ['Finalizada', 'Cancelada'].includes(estado)) &&
    estados.includes('Finalizada');
  if (!termino) return false;

  const ahora = new Date().toISOString();

  // Solo si la OT no estaba ya cerrada: si dos tecnicos terminan a la vez, la
  // cierra uno solo.
  const { data: cerrada, error: errorOrden } = await supabase
    .from('orden_trabajo')
    .update({ ot_estado: ENUM_ESTADO_OT.codigo('Finalizada'), ot_fecha_cierre: ahora })
    .eq('ot_id', idOt)
    .not('ot_estado', 'in', `(${codigosOt(ESTADOS_OT_CERRADOS).join(',')})`)
    .select('ot_id');
  if (errorOrden) throw errorDeBase(errorOrden, 'de la orden de trabajo');
  if (!cerrada || cerrada.length === 0) return false;

  const orden = await ordenConActivo(idOt);

  if (orden.idTicket) {
    const { error } = await supabase
      .from('ticket')
      .update({ ticket_estado: ENUM_ESTADO_TICKET.codigo('Cerrado'), ticket_fecha_cierre: ahora })
      .eq('ticket_id', orden.idTicket)
      .neq('ticket_estado', ENUM_ESTADO_TICKET.codigo('Rechazado'));
    if (error) throw errorDeBase(error, 'del ticket');
  }

  if (orden.codigoActivo && !(await activoSigueEnMantenimiento(orden.codigoActivo, idOt))) {
    const { error } = await supabase
      .from('activo')
      .update({ activo_estado: ENUM_ESTADO_ACTIVO.codigo('Operativo') })
      .eq('activo_codigo', orden.codigoActivo)
      .neq('activo_estado', ENUM_ESTADO_ACTIVO.codigo('Retirado'));
    if (error) throw errorDeBase(error, 'del activo');
  }

  return true;
}

/**
 * El tecnico termina la tarea (HU-22): pasa a Finalizada y su asignacion
 * tambien. Si era la ultima de la OT, la OT se cierra sola (HU-26).
 *
 * Devuelve la tarea y si con ella se cerro la OT, para avisarle al tecnico.
 */
export async function finalizarTarea(legajo, idOt, idTarea) {
  const tarea = await obtenerUnaDelTecnico(legajo, idOt, idTarea);

  if (ESTADOS_SIN_EMPEZAR.includes(tarea.estado)) {
    throw conflicto('La tarea todavía no empezó: primero hay que iniciarla.');
  }
  if (tarea.estado !== 'En ejecución') {
    throw conflicto(`La tarea ya está ${tarea.estado.toLowerCase()}.`);
  }

  await cambiarEstadoTarea(idOt, idTarea, ['En ejecución'], 'Finalizada');
  await cambiarAsignacion(legajo, idOt, idTarea, 'Finalizada');

  const ordenFinalizada = await finalizarOrdenSiTermino(idOt);

  return { tarea: await obtenerUnaDelTecnico(legajo, idOt, idTarea), ordenFinalizada };
}

/* ---------------------------------------------------------------- Materiales */

/** Los materiales del deposito con su stock, para elegir cuales se usaron. */
export async function listarMateriales() {
  const materiales = await inventario.obtenerItems('Material');

  return materiales.map((material) => ({
    codigo: material.codigo,
    nombre: material.nombre,
    stock: material.stockActual,
  }));
}

/**
 * Registra los materiales usados en la tarea y descuenta el stock (HU-22).
 *
 * El trabajo lo hace la funcion registrar_consumo_tarea de la base, todo o
 * nada: si a un material no le alcanza el stock, no se registra ninguno. Aca se
 * revisa antes lo que se puede revisar sin la base, para dar un mensaje claro.
 *
 * @param {Array<{ codigo: string, cantidad: number }>} items
 */
export async function registrarMateriales(legajo, idOt, idTarea, items) {
  const tarea = await obtenerUnaDelTecnico(legajo, idOt, idTarea);
  if (tarea.estado !== 'En ejecución') {
    throw conflicto('Los materiales se registran mientras la tarea está en ejecución.');
  }

  if (!Array.isArray(items) || items.length === 0) {
    throw datoInvalido('Hay que cargar al menos un material.');
  }

  const limpios = items.map((item) => ({
    codigo: typeof item?.codigo === 'string' ? item.codigo.trim() : '',
    cantidad: Number(item?.cantidad),
  }));

  for (const item of limpios) {
    if (!item.codigo) throw datoInvalido('Hay un renglón sin material elegido.');
    if (!Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw datoInvalido(`La cantidad de "${item.codigo}" tiene que ser un número entero mayor que cero.`);
    }
  }

  if (new Set(limpios.map((item) => item.codigo)).size !== limpios.length) {
    throw datoInvalido('Hay un material repetido. Cargá una sola línea por material, con la cantidad total.');
  }

  const { error } = await supabase.rpc('registrar_consumo_tarea', {
    p_ot_id: idOt,
    p_tarea_id: idTarea,
    p_items: limpios,
    p_usuario: legajo,
  });

  if (error) {
    // P0001: un RAISE EXCEPTION de la funcion (sin stock, tarea no en ejecucion...).
    if (error.code === 'P0001') throw conflicto(error.message);
    throw errorDeBase(error, 'de la ejecución de tareas');
  }

  return obtenerUnaDelTecnico(legajo, idOt, idTarea);
}

/* ------------------------------------------------------------- Herramientas */

/**
 * Las herramientas que el tecnico tiene a su nombre y las que estan
 * disponibles para tomar. Una herramienta en uso por otro tecnico, o fuera
 * de servicio, no aparece.
 */
export async function listarHerramientas(legajo) {
  const herramientas = await inventario.obtenerItems('Herramienta');

  const resumen = (herramienta) => ({
    codigo: herramienta.codigo,
    nombre: herramienta.nombre,
    desde: herramienta.asignadaDesde,
  });

  return {
    mias: herramientas.filter((herramienta) => herramienta.legajoTecnico === legajo).map(resumen),
    disponibles: herramientas.filter((herramienta) => herramienta.estado === 'Disponible').map(resumen),
  };
}

/**
 * El tecnico toma una herramienta para la tarea que esta haciendo (HU-22):
 * queda En uso a su nombre hasta que la devuelve. Es la misma asignacion que
 * hace el administrador desde el deposito.
 */
export async function tomarHerramienta(legajo, idOt, idTarea, codigo) {
  const tarea = await obtenerUnaDelTecnico(legajo, idOt, idTarea);
  if (tarea.estado !== 'En ejecución') {
    throw conflicto('Las herramientas se toman mientras la tarea está en ejecución.');
  }

  const limpio = typeof codigo === 'string' ? codigo.trim() : '';
  if (!limpio) throw datoInvalido('Hay que elegir la herramienta.');

  await inventario.asignarHerramienta(limpio, { legajo, idOt, idTarea });
  return listarHerramientas(legajo);
}

/* ---------------------------------------------------------------- Historial */

/**
 * Los materiales usados en las tareas del tecnico, del mas nuevo al mas viejo.
 * Una fila por tarea y material (si se registro dos veces, ya viene sumado).
 *
 * El consumo se guarda por tarea, no por tecnico: por eso primero se buscan
 * sus tareas (todas las que tuvo asignadas) y despues lo que se uso en ellas.
 */
export async function historialMateriales(legajo) {
  const { data: asignaciones, error: errorAsignaciones } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select('ot_id, tarea_id')
    .eq('tecnico_legajo', legajo);
  if (errorAsignaciones) throw errorDeBase(errorAsignaciones, 'de las tareas');

  if (!asignaciones || asignaciones.length === 0) return [];

  const mias = new Set(asignaciones.map((fila) => `${fila.ot_id}-${fila.tarea_id}`));
  const ordenes = [...new Set(asignaciones.map((fila) => fila.ot_id))];

  const { data, error } = await supabase
    .from('tarea_ot_consume_material')
    .select('ot_id, tarea_id, mat_cod, tamat_cant, tamat_fecha_cons, material ( mat_nom ), tarea_ot ( tarea_desc )')
    .in('ot_id', ordenes)
    .order('tamat_fecha_cons', { ascending: false });
  if (error) throw errorDeBase(error, 'de los materiales usados');

  return (data ?? [])
    .filter((fila) => mias.has(`${fila.ot_id}-${fila.tarea_id}`))
    .map((fila) => ({
      fecha: fila.tamat_fecha_cons,
      codigo: fila.mat_cod,
      nombre: fila.material?.mat_nom ?? fila.mat_cod,
      cantidad: Number(fila.tamat_cant),
      idOt: fila.ot_id,
      idTarea: fila.tarea_id,
      tarea: fila.tarea_ot?.tarea_desc ?? '',
    }));
}

/**
 * Todas las herramientas que tuvo el tecnico, de la mas nueva a la mas vieja:
 * las que tiene ahora (sin devolucion) y las que ya devolvio.
 *
 * Si la tomo desde una tarea, viene la OT y la tarea. Las que le asigno el
 * administrador desde el deposito, y las de antes del 22/10/2026, no la tienen.
 */
export async function historialHerramientas(legajo) {
  const consultar = (columnas) =>
    supabase
      .from('tecnico_utiliza_herramienta')
      .select(columnas)
      .eq('tecnico_legajo', legajo)
      .order('tec_herr_fecha_prest', { ascending: false });

  let { data, error } = await consultar(
    'herr_cod, tec_herr_fecha_prest, tec_herr_fecha_dev, ot_id, tarea_id, herramienta ( herr_nom )'
  );

  // Si la base todavia no tiene la migracion 20261022120000 (falta ot_id), se
  // muestra el historial igual, sin la OT, en vez de romper la pantalla.
  if (error && FALTA_COLUMNA.includes(error.code)) {
    ({ data, error } = await consultar('herr_cod, tec_herr_fecha_prest, tec_herr_fecha_dev, herramienta ( herr_nom )'));
  }
  if (error) throw errorDeBase(error, 'de las herramientas');

  return (data ?? []).map((fila) => ({
    codigo: fila.herr_cod,
    nombre: fila.herramienta?.herr_nom ?? fila.herr_cod,
    desde: fila.tec_herr_fecha_prest,
    hasta: fila.tec_herr_fecha_dev ?? null,
    enUso: !fila.tec_herr_fecha_dev,
    idOt: fila.ot_id ?? null,
    idTarea: fila.tarea_id ?? null,
  }));
}

/** El tecnico devuelve una herramienta. Solo puede devolver las suyas. */
export async function devolverHerramienta(legajo, codigo) {
  const herramienta = await inventario.obtenerItem(codigo);

  if (herramienta.clase !== 'Herramienta') throw datoInvalido(`"${codigo}" no es una herramienta.`);
  if (herramienta.legajoTecnico !== legajo) {
    throw conflicto(`"${herramienta.nombre}" no está a tu nombre: no la podés devolver vos.`);
  }

  await inventario.devolverHerramienta(codigo);
  return listarHerramientas(legajo);
}
