/**
 * Programación de los planes preventivos por activo y generación de sus OT
 * (correcciones del Sprint 5, 03/11/2026).
 *
 * El plan sólo dice cada cuánto. Cada activo del tipo del plan lleva su propio
 * ciclo, así las OT no salen todas juntas:
 *
 *   sin OT previa   -> la más nueva entre la alta del activo y la del plan, + periodicidad
 *   con OT previa   -> el cierre de la última OT finalizada del par, + periodicidad
 *   OT cancelada    -> cuenta como ciclo salteado: se suma desde su fecha programada
 *   OT abierta      -> no hay próxima hasta que se cierre
 *
 * Al generar, cada tarea va al técnico autorizado del plan que tiene su
 * especialidad, está disponible y tiene menos tareas pendientes. Si no hay
 * ninguno, la tarea queda sin asignar y la OT en "Creada".
 */
import { supabase } from '../config/supabase.js';
import { env } from '../config/env.js';
import { errorDeBase } from '../utiles/errores.js';
import {
  ENUM_ESTADO_ACTIVO,
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_OT,
  ENUM_ESTADO_TAREA,
  ENUM_PRIORIDAD,
} from '../utiles/enumerados.js';
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
 * @param {string}   datos.altaPlan    - desde cuándo aplica el plan
 * @param {object[]} datos.ordenes     - OT del par: { id, estado, fechaProgramada, fechaAlta, fechaCierre }
 * @param {number}   datos.intervalo
 * @param {string}   datos.unidad      - dias | semanas | meses | anios
 * @returns {{ fecha: string|null, ultimaRealizada: string|null, otAbierta: object|null }}
 */
export function proximoMantenimiento({ altaActivo, altaPlan, ordenes = [], intervalo, unidad }) {
  const finalizadas = ordenes.filter((ot) => ot.estado === 'Finalizada' && ot.fechaCierre);
  const ultimaRealizada = finalizadas.map((ot) => soloDia(ot.fechaCierre)).sort().at(-1) ?? null;

  const otAbierta = ordenes.find((ot) => ESTADOS_OT_ABIERTOS.includes(ot.estado)) ?? null;
  if (otAbierta) return { fecha: null, ultimaRealizada, otAbierta };

  const salteadas = ordenes
    .filter((ot) => ot.estado === 'Cancelada')
    .map((ot) => ot.fechaProgramada ?? soloDia(ot.fechaAlta))
    .filter(Boolean);

  const desdeOrdenes = [ultimaRealizada, ...salteadas].filter(Boolean).sort().at(-1);
  const desdeAlta = [soloDia(altaActivo), soloDia(altaPlan)].filter(Boolean).sort().at(-1);
  const base = desdeOrdenes ?? desdeAlta;

  return {
    fecha: base ? sumarPeriodo(base, intervalo, unidad) : null,
    ultimaRealizada,
    otAbierta: null,
  };
}

/**
 * El técnico para una tarea: entre los autorizados del plan, los disponibles
 * con la especialidad de la tarea; gana el de menos tareas pendientes y, si
 * empatan, el de legajo menor (así el resultado no depende del orden).
 * Una tarea sin especialidad la puede hacer cualquiera de ellos.
 *
 * @returns {string|null} el legajo, o null si nadie la cubre
 */
export function elegirTecnico(tarea, tecnicos, cargaPorLegajo = new Map()) {
  const aptos = tecnicos.filter(
    (tecnico) =>
      tecnico.disponible &&
      (!tarea.idEspecialidad || tecnico.idsEspecialidad.includes(tarea.idEspecialidad))
  );

  aptos.sort(
    (a, b) =>
      (cargaPorLegajo.get(a.legajo) ?? 0) - (cargaPorLegajo.get(b.legajo) ?? 0) ||
      a.legajo.localeCompare(b.legajo)
  );

  return aptos[0]?.legajo ?? null;
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
  ),
  mant_prev_tecnico (
    tecnico ( tecnico_legajo, tecnico_nom_ape, tecnico_disponibilidad, tecnico_especialidad ( especialidad_id ) )
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
    tecnicos: (fila.mant_prev_tecnico ?? [])
      .map((item) => item.tecnico)
      .filter(Boolean)
      .map((t) => ({
        legajo: t.tecnico_legajo,
        nombre: t.tecnico_nom_ape,
        disponible: t.tecnico_disponibilidad !== false,
        idsEspecialidad: (t.tecnico_especialidad ?? []).map((e) => e.especialidad_id),
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
function armarProgramacion({ planes, activos, ordenes }) {
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
        altaPlan: plan.fechaAlta,
        ordenes: delPar,
        intervalo: plan.intervalo,
        unidad: plan.unidad,
      });

      pares.push({ plan, activo, ...calculo });
    }
  }

  return pares;
}

/** Tareas pendientes de cada técnico, para repartir la carga. */
async function leerCargaDeTecnicos() {
  const { data, error } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select('tecnico_legajo')
    .in('tec_asig_estado', ASIGNACIONES_PENDIENTES.map((estado) => ENUM_ESTADO_ASIGNACION_TECNICO.codigo(estado)));
  if (error) throw errorDeBase(error, 'de asignaciones de técnicos');

  const carga = new Map();
  for (const fila of data ?? []) carga.set(fila.tecnico_legajo, (carga.get(fila.tecnico_legajo) ?? 0) + 1);
  return carga;
}

/* ------------------------------------------------------------------ *
 *  Generación
 * ------------------------------------------------------------------ */

/**
 * Crea la OT de un par con sus tareas y técnicos. `carga` se actualiza en el
 * momento, así la OT siguiente de la misma corrida ya la tiene en cuenta.
 */
async function crearOtPreventiva({ plan, activo, fecha }, carga) {
  const tareas = plan.tareas.map((tarea, indice) => {
    const legajo = elegirTecnico(tarea, plan.tecnicos, carga);
    if (legajo) carga.set(legajo, (carga.get(legajo) ?? 0) + 1);
    return { ...tarea, numero: indice + 1, legajo };
  });

  const todasAsignadas = tareas.length > 0 && tareas.every((tarea) => tarea.legajo);

  const { data: orden, error: errorOrden } = await supabase
    .from('orden_trabajo')
    .insert({
      mant_prev_id: plan.id,
      activo_codigo: activo.activo_codigo,
      ticket_id: null,
      ot_desc: plan.nombre,
      ot_estado: ENUM_ESTADO_OT.codigo(todasAsignadas ? 'Asignada' : 'Creada'),
      ot_fecha_alta: new Date().toISOString(),
      ot_fecha_programada: fecha,
    })
    .select('ot_id')
    .single();

  if (errorOrden?.code === VIOLA_UNICIDAD) return { yaExistia: true };
  if (errorOrden) throw errorDeBase(errorOrden, 'al crear la orden de trabajo preventiva');

  try {
    if (tareas.length > 0) {
      const { error: errorTareas } = await supabase.from('tarea_ot').insert(
        tareas.map((tarea) => ({
          ot_id: orden.ot_id,
          tarea_id: tarea.numero,
          tarea_plan_id: tarea.id,
          tarea_desc: tarea.descripcion || tarea.nombre,
          tarea_estado: ENUM_ESTADO_TAREA.codigo(tarea.legajo ? 'Asignada' : 'Creada'),
          tarea_prioridad: ENUM_PRIORIDAD.codigo('Media'),
          tarea_fecha_ini: fecha,
        }))
      );
      if (errorTareas) throw errorDeBase(errorTareas, 'al cargar las tareas de la OT preventiva');
    }

    const asignadas = tareas.filter((tarea) => tarea.legajo);
    if (asignadas.length > 0) {
      const { error: errorAsignacion } = await supabase.from('tecnico_asignado_tarea_ot').insert(
        asignadas.map((tarea) => ({
          ot_id: orden.ot_id,
          tarea_id: tarea.numero,
          tecnico_legajo: tarea.legajo,
          tec_asig_estado: ENUM_ESTADO_ASIGNACION_TECNICO.codigo('Asignada'),
          tec_asig_fecha_asig: new Date().toISOString(),
        }))
      );
      if (errorAsignacion) throw errorDeBase(errorAsignacion, 'al asignar los técnicos de la OT preventiva');
    }
  } catch (fallo) {
    // Supabase no da transacciones desde el cliente: si falla a mitad, se borra la OT (sus tareas caen en cascada).
    await supabase.from('orden_trabajo').delete().eq('ot_id', orden.ot_id);
    throw fallo;
  }

  return {
    idOt: orden.ot_id,
    tareasSinTecnico: tareas.filter((tarea) => !tarea.legajo).map((tarea) => tarea.nombre),
  };
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

  const pares = armarProgramacion(await leerDatos({ codigoActivo }));
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

  const carga = await leerCargaDeTecnicos();

  for (const par of vencidos) {
    const base = { idPlan: par.plan.id, plan: par.plan.nombre, codigoActivo: par.activo.activo_codigo, fecha: par.fecha };

    try {
      const creada = await crearOtPreventiva(par, carga);

      if (creada.yaExistia) {
        resultado.yaExistian++;
        continue;
      }

      resultado.otsGeneradas++;
      resultado.detalles.push({ ...base, estado: 'generada', idOt: creada.idOt, tareasSinTecnico: creada.tareasSinTecnico });
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
export async function listarProgramacion(idPlan) {
  const pares = armarProgramacion(await leerDatos({ idPlan, incluirInactivos: true }));

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
 * Pares plan–activo que se van a generar en los próximos `dias` (contando la
 * anticipación) y todavía no tienen OT. Avisa qué tareas quedarían sin técnico.
 */
export async function listarPorVencer(dias = 7, fechaReferencia) {
  const hoy = soloDia(fechaReferencia) ?? hoyArgentina();
  const tope = sumarDias(hoy, dias + env.planesDiasAnticipacion);

  const pares = armarProgramacion(await leerDatos());

  return pares
    .filter((par) => par.fecha && par.fecha <= tope)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
    .map((par) => {
      const sinTecnico = par.plan.tareas.filter((tarea) => !elegirTecnico(tarea, par.plan.tecnicos)).map((tarea) => tarea.nombre);

      return {
        idPlan: par.plan.id,
        nombre: par.plan.nombre,
        codigoActivo: par.activo.activo_codigo,
        fecha: par.fecha,
        diasRestantes: diasEntre(hoy, par.fecha),
        tecnicos: par.plan.tecnicos.map((tecnico) => ({ legajo: tecnico.legajo, nombre: tecnico.nombre })),
        tareasSinTecnico: sinTecnico,
        advertencia:
          sinTecnico.length > 0
            ? `Ningún técnico autorizado disponible cubre: ${sinTecnico.join(', ')}. Esas tareas van a quedar sin asignar.`
            : null,
      };
    });
}
