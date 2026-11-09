/**
 * Programación de los planes preventivos por activo y generación de sus OT
 * (correcciones del Sprint 5, 03/11/2026).
 *
 * El plan sólo dice cada cuánto. Cada activo del tipo del plan lleva su propio
 * ciclo, así las OT no salen todas juntas:
 *
 *   sin OT previa   -> la alta del activo + periodicidad (la alta del plan no cuenta)
 *   con OT previa   -> el cierre de la última OT finalizada del par, + periodicidad
 *   OT cancelada    -> cuenta como ciclo salteado: se suma desde su fecha programada
 *   OT abierta      -> no hay próxima hasta que se cierre
 *   fecha ya pasada -> sólo el último vencimiento atrasado: una OT, no una por ciclo
 *
 * La OT se genera el día anterior a la fecha (04/11/2026), con las tareas del
 * plan sin responsable y en estado "Creada": los técnicos se asignan después,
 * como en cualquier OT.
 */
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { errorDeBase } from '../utiles/errores.js';
import { ENUM_ESTADO_ACTIVO, ENUM_ESTADO_OT, ENUM_ESTADO_TAREA, ENUM_PRIORIDAD } from '../utiles/enumerados.js';
import { diasEntre, hoyArgentina, soloDia, sumarDias, sumarPeriodo } from '../utiles/periodicidad.js';

const ESTADOS_OT_ABIERTOS = ['Creada', 'Asignada', 'En ejecución'];

// Asignaciones que todavía le dan trabajo al técnico.
const ASIGNACIONES_PENDIENTES = ['Pendiente', 'Asignada', 'En curso'];

// El índice uq_orden_trabajo_ciclo_preventivo rechazó la OT: ese ciclo ya estaba generado.
const VIOLA_UNICIDAD = '23505';

/* ------------------------------------------------------------------ *
 *  Reglas puras (sin base): se prueban solas
 * ------------------------------------------------------------------ */

/**
 * La próxima fecha de mantenimiento de un activo para un plan.
 *
 * @param {object}   datos
 * @param {string}   datos.altaActivo  - "2026-06-13" (o con hora)
 * @param {object[]} datos.ordenes     - OT del par: { id, estado, fechaProgramada, fechaAlta, fechaCierre }
 * @param {number}   datos.intervalo
 * @param {string}   datos.unidad      - dias | semanas | meses | anios
 * @param {string}   [datos.hoy]       - por defecto, hoy en Argentina
 * @returns {{ fecha: string|null, ultimaRealizada: string|null, otAbierta: object|null }}
 */
export function proximoMantenimiento({ altaActivo, ordenes = [], intervalo, unidad, hoy = hoyArgentina() }) {
  const finalizadas = ordenes.filter((ot) => ot.estado === 'Finalizada' && ot.fechaCierre);
  const ultimaRealizada = finalizadas.map((ot) => soloDia(ot.fechaCierre)).sort().at(-1) ?? null;

  const otAbierta = ordenes.find((ot) => ESTADOS_OT_ABIERTOS.includes(ot.estado)) ?? null;
  if (otAbierta) return { fecha: null, ultimaRealizada, otAbierta };

  const salteadas = ordenes
    .filter((ot) => ot.estado === 'Cancelada')
    .map((ot) => ot.fechaProgramada ?? soloDia(ot.fechaAlta))
    .filter(Boolean);

  const desdeOrdenes = [ultimaRealizada, ...salteadas].filter(Boolean).sort().at(-1);
  const base = desdeOrdenes ?? soloDia(altaActivo);

  return {
    fecha: base ? vencimientoPendiente(base, intervalo, unidad, soloDia(hoy)) : null,
    ultimaRealizada,
    otAbierta: null,
  };
}

/**
 * La base más un período. Si ya pasó (un activo dado de alta hace dos años con
 * un plan trimestral), no se arrastran todos los atrasados: queda sólo el último
 * vencimiento del ciclo que ya llegó, y de ahí sale una única OT.
 *
 * Se suma siempre desde la base (+ 3, + 6, + 9 meses...) y no desde el
 * vencimiento anterior, para que un 31/08 no quede corrido al 28 para siempre.
 */
function vencimientoPendiente(base, intervalo, unidad, hoy) {
  let vueltas = 1;
  let fecha = sumarPeriodo(base, intervalo, unidad);
  for (;;) {
    const siguiente = sumarPeriodo(base, intervalo * (vueltas + 1), unidad);
    if (siguiente > hoy) return fecha;
    vueltas++;
    fecha = siguiente;
  }
}

/* ------------------------------------------------------------------ *
 *  Lectura de la base
 * ------------------------------------------------------------------ */

const SELECT_PLAN = `
  mant_prev_id,
  mant_prev_nom,
  activo_codigo,
  tipo_activo_id,
  mant_prev_intervalo,
  mant_prev_unidad_frec,
  mant_prev_fecha_alta,
  mant_prev_activo,
  mant_prev_tarea (
    plantilla_de_tarea ( tarea_plan_id, tarea_plan_nom, tarea_plan_desc, especialidad_id )
  )
`;

function aPlan(fila) {
  return {
    id: fila.mant_prev_id,
    nombre: fila.mant_prev_nom,
    activoCodigo: fila.activo_codigo ?? null,
    idTipoActivo: fila.tipo_activo_id,
    intervalo: fila.mant_prev_intervalo ?? 1,
    unidad: fila.mant_prev_unidad_frec ?? 'meses',
    fechaAlta: soloDia(fila.mant_prev_fecha_alta),
    activo: fila.mant_prev_activo !== false,
    tareas: (fila.mant_prev_tarea ?? [])
      .map((item) => item.plantilla_de_tarea)
      .filter(Boolean)
      .map((p) => ({
        id: p.tarea_plan_id,
        nombre: p.tarea_plan_nom,
        descripcion: p.tarea_plan_desc ?? null,
        idEspecialidad: p.especialidad_id ?? null,
      })),
  };
}

/**
 * Planes, activos y OT preventivas que hacen falta para calcular la
 * programación, en cuatro consultas en total.
 */
async function leerDatos({ idPlan = null, codigoActivo = null, incluirInactivos = false } = {}) {
  let consultaPlanes = supabase.from('mantenimiento_preventivo').select(SELECT_PLAN);
  if (idPlan) consultaPlanes = consultaPlanes.eq('mant_prev_id', idPlan);
  if (!incluirInactivos) consultaPlanes = consultaPlanes.eq('mant_prev_activo', true);

  const { data: filasPlanes, error: errorPlanes } = await consultaPlanes;
  if (errorPlanes) throw errorDeBase(errorPlanes, 'de planes de mantenimiento');

  const planes = (filasPlanes ?? []).map(aPlan);
  if (planes.length === 0) return { planes, activos: [], ordenes: [] };

  let consultaActivos = supabase
    .from('activo')
    .select('activo_codigo, activo_desc, tipo_activo_id, activo_fecha_alta, activo_estado')
    .in('tipo_activo_id', [...new Set(planes.map((plan) => plan.idTipoActivo))])
    .neq('activo_estado', ENUM_ESTADO_ACTIVO.codigo('Retirado'));
  if (codigoActivo) consultaActivos = consultaActivos.eq('activo_codigo', codigoActivo);

  const { data: activos, error: errorActivos } = await consultaActivos;
  if (errorActivos) throw errorDeBase(errorActivos, 'de activos');

  const { data: ordenes, error: errorOrdenes } = await supabase
    .from('orden_trabajo')
    .select('ot_id, mant_prev_id, activo_codigo, ot_estado, ot_fecha_programada, ot_fecha_alta, ot_fecha_cierre')
    .in('mant_prev_id', planes.map((plan) => plan.id));
  if (errorOrdenes) throw errorDeBase(errorOrdenes, 'de órdenes de trabajo preventivas');

  return {
    planes,
    activos: activos ?? [],
    ordenes: (ordenes ?? []).map((ot) => ({
      id: ot.ot_id,
      idPlan: ot.mant_prev_id,
      codigoActivo: ot.activo_codigo,
      estado: ENUM_ESTADO_OT.texto(ot.ot_estado) ?? 'Creada',
      fechaProgramada: soloDia(ot.ot_fecha_programada),
      fechaAlta: ot.ot_fecha_alta,
      fechaCierre: ot.ot_fecha_cierre,
    })),
  };
}

/** Un renglón por cada par plan–activo, con su próxima fecha. */
function armarProgramacion({ planes, activos, ordenes }, hoy) {
  const pares = [];

  for (const plan of planes) {
    const delTipo = activos.filter(
      (activo) =>
        activo.tipo_activo_id === plan.idTipoActivo &&
        activo.activo_estado !== ENUM_ESTADO_ACTIVO.codigo('Retirado') &&
        (!plan.activoCodigo || activo.activo_codigo === plan.activoCodigo)
    );

    for (const activo of delTipo) {
      const delPar = ordenes.filter((ot) => ot.idPlan === plan.id && ot.codigoActivo === activo.activo_codigo);
      const calculo = proximoMantenimiento({
        altaActivo: activo.activo_fecha_alta,
        hoy,
        ordenes: delPar,
        intervalo: plan.intervalo,
        unidad: plan.unidad,
      });

      pares.push({ plan, activo, ...calculo });
    }
  }

  return pares;
}

/* ------------------------------------------------------------------ *
 *  Generación
 * ------------------------------------------------------------------ */

/** Crea la OT de un par con las tareas del plan, todavía sin responsable. */
async function crearOtPreventiva({ plan, activo, fecha }) {
  const { data: orden, error: errorOrden } = await supabase
    .from('orden_trabajo')
    .insert({
      mant_prev_id: plan.id,
      activo_codigo: activo.activo_codigo,
      ticket_id: null,
      ot_desc: plan.nombre,
      ot_estado: ENUM_ESTADO_OT.codigo('Creada'),
      ot_fecha_alta: new Date().toISOString(),
      ot_fecha_programada: fecha,
    })
    .select('ot_id')
    .single();

  if (errorOrden?.code === VIOLA_UNICIDAD) return { yaExistia: true };
  if (errorOrden) throw errorDeBase(errorOrden, 'al crear la orden de trabajo preventiva');

  if (plan.tareas.length > 0) {
    const { error: errorTareas } = await supabase.from('tarea_ot').insert(
      plan.tareas.map((tarea, indice) => ({
        ot_id: orden.ot_id,
        tarea_id: indice + 1,
        tarea_plan_id: tarea.id,
        tarea_desc: tarea.descripcion || tarea.nombre,
        tarea_estado: ENUM_ESTADO_TAREA.codigo('Creada'),
        tarea_prioridad: ENUM_PRIORIDAD.codigo('Media'),
        tarea_fecha_ini: fecha,
      }))
    );

    if (errorTareas) {
      // Supabase no da transacciones desde el cliente: si fallan las tareas, se borra la OT.
      await supabase.from('orden_trabajo').delete().eq('ot_id', orden.ot_id);
      throw errorDeBase(errorTareas, 'al cargar las tareas de la OT preventiva');
    }
  }

  return { idOt: orden.ot_id };
}

/**
 * Genera las OT de los pares plan–activo cuya fecha llegó o entra en la
 * ventana de anticipación. Se puede correr las veces que haga falta: un par
 * con OT abierta no genera otra, y el índice único frena el mismo ciclo dos
 * veces aunque corran dos generaciones a la vez.
 *
 * @param {object} [opciones]
 * @param {string} [opciones.fechaCorte]     - "hoy" para el cálculo (por defecto, hoy en Argentina)
 * @param {number} [opciones.diasAnticipacion]
 * @param {string} [opciones.codigoActivo]   - sólo ese activo (lo usa el alta de activos)
 */
export async function generarOtsPreventivas({
  fechaCorte,
  diasAnticipacion = env.planesDiasAnticipacion,
  codigoActivo = null,
} = {}) {
  const corte = soloDia(fechaCorte) ?? hoyArgentina();
  const limite = sumarDias(corte, diasAnticipacion);

  const pares = armarProgramacion(await leerDatos({ codigoActivo }), corte);
  const vencidos = pares.filter((par) => par.fecha && par.fecha <= limite);

  const resultado = {
    fechaCorte: corte,
    fechaLimite: limite,
    paresEvaluados: pares.length,
    otsGeneradas: 0,
    yaExistian: 0,
    detalles: [],
  };
  if (vencidos.length === 0) return resultado;

  for (const par of vencidos) {
    const base = { idPlan: par.plan.id, plan: par.plan.nombre, codigoActivo: par.activo.activo_codigo, fecha: par.fecha };

    try {
      const creada = await crearOtPreventiva(par);

      if (creada.yaExistia) {
        resultado.yaExistian++;
        continue;
      }

      resultado.otsGeneradas++;
      resultado.detalles.push({ ...base, estado: 'generada', idOt: creada.idOt });
    } catch (fallo) {
      resultado.detalles.push({ ...base, estado: 'error', motivo: fallo.message });
    }
  }

  return resultado;
}

/* ------------------------------------------------------------------ *
 *  Consultas para las pantallas
 * ------------------------------------------------------------------ */

/** La programación de un plan, activo por activo, de la fecha más cercana a la más lejana. */
export async function listarProgramacion(idPlan, fechaReferencia) {
  const hoy = soloDia(fechaReferencia) ?? hoyArgentina();
  const pares = armarProgramacion(await leerDatos({ idPlan, incluirInactivos: true }), hoy);

  return pares
    .map((par) => ({
      codigoActivo: par.activo.activo_codigo,
      descripcionActivo: par.activo.activo_desc ?? null,
      ultimaRealizada: par.ultimaRealizada,
      proxima: par.fecha,
      otAbierta: par.otAbierta ? { id: par.otAbierta.id, estado: par.otAbierta.estado } : null,
    }))
    .sort((a, b) => (a.proxima ?? '9999').localeCompare(b.proxima ?? '9999') || a.codigoActivo.localeCompare(b.codigoActivo));
}

/**
 * Pares plan–activo con mantenimiento en los próximos `dias` que todavía no
 * tienen OT, con el día en que el job la va a generar.
 */
export async function listarPorVencer(dias = 7, fechaReferencia) {
  const hoy = soloDia(fechaReferencia) ?? hoyArgentina();
  const tope = sumarDias(hoy, dias);

  const pares = armarProgramacion(await leerDatos(), hoy);

  return pares
    .filter((par) => par.fecha && par.fecha <= tope)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((par) => ({
      idPlan: par.plan.id,
      nombre: par.plan.nombre,
      codigoActivo: par.activo.activo_codigo,
      fecha: par.fecha,
      fechaGeneracion: sumarDias(par.fecha, -env.planesDiasAnticipacion),
      diasRestantes: diasEntre(hoy, par.fecha),
    }));
}
