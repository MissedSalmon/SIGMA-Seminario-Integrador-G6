/**
 * Historial de intervenciones de un activo (HU-29).
 *
 * DECISION (25/10/2026, ver .claude/contexto/dominio.md): una intervencion es
 * una OT del activo que ya se empezo a trabajar, o sea En ejecución o
 * Finalizada. Las Creadas y Asignadas todavia no le hicieron nada al activo, y
 * las Canceladas no se trabajaron. Es correctiva si viene de un ticket y
 * preventiva si viene de un plan.
 *
 * La falla, el responsable, los materiales y las observaciones son de cada
 * tarea, asi que la intervencion los muestra tarea por tarea.
 */
import { supabase } from '../config/supabase.js';
import { errorDeBase } from '../utiles/errores.js';
import {
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_OT,
  ENUM_ESTADO_TAREA,
} from '../utiles/enumerados.js';
import { obtenerPorId as obtenerActivo } from './activos.servicio.js';
import { observacionesDelActivo } from './observaciones.servicio.js';

const ESTADOS_INTERVENCION = ['En ejecución', 'Finalizada'].map((estado) => ENUM_ESTADO_OT.codigo(estado));
const ASIGNACION_CANCELADA = ENUM_ESTADO_ASIGNACION_TECNICO.codigo('Cancelada');

const TAREAS = `
  tarea_ot (
    tarea_id,
    tarea_desc,
    tarea_estado,
    prestador_serv_id,
    prestador_servicio ( prestador_serv_nom ),
    falla!falla_tarea_fk ( falla_tipo, falla_desc )
  )
`;

const COLUMNAS_OT = 'ot_id, ot_estado, ot_fecha_alta, ot_fecha_cierre, ot_desc';

/** Las OT del activo que cuentan como intervencion, las de ticket y las de plan. */
async function ordenesDelActivo(codigo) {
  const [porTicket, porPlan] = await Promise.all([
    supabase
      .from('orden_trabajo')
      .select(`${COLUMNAS_OT}, ticket!inner ( ticket_id, ticket_desc, activo_codigo ), ${TAREAS}`)
      .eq('ticket.activo_codigo', codigo)
      .in('ot_estado', ESTADOS_INTERVENCION),
    supabase
      .from('orden_trabajo')
      .select(`${COLUMNAS_OT}, mantenimiento_preventivo!inner ( mant_prev_id, mant_prev_nom, activo_codigo ), ${TAREAS}`)
      .eq('mantenimiento_preventivo.activo_codigo', codigo)
      .in('ot_estado', ESTADOS_INTERVENCION),
  ]);

  if (porTicket.error) throw errorDeBase(porTicket.error, 'de las órdenes de trabajo');
  if (porPlan.error) throw errorDeBase(porPlan.error, 'de las órdenes de trabajo');

  return [...(porTicket.data ?? []), ...(porPlan.data ?? [])];
}

async function asignacionesDe(idsOt) {
  const { data, error } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select('ot_id, tarea_id, tecnico_legajo, tecnico ( tecnico_nom_ape )')
    .in('ot_id', idsOt)
    .neq('tec_asig_estado', ASIGNACION_CANCELADA);

  if (error) throw errorDeBase(error, 'de los técnicos asignados');
  return data ?? [];
}

async function materialesDe(idsOt) {
  const { data, error } = await supabase
    .from('tarea_ot_consume_material')
    .select('ot_id, tarea_id, mat_cod, tamat_cant, material ( mat_nom )')
    .in('ot_id', idsOt);

  if (error) throw errorDeBase(error, 'de los materiales consumidos');
  return data ?? [];
}

const deLaTarea = (idOt, idTarea) => (fila) => fila.ot_id === idOt && fila.tarea_id === idTarea;

function responsableDe(tarea, asignacion) {
  if (asignacion) {
    return { tipo: 'Técnico', nombre: asignacion.tecnico?.tecnico_nom_ape ?? asignacion.tecnico_legajo };
  }
  if (tarea.prestador_serv_id) {
    return { tipo: 'Prestador', nombre: tarea.prestador_servicio?.prestador_serv_nom ?? '' };
  }
  return null;
}

function aIntervencion(fila, asignaciones, materiales, observaciones) {
  const estado = ENUM_ESTADO_OT.texto(fila.ot_estado);
  const plan = fila.mantenimiento_preventivo ?? null;

  const tareas = (fila.tarea_ot ?? [])
    .map((tarea) => ({ ...tarea, estado: ENUM_ESTADO_TAREA.texto(tarea.tarea_estado) ?? 'Creada' }))
    // Una tarea cancelada no se hizo: no es parte de lo que se le hizo al activo.
    .filter((tarea) => tarea.estado !== 'Cancelada')
    .sort((una, otra) => una.tarea_id - otra.tarea_id)
    .map((tarea) => {
      const falla = Array.isArray(tarea.falla) ? tarea.falla[0] : tarea.falla;
      const esta = deLaTarea(fila.ot_id, tarea.tarea_id);

      return {
        idTarea: tarea.tarea_id,
        descripcion: tarea.tarea_desc,
        estado: tarea.estado,
        responsable: responsableDe(tarea, asignaciones.find(esta)),
        falla: falla ? { tipo: falla.falla_tipo, descripcion: falla.falla_desc } : null,
        materiales: materiales.filter(esta).map((material) => ({
          codigo: material.mat_cod,
          nombre: material.material?.mat_nom ?? material.mat_cod,
          cantidad: Number(material.tamat_cant),
        })),
        observaciones: observaciones
          .filter((observacion) => observacion.idOt === fila.ot_id && observacion.idTarea === tarea.tarea_id)
          .map(({ id, texto, autor, fecha }) => ({ id, texto, autor, fecha })),
      };
    });

  return {
    idOt: fila.ot_id,
    tipo: plan ? 'Preventiva' : 'Correctiva',
    estado,
    // La finalizada se fecha cuando termino; la que sigue en curso, cuando se abrio.
    fecha: estado === 'Finalizada' && fila.ot_fecha_cierre ? fila.ot_fecha_cierre : fila.ot_fecha_alta,
    fechaAlta: fila.ot_fecha_alta,
    fechaCierre: fila.ot_fecha_cierre,
    descripcion: fila.ot_desc,
    idTicket: fila.ticket?.ticket_id ?? null,
    problemaReportado: fila.ticket?.ticket_desc ?? null,
    planPreventivo: plan?.mant_prev_nom ?? null,
    tareas,
  };
}

function masReciente(una, otra) {
  return new Date(otra.fecha) - new Date(una.fecha) || otra.idOt - una.idOt;
}

/**
 * El historial del activo, de la intervencion mas reciente a la mas vieja, con
 * su resumen. El ultimo mantenimiento es el cierre de la OT finalizada mas
 * reciente: se calcula, no se guarda (activo_fecha_ult_maint no se usa).
 */
export async function obtenerHistorial(codigo) {
  await obtenerActivo(codigo);

  const ordenes = await ordenesDelActivo(codigo);
  const idsOt = ordenes.map((orden) => orden.ot_id);

  const [asignaciones, materiales, observaciones] = idsOt.length
    ? await Promise.all([asignacionesDe(idsOt), materialesDe(idsOt), observacionesDelActivo(codigo)])
    : [[], [], []];

  const intervenciones = ordenes
    .map((orden) => aIntervencion(orden, asignaciones, materiales, observaciones))
    .sort(masReciente);

  const cierres = intervenciones
    .filter((intervencion) => intervencion.estado === 'Finalizada' && intervencion.fechaCierre)
    .map((intervencion) => intervencion.fechaCierre)
    .sort((una, otra) => new Date(otra) - new Date(una));

  return {
    resumen: {
      cantidadIntervenciones: intervenciones.length,
      fechaUltimoMantenimiento: cierres[0] ?? null,
    },
    intervenciones,
  };
}
