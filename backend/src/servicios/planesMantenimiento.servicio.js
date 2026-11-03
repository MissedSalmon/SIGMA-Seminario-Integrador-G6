import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto, errorDeBase } from '../utiles/errores.js';
import { ENUM_ESTADO_OT } from '../utiles/enumerados.js';
import { sumarPeriodo, UNIDADES_FRECUENCIA } from '../utiles/periodicidad.js';
import { generarOtsPreventivas, listarPorVencer, listarProgramacion } from './programacionPreventiva.servicio.js';

export { UNIDADES_FRECUENCIA };

/**
 * Formatea una representación legible para la frecuencia del plan.
 * Ej: (6, 'meses') -> 'Semestral', (1, 'meses') -> 'Mensual', (2, 'semanas') -> 'Cada 2 semanas'.
 */
export function formatearFrecuencia(intervalo, unidad) {
  const i = Number(intervalo) || 1;
  const u = (unidad || 'meses').toLowerCase();

  if (i === 1 && u === 'meses') return 'Mensual';
  if (i === 2 && u === 'meses') return 'Bimestral';
  if (i === 3 && u === 'meses') return 'Trimestral';
  if (i === 6 && u === 'meses') return 'Semestral';
  if (i === 1 && u === 'anios') return 'Anual';
  if (i === 1 && u === 'semanas') return 'Semanal';
  if (i === 1 && u === 'dias') return 'Diario';

  const plurales = {
    dias: i === 1 ? 'día' : 'días',
    semanas: i === 1 ? 'semana' : 'semanas',
    meses: i === 1 ? 'mes' : 'meses',
    anios: i === 1 ? 'año' : 'años',
  };
  return `Cada ${i} ${plurales[u] || u}`;
}

/** La fecha base más la periodicidad del plan (ver utiles/periodicidad.js). */
export function calcularProximaFecha(fechaBase, intervalo = 1, unidad = 'meses') {
  if (!fechaBase) return null;
  return sumarPeriodo(fechaBase, Number(intervalo) || 1, (unidad || 'meses').toLowerCase());
}

function limpiarTexto(t) {
  if (typeof t !== 'string') return null;
  const limpio = t.trim().replace(/\s+/g, ' ');
  return limpio || null;
}

function formatearPlan(fila) {
  const tipoActivo = fila.tipo_activo ?? null;
  const tareasRel = fila.mant_prev_tarea ?? [];
  const tecnicosRel = fila.mant_prev_tecnico ?? [];
  const ordenesRel = fila.orden_trabajo ?? [];

  const tareas = tareasRel
    .map((item) => {
      const p = item.plantilla_de_tarea;
      if (!p) return null;
      return {
        id: p.tarea_plan_id,
        nombre: p.tarea_plan_nom,
        descripcion: p.tarea_plan_desc ?? null,
        idEspecialidad: p.especialidad_id ?? null,
        nombreEspecialidad: p.especialidad?.especialidad_nom ?? null,
      };
    })
    .filter(Boolean);

  const tecnicos = tecnicosRel
    .map((item) => {
      const t = item.tecnico;
      if (!t) return null;
      return {
        legajo: t.tecnico_legajo,
        nombre: t.tecnico_nom_ape,
        telefono: t.tecnico_tel ?? null,
        disponible: t.tecnico_disponibilidad !== false,
        idsEspecialidad: (t.tecnico_especialidad ?? []).map((e) => e.especialidad_id),
      };
    })
    .filter(Boolean);

  const ordenes = ordenesRel.map((ot) => ({
    id: ot.ot_id,
    codigoActivo: ot.activo_codigo ?? null,
    estado: ENUM_ESTADO_OT.texto(ot.ot_estado) ?? 'Creada',
    descripcion: ot.ot_desc ?? null,
    fechaAlta: ot.ot_fecha_alta ?? null,
    fechaCierre: ot.ot_fecha_cierre ?? null,
  }));

  const intervalo = fila.mant_prev_intervalo ?? 1;
  const unidadFrecuencia = fila.mant_prev_unidad_frec ?? 'meses';

  return {
    id: fila.mant_prev_id,
    nombre: fila.mant_prev_nom,
    descripcion: fila.mant_prev_desc ?? null,
    tipoMantenimiento: fila.mant_prev_tipo_mant ?? 'Preventivo',
    tipoActivo: tipoActivo
      ? {
          id: tipoActivo.tipo_activo_id,
          nombre: tipoActivo.tipo_activo_nom,
        }
      : null,
    activoCodigo: fila.activo_codigo ?? null,
    intervalo,
    unidadFrecuencia,
    frecuencia: fila.mant_prev_frec || formatearFrecuencia(intervalo, unidadFrecuencia),
    fechaProximaGeneracion: fila.mant_prev_fecha_prox_gen
      ? String(fila.mant_prev_fecha_prox_gen).slice(0, 10)
      : null,
    activo: fila.mant_prev_activo !== false,
    fechaBaja: fila.mant_prev_fecha_baja ?? null,
    tareas,
    tecnicos,
    tieneTecnico: tecnicos.length > 0,
    cantidadTareas: tareas.length,
    cantidadTecnicos: tecnicos.length,
    ordenes,
  };
}

const SELECT_PLAN = `
  mant_prev_id,
  activo_codigo,
  tipo_activo_id,
  mant_prev_nom,
  mant_prev_desc,
  mant_prev_frec,
  mant_prev_tipo_mant,
  mant_prev_activo,
  mant_prev_fecha_baja,
  mant_prev_fecha_prox_gen,
  mant_prev_intervalo,
  mant_prev_unidad_frec,
  tipo_activo (
    tipo_activo_id,
    tipo_activo_nom
  ),
  mant_prev_tarea (
    tarea_plan_id,
    plantilla_de_tarea (
      tarea_plan_id,
      tarea_plan_nom,
      tarea_plan_desc,
      especialidad_id,
      especialidad ( especialidad_nom )
    )
  ),
  mant_prev_tecnico (
    tecnico_legajo,
    tecnico (
      tecnico_legajo,
      tecnico_nom_ape,
      tecnico_tel,
      tecnico_disponibilidad,
      tecnico_especialidad ( especialidad_id )
    )
  ),
  orden_trabajo (
    ot_id,
    activo_codigo,
    ot_estado,
    ot_desc,
    ot_fecha_alta,
    ot_fecha_cierre
  )
`;

/**
 * Listado de planes de mantenimiento preventivo con filtros.
 */
export async function listarPlanes({ tipoActivoId, estado = 'activo', buscar } = {}) {
  let consulta = supabase
    .from('mantenimiento_preventivo')
    .select(SELECT_PLAN)
    .order('mant_prev_id', { ascending: false });

  if (estado === 'activo') {
    consulta = consulta.eq('mant_prev_activo', true);
  } else if (estado === 'baja') {
    consulta = consulta.eq('mant_prev_activo', false);
  }

  if (tipoActivoId) {
    consulta = consulta.eq('tipo_activo_id', Number(tipoActivoId));
  }

  if (buscar && typeof buscar === 'string' && buscar.trim()) {
    const termino = `%${buscar.trim()}%`;
    consulta = consulta.or(`mant_prev_nom.ilike.${termino},mant_prev_desc.ilike.${termino}`);
  }

  const { data, error } = await consulta;
  if (error) throw errorDeBase(error, 'de planes de mantenimiento');

  return (data ?? []).map(formatearPlan);
}

/**
 * Obtener detalle de un plan preventivo por ID.
 */
export async function obtenerPlanPorId(id) {
  const idNum = Number(id);
  if (!idNum || isNaN(idNum)) throw datoInvalido('El ID de plan no es válido.');

  const { data, error } = await supabase
    .from('mantenimiento_preventivo')
    .select(SELECT_PLAN)
    .eq('mant_prev_id', idNum)
    .maybeSingle();

  if (error) throw errorDeBase(error, 'del plan de mantenimiento');
  if (!data) throw noEncontrado(`No existe el plan de mantenimiento preventivo #${id}.`);

  return formatearPlan(data);
}

/**
 * Alta de un plan de mantenimiento preventivo (CA1, C1–C3, C5).
 */
export async function crearPlan(datos = {}) {
  const nombre = limpiarTexto(datos.nombre);
  if (!nombre) throw datoInvalido('El nombre del plan es obligatorio.');

  // Unicidad de nombre entre planes activos
  const { data: existente } = await supabase
    .from('mantenimiento_preventivo')
    .select('mant_prev_id')
    .eq('mant_prev_activo', true)
    .ilike('mant_prev_nom', nombre)
    .maybeSingle();

  if (existente) {
    throw conflicto(`Ya existe un plan de mantenimiento preventivo activo con el nombre "${nombre}".`);
  }

  const tipoActivoId = Number(datos.tipoActivoId);
  if (!tipoActivoId || isNaN(tipoActivoId)) {
    throw datoInvalido('El tipo de activo es obligatorio.');
  }

  const { data: tipoActivo } = await supabase
    .from('tipo_activo')
    .select('tipo_activo_id')
    .eq('tipo_activo_id', tipoActivoId)
    .maybeSingle();

  if (!tipoActivo) {
    throw datoInvalido(`El tipo de activo #${tipoActivoId} no existe.`);
  }

  const intervalo = Number(datos.intervalo);
  if (!intervalo || isNaN(intervalo) || intervalo <= 0) {
    throw datoInvalido('El intervalo de frecuencia debe ser un número entero mayor a 0.');
  }

  const unidadFrecuencia = (datos.unidadFrecuencia || 'meses').toLowerCase();
  if (!UNIDADES_FRECUENCIA.includes(unidadFrecuencia)) {
    throw datoInvalido(`La unidad de frecuencia debe ser una de: ${UNIDADES_FRECUENCIA.join(', ')}.`);
  }

  const fechaProximaGeneracion = datos.fechaProximaGeneracion
    ? String(datos.fechaProximaGeneracion).slice(0, 10)
    : null;
  if (!fechaProximaGeneracion || isNaN(Date.parse(fechaProximaGeneracion))) {
    throw datoInvalido('La fecha de próxima generación es obligatoria y debe ser una fecha válida.');
  }

  // Tareas obligatorias (al menos 1)
  const tareasIds = Array.isArray(datos.tareasIds) ? datos.tareasIds.map(Number).filter(Boolean) : [];
  if (tareasIds.length === 0) {
    throw datoInvalido('El plan debe incluir al menos una tarea.');
  }

  const { data: plantillasValidas, error: errorPlantillas } = await supabase
    .from('plantilla_de_tarea')
    .select('tarea_plan_id')
    .in('tarea_plan_id', tareasIds);

  if (errorPlantillas) throw errorDeBase(errorPlantillas, 'de plantillas de tarea');

  if ((plantillasValidas ?? []).length !== tareasIds.length) {
    throw datoInvalido('Una o más tareas seleccionadas no existen.');
  }

  // Técnicos opcionales (C5)
  const tecnicosLegajos = Array.isArray(datos.tecnicosLegajos)
    ? [...new Set(datos.tecnicosLegajos.map(limpiarTexto).filter(Boolean))]
    : [];

  if (tecnicosLegajos.length > 0) {
    const { data: tecnicosValidos, error: errorTec } = await supabase
      .from('tecnico')
      .select('tecnico_legajo, tecnico_disponibilidad')
      .in('tecnico_legajo', tecnicosLegajos);

    if (errorTec) throw errorDeBase(errorTec, 'de técnicos');

    if ((tecnicosValidos ?? []).length !== tecnicosLegajos.length) {
      throw datoInvalido('Uno o más técnicos indicados no existen.');
    }
  }

  const descripcion = limpiarTexto(datos.descripcion);
  const tipoMantenimiento = limpiarTexto(datos.tipoMantenimiento) || 'Preventivo';
  const frecuenciaTexto = formatearFrecuencia(intervalo, unidadFrecuencia);

  // Inserción del plan
  const { data: planInsertado, error: errorInsert } = await supabase
    .from('mantenimiento_preventivo')
    .insert({
      tipo_activo_id: tipoActivoId,
      activo_codigo: datos.activoCodigo ? limpiarTexto(datos.activoCodigo) : null,
      mant_prev_nom: nombre,
      mant_prev_desc: descripcion,
      mant_prev_tipo_mant: tipoMantenimiento,
      mant_prev_intervalo: intervalo,
      mant_prev_unidad_frec: unidadFrecuencia,
      mant_prev_frec: frecuenciaTexto,
      mant_prev_fecha_prox_gen: fechaProximaGeneracion,
      mant_prev_activo: true,
    })
    .select('mant_prev_id')
    .single();

  if (errorInsert) throw errorDeBase(errorInsert, 'al registrar el plan');

  const idPlan = planInsertado.mant_prev_id;

  // Inserción de tareas del plan
  const filasTareas = tareasIds.map((idTarea) => ({
    mant_prev_id: idPlan,
    tarea_plan_id: idTarea,
  }));

  const { error: errorTareas } = await supabase.from('mant_prev_tarea').insert(filasTareas);
  if (errorTareas) throw errorDeBase(errorTareas, 'al asignar tareas al plan');

  // Inserción de técnicos (si fueron informados)
  if (tecnicosLegajos.length > 0) {
    const filasTecnicos = tecnicosLegajos.map((legajo) => ({
      mant_prev_id: idPlan,
      tecnico_legajo: legajo,
    }));
    const { error: errorTecnicos } = await supabase.from('mant_prev_tecnico').insert(filasTecnicos);
    if (errorTecnicos) throw errorDeBase(errorTecnicos, 'al asignar técnicos al plan');
  }

  return obtenerPlanPorId(idPlan);
}

/**
 * Modificación de un plan de mantenimiento preventivo (CA6).
 * No altera las órdenes de trabajo ya generadas.
 */
export async function actualizarPlan(id, datos = {}) {
  const idNum = Number(id);
  const planActual = await obtenerPlanPorId(idNum);

  if (!planActual.activo) {
    throw conflicto('No se puede modificar un plan de mantenimiento que fue dado de baja.');
  }

  const cambios = {};

  if ('nombre' in datos) {
    const nombre = limpiarTexto(datos.nombre);
    if (!nombre) throw datoInvalido('El nombre del plan no puede quedar vacío.');

    if (nombre.toLowerCase() !== planActual.nombre.toLowerCase()) {
      const { data: repetido } = await supabase
        .from('mantenimiento_preventivo')
        .select('mant_prev_id')
        .eq('mant_prev_activo', true)
        .ilike('mant_prev_nom', nombre)
        .neq('mant_prev_id', idNum)
        .maybeSingle();

      if (repetido) {
        throw conflicto(`Ya existe otro plan de mantenimiento activo con el nombre "${nombre}".`);
      }
    }
    cambios.mant_prev_nom = nombre;
  }

  if ('descripcion' in datos) {
    cambios.mant_prev_desc = limpiarTexto(datos.descripcion);
  }

  if ('tipoMantenimiento' in datos) {
    cambios.mant_prev_tipo_mant = limpiarTexto(datos.tipoMantenimiento) || 'Preventivo';
  }

  let nuevoIntervalo = planActual.intervalo;
  let nuevaUnidad = planActual.unidadFrecuencia;
  let recalcularFrecuencia = false;

  if ('intervalo' in datos) {
    const int = Number(datos.intervalo);
    if (!int || isNaN(int) || int <= 0) {
      throw datoInvalido('El intervalo debe ser un número entero mayor a 0.');
    }
    nuevoIntervalo = int;
    cambios.mant_prev_intervalo = int;
    recalcularFrecuencia = true;
  }

  if ('unidadFrecuencia' in datos) {
    const u = (datos.unidadFrecuencia || '').toLowerCase();
    if (!UNIDADES_FRECUENCIA.includes(u)) {
      throw datoInvalido(`La unidad de frecuencia debe ser una de: ${UNIDADES_FRECUENCIA.join(', ')}.`);
    }
    nuevaUnidad = u;
    cambios.mant_prev_unidad_frec = u;
    recalcularFrecuencia = true;
  }

  if (recalcularFrecuencia) {
    cambios.mant_prev_frec = formatearFrecuencia(nuevoIntervalo, nuevaUnidad);
  }

  if ('fechaProximaGeneracion' in datos && datos.fechaProximaGeneracion) {
    const fecha = String(datos.fechaProximaGeneracion).slice(0, 10);
    if (isNaN(Date.parse(fecha))) {
      throw datoInvalido('La fecha de próxima generación no es válida.');
    }
    cambios.mant_prev_fecha_prox_gen = fecha;
  }

  // Aplicar actualización de atributos básicos si hay cambios
  if (Object.keys(cambios).length > 0) {
    const { error: errorUpdate } = await supabase
      .from('mantenimiento_preventivo')
      .update(cambios)
      .eq('mant_prev_id', idNum);

    if (errorUpdate) throw errorDeBase(errorUpdate, 'al actualizar el plan');
  }

  // Actualizar tareas si vienen especificadas
  if ('tareasIds' in datos) {
    const tareasIds = Array.isArray(datos.tareasIds)
      ? datos.tareasIds.map(Number).filter(Boolean)
      : [];

    if (tareasIds.length === 0) {
      throw datoInvalido('El plan debe incluir al menos una tarea.');
    }

    const { data: plantillasValidas } = await supabase
      .from('plantilla_de_tarea')
      .select('tarea_plan_id')
      .in('tarea_plan_id', tareasIds);

    if ((plantillasValidas ?? []).length !== tareasIds.length) {
      throw datoInvalido('Una o más tareas seleccionadas no existen.');
    }

    // Reemplazar tareas
    await supabase.from('mant_prev_tarea').delete().eq('mant_prev_id', idNum);
    const filasTareas = tareasIds.map((tareaId) => ({
      mant_prev_id: idNum,
      tarea_plan_id: tareaId,
    }));
    await supabase.from('mant_prev_tarea').insert(filasTareas);
  }

  // Actualizar técnicos si vienen especificados
  if ('tecnicosLegajos' in datos) {
    const legajos = Array.isArray(datos.tecnicosLegajos)
      ? [...new Set(datos.tecnicosLegajos.map(limpiarTexto).filter(Boolean))]
      : [];

    if (legajos.length > 0) {
      const { data: validos } = await supabase
        .from('tecnico')
        .select('tecnico_legajo')
        .in('tecnico_legajo', legajos);

      if ((validos ?? []).length !== legajos.length) {
        throw datoInvalido('Uno o más técnicos indicados no existen.');
      }
    }

    // Reemplazar asignación de técnicos
    await supabase.from('mant_prev_tecnico').delete().eq('mant_prev_id', idNum);
    if (legajos.length > 0) {
      const filasTecnicos = legajos.map((legajo) => ({
        mant_prev_id: idNum,
        tecnico_legajo: legajo,
      }));
      await supabase.from('mant_prev_tecnico').insert(filasTecnicos);
    }
  }

  return obtenerPlanPorId(idNum);
}

/**
 * Baja lógica de un plan preventivo (CA6).
 * No altera ni elimina las órdenes de trabajo ya generadas.
 */
export async function darDeBajaPlan(id) {
  const idNum = Number(id);
  const plan = await obtenerPlanPorId(idNum);

  if (!plan.activo) {
    throw conflicto('El plan de mantenimiento preventivo ya se encuentra dado de baja.');
  }

  const { error } = await supabase
    .from('mantenimiento_preventivo')
    .update({
      mant_prev_activo: false,
      mant_prev_fecha_baja: new Date().toISOString(),
    })
    .eq('mant_prev_id', idNum);

  if (error) throw errorDeBase(error, 'al dar de baja el plan');

  return {
    id: idNum,
    mensaje: `El plan "${plan.nombre}" fue dado de baja correctamente. Las órdenes de trabajo existentes no se vieron afectadas.`,
  };
}

/**
 * Pares plan–activo que se generan en los próximos N días (CA5, por defecto 7).
 * La programación es por activo (03/11/2026): ver programacionPreventiva.servicio.js.
 */
export async function obtenerPlanesPorVencer(dias = 7, fechaReferencia) {
  return listarPorVencer(dias, fechaReferencia);
}

/**
 * Genera las OT preventivas que tocan (CA3, CA4, C8). La corre el job diario
 * (tareasProgramadas/generacionPreventiva.js) y también se puede pedir a mano.
 */
export async function procesarGeneracionAutomatica(fechaCorte) {
  return generarOtsPreventivas({ fechaCorte });
}

/** La programación del plan, activo por activo. */
export async function obtenerProgramacion(id) {
  const plan = await obtenerPlanPorId(id);
  return listarProgramacion(plan.id);
}
