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
import { errorDeBase, noEncontrado } from '../utiles/errores.js';
import {
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_OT,
  ENUM_ESTADO_TAREA,
  ENUM_PRIORIDAD,
} from '../utiles/enumerados.js';

/** De mas urgente a menos: con este orden sale la lista. */
export const PRIORIDADES = ENUM_PRIORIDAD.textos;

/** Una tarea en estos estados ya no es trabajo pendiente. */
const ESTADOS_TERMINADOS = ['Finalizada', 'Cancelada'];

const ASIGNACION_CANCELADA = ENUM_ESTADO_ASIGNACION_TECNICO.codigo('Cancelada');

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
 * El orden por defecto (criterio de la HU-21): primero la prioridad (Alta,
 * Media, Baja) y dentro de la misma prioridad la fecha prevista mas cercana.
 * Las que no tienen fecha van al final de su prioridad. Si empatan en todo, por
 * numero de OT y de tarea, para que la lista no cambie de orden sola.
 */
function compararTareas(una, otra) {
  const porPrioridad = PRIORIDADES.indexOf(una.prioridad) - PRIORIDADES.indexOf(otra.prioridad);
  if (porPrioridad !== 0) return porPrioridad;

  if (una.fechaPrevista !== otra.fechaPrevista) {
    if (!una.fechaPrevista) return 1;
    if (!otra.fechaPrevista) return -1;
    return una.fechaPrevista < otra.fechaPrevista ? -1 : 1;
  }

  return una.idOt - otra.idOt || una.idTarea - otra.idTarea;
}

/** Si la tarea cumple con los filtros. Todos juntos (AND). */
function cumpleFiltros(tarea, { prioridad, desde, hasta }) {
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

/**
 * Una tarea del tecnico. Si la tarea existe pero es de otro, se responde igual
 * que si no existiera: no se le dice al tecnico que hay una tarea ajena ahi.
 */
export async function obtenerUnaDelTecnico(legajo, idOt, idTarea) {
  const { data, error } = await consultarAsignaciones(legajo)
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .maybeSingle();

  if (error) throw errorDeBase(error, 'de las tareas');
  if (!data) throw noEncontrado(`No tenés asignada la tarea ${idTarea} de la orden de trabajo ${idOt}.`);

  return aTarea(data);
}
