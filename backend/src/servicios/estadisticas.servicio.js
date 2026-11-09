import { supabase } from '../config/supabase.js';
import { datoInvalido, errorDeBase } from '../utiles/errores.js';
import { ENUM_ESTADO_TICKET } from '../utiles/enumerados.js';

/**
 * Estadísticas del panel del administrador (Sprint 7).
 *
 * HU-34 (issue #29) · Áreas con mayor incidencia: un ranking de áreas según
 * cuántas fallas registraron los técnicos en las tareas de sus activos.
 *
 * Reglas (ver .claude/contexto/dominio.md, decisión del 07/11/2026):
 * - Cuenta las fallas con tarea y activo. Las filas viejas que sólo tenían OT
 *   no tienen activo, así que no se sabe de qué área son: quedan afuera.
 * - El área de una falla es la del espacio de su activo (area.espacio_id),
 *   igual que el área de un ticket. Si el espacio no tiene área, va a
 *   "Sin área", que se muestra siempre al final.
 * - Si varias áreas comparten el espacio, la falla cuenta para cada una.
 * - Cuentan las fallas de OT correctivas y preventivas. "Tickets" son los
 *   tickets distintos detrás de esas fallas: una falla de una OT preventiva
 *   no tiene ticket.
 * - El período se aplica sobre la fecha en que se registró la falla.
 * - Sólo aparecen las áreas con al menos una falla en el período.
 * - El porcentaje de un área es sobre el total de fallas del período. Si dos
 *   áreas comparten un espacio, la suma puede pasar el 100 %.
 */

const COLUMNAS = `
  falla_id,
  ot_id,
  tarea_id,
  falla_tipo,
  falla_desc,
  falla_fecha,
  activo_codigo,
  activo!falla_activo_fk (
    activo_codigo,
    tipo_activo (
      tipo_activo_nom
    ),
    espacio (
      espacio_id,
      espacio_num,
      edificio (
        edificio_nom
      ),
      area (
        area_id,
        area_nom
      )
    )
  ),
  orden_trabajo (
    ot_id,
    ticket_id,
    mant_prev_id,
    ticket (
      ticket_id,
      ticket_fecha_alta,
      ticket_estado
    )
  )
`;

const SIN_AREA = 'Sin área';

function fechaValida(texto, nombre) {
  if (texto == null || texto === '') return null;
  const fecha = new Date(texto);
  if (Number.isNaN(fecha.getTime())) throw datoInvalido(`La fecha "${nombre}" no es válida.`);
  return fecha.toISOString();
}

/** Una falla tal como se muestra en el detalle del área. */
function aIncidencia(fila) {
  const activo = fila.activo ?? null;
  const espacio = activo?.espacio ?? null;
  const ot = fila.orden_trabajo ?? null;
  const ticket = ot?.ticket ?? null;

  return {
    idFalla: fila.falla_id,
    fecha: fila.falla_fecha,
    tipo: fila.falla_tipo ?? 'Sin tipo',
    descripcion: fila.falla_desc,
    codigoActivo: fila.activo_codigo,
    nombreTipoActivo: activo?.tipo_activo?.tipo_activo_nom ?? '',
    nombreEdificio: espacio?.edificio?.edificio_nom ?? '',
    numeroEspacio: espacio?.espacio_num ?? '',
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    idPlan: ot?.mant_prev_id ?? null,
    ticket: ticket
      ? {
          id: ticket.ticket_id,
          fechaAlta: ticket.ticket_fecha_alta,
          estado: ENUM_ESTADO_TICKET.texto(ticket.ticket_estado) ?? '',
        }
      : null,
  };
}

/** Las áreas de una falla: las de su espacio, o "Sin área". */
function areasDe(fila) {
  const espacio = fila.activo?.espacio ?? null;
  const areas = espacio?.area ?? [];
  if (areas.length === 0) {
    return [{ idArea: null, nombreArea: SIN_AREA, nombreEdificio: espacio?.edificio?.edificio_nom ?? '' }];
  }
  return areas.map((area) => ({
    idArea: area.area_id,
    nombreArea: area.area_nom,
    nombreEdificio: espacio?.edificio?.edificio_nom ?? '',
  }));
}

function compararRanking(a, b) {
  // "Sin área" no es un área a mejorar: va siempre al final.
  if ((a.idArea === null) !== (b.idArea === null)) return a.idArea === null ? 1 : -1;
  return (
    b.cantidadFallas - a.cantidadFallas ||
    b.cantidadTickets - a.cantidadTickets ||
    a.nombreArea.localeCompare(b.nombreArea, 'es')
  );
}

/**
 * El ranking de áreas por cantidad de fallas, de mayor a menor.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.desde]     - fecha/hora ISO: fallas registradas desde ese momento
 * @param {string} [filtros.hasta]     - fecha/hora ISO: fallas registradas hasta ese momento
 * @param {string} [filtros.tipoFalla] - el nombre del tipo de falla ("Eléctrica")
 */
export async function obtenerAreasConMayorIncidencia(filtros = {}) {
  const desde = fechaValida(filtros.desde, 'desde');
  const hasta = fechaValida(filtros.hasta, 'hasta');
  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  let consulta = supabase
    .from('falla')
    .select(COLUMNAS)
    .not('activo_codigo', 'is', null)
    .order('falla_fecha', { ascending: false });

  if (desde) consulta = consulta.gte('falla_fecha', desde);
  if (hasta) consulta = consulta.lte('falla_fecha', hasta);
  if (filtros.tipoFalla) consulta = consulta.eq('falla_tipo', filtros.tipoFalla);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  // Sólo aparecen las áreas que tienen alguna falla en el período.
  const porArea = new Map();
  const fallasDistintas = new Set();

  for (const fila of data ?? []) {
    const incidencia = aIncidencia(fila);
    fallasDistintas.add(incidencia.idFalla);

    for (const area of areasDe(fila)) {
      const clave = area.idArea ?? 'sin-area';
      if (!porArea.has(clave)) {
        porArea.set(clave, { ...area, tickets: new Set(), tipos: new Map(), incidencias: [] });
      }
      const grupo = porArea.get(clave);
      grupo.incidencias.push(incidencia);
      grupo.tipos.set(incidencia.tipo, (grupo.tipos.get(incidencia.tipo) ?? 0) + 1);
      if (incidencia.ticket) grupo.tickets.add(incidencia.ticket.id);
    }
  }

  const ranking = [...porArea.values()].map((grupo) => ({
    idArea: grupo.idArea,
    nombreArea: grupo.nombreArea,
    nombreEdificio: grupo.nombreEdificio,
    cantidadFallas: grupo.incidencias.length,
    cantidadTickets: grupo.tickets.size,
    // Sobre el total de fallas del período, con un decimal.
    porcentaje: fallasDistintas.size
      ? Math.round((grupo.incidencias.length / fallasDistintas.size) * 1000) / 10
      : 0,
    desglose: [...grupo.tipos.entries()]
      .map(([tipo, cantidad]) => ({ tipo, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad || a.tipo.localeCompare(b.tipo, 'es')),
    incidencias: grupo.incidencias,
  }));

  ranking.sort(compararRanking);

  return ranking.map((area, indice) => ({ posicion: indice + 1, ...area }));
}

/*
 * ---------------------------------------------------------------------------
 * Tiempos promedio de resolución (Sprint 7, 09/11/2026)
 *
 * Cuánto se tarda en resolver un ticket: desde que se registra hasta que se
 * cierra. La cuenta (AVG + GROUP BY) la hace la base, en la función
 * estadistica_tiempos_resolucion (supabase/migrations/20261109120000_...).
 * Acá sólo se validan las fechas, se llama a la función y se ordena la
 * respuesta. Las reglas están en .claude/contexto/dominio.md.
 *
 * Los tiempos viajan en segundos. El formato legible ("2 d 4 h") lo arma la
 * pantalla.
 * ---------------------------------------------------------------------------
 */

/**
 * Una fecha sola ("2026-11-09") es un día de la facultad, que está en la hora
 * de Argentina (UTC-3, sin horario de verano). Una fecha con hora tiene que
 * traer su zona ("Z" o "-03:00"): sin zona, el servidor la leería en la suya y
 * el resultado dependería de dónde corre la API.
 */
const ZONA_FACULTAD = '-03:00';
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const FECHA_CON_HORA = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;

/** El día existe de verdad (no es un 31/02). */
function diaExiste(texto) {
  const [anio, mes, dia] = texto.slice(0, 10).split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, mes - 1, dia));
  return fecha.getUTCFullYear() === anio && fecha.getUTCMonth() === mes - 1 && fecha.getUTCDate() === dia;
}

/**
 * Un extremo del período como instante ISO, o null si no vino.
 * Una fecha sola se toma entera: "desde" a las 00:00 y "hasta" a las
 * 23:59:59.999, así los dos bordes quedan incluidos.
 */
function extremoDelPeriodo(valor, nombre, esFinal) {
  if (valor == null || valor === '') return null;

  const texto = String(valor).trim();
  const invalida = datoInvalido(
    `La fecha "${nombre}" no es válida. Usá el formato AAAA-MM-DD (por ejemplo, 2026-11-09).`
  );

  if (SOLO_FECHA.test(texto)) {
    if (!diaExiste(texto)) throw invalida;
    const hora = esFinal ? 'T23:59:59.999' : 'T00:00:00.000';
    return new Date(`${texto}${hora}${ZONA_FACULTAD}`).toISOString();
  }

  if (FECHA_CON_HORA.test(texto) && diaExiste(texto)) {
    const fecha = new Date(texto);
    if (!Number.isNaN(fecha.getTime())) return fecha.toISOString();
  }

  throw invalida;
}

/** Los textos de las filas que no son un área, un tipo o un técnico de verdad. */
const SIN_DATO = {
  area: 'Sin área',
  tipoActivo: 'Sin tipo',
  tecnico: 'Sin asignar',
};

function aFila(fila, textoSinDato) {
  const sinDato = fila.id == null;
  return {
    id: sinDato ? null : fila.id,
    nombre: sinDato ? textoSinDato : fila.nombre,
    ...(fila.edificio !== undefined ? { edificio: fila.edificio ?? '' } : {}),
    promedioSegundos: Number(fila.promedio_segundos),
    cantidadTickets: Number(fila.cantidad_tickets),
  };
}

/** De mayor a menor tiempo; las filas "Sin ..." siempre al final. */
function compararPorPromedio(a, b) {
  if ((a.id === null) !== (b.id === null)) return a.id === null ? 1 : -1;
  return (
    b.promedioSegundos - a.promedioSegundos ||
    b.cantidadTickets - a.cantidadTickets ||
    a.nombre.localeCompare(b.nombre, 'es')
  );
}

function desglose(filas, textoSinDato) {
  return (filas ?? []).map((fila) => aFila(fila, textoSinDato)).sort(compararPorPromedio);
}

/**
 * El tiempo promedio de resolución de los tickets cerrados en el período,
 * general y desglosado por área, por tipo de activo y por técnico.
 *
 * Si no hay tickets cerrados en el período, el promedio general es null (no
 * 0) y los desgloses vienen vacíos.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.desde] - "2026-11-01" o un ISO con zona: cerrados desde ese momento (inclusive)
 * @param {string} [filtros.hasta] - "2026-11-30" o un ISO con zona: cerrados hasta ese momento (inclusive)
 */
export async function obtenerTiemposResolucion(filtros = {}) {
  const desde = extremoDelPeriodo(filtros.desde, 'desde', false);
  const hasta = extremoDelPeriodo(filtros.hasta, 'hasta', true);
  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  const { data, error } = await supabase.rpc('estadistica_tiempos_resolucion', {
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw errorDeBase(error, 'de los tiempos de resolución');

  const cantidad = Number(data?.general?.cantidad_tickets ?? 0);

  return {
    desde,
    hasta,
    general: {
      promedioSegundos: cantidad > 0 ? Number(data.general.promedio_segundos) : null,
      cantidadTickets: cantidad,
    },
    porArea: desglose(data?.por_area, SIN_DATO.area),
    porTipoActivo: desglose(data?.por_tipo_activo, SIN_DATO.tipoActivo),
    porTecnico: desglose(data?.por_tecnico, SIN_DATO.tecnico),
  };
}

/**
 * Catálogo formal de definiciones de métricas (S3, S15).
 * Se serializa en metadatos para que la UI y el archivo .xlsx lean la misma fuente de verdad.
 */
export const DEFINICIONES_METRICAS = [
  { id: 'M-01', nombre: 'Tasa de operatividad de activos', formula: '(Activos operativos / Activos en servicio) * 100', origen: 'activo.activo_estado', tipoGrafico: 'KPI' },
  { id: 'M-02', nombre: 'Distribución de activos por estado', formula: 'Conteo de activos por estado', origen: 'activo.activo_estado', tipoGrafico: 'Dona' },
  { id: 'M-03', nombre: 'Activos inventariados por edificio', formula: 'Conteo de activos en servicio por edificio', origen: 'activo.espacio_id -> espacio.edificio_id', tipoGrafico: 'Barras horizontales' },
  { id: 'M-04', nombre: 'Ranking de áreas con mayor incidencia de fallas', formula: 'Conteo de fallas de activos por área', origen: 'falla.falla_id', tipoGrafico: 'Barras apiladas' },
  { id: 'M-05', nombre: 'Distribución de tickets por estado', formula: 'Conteo de tickets dados de alta por estado', origen: 'ticket.ticket_estado', tipoGrafico: 'Barras verticales' },
  { id: 'M-06', nombre: 'Tiempo promedio de resolución de tickets', formula: 'AVG(ticket_fecha_cierre - ticket_fecha_alta)', origen: 'ticket.ticket_fecha_alta, ticket.ticket_fecha_cierre', tipoGrafico: 'KPI / Barras horizontales' },
  { id: 'M-07', nombre: 'Cobertura de planes de mantenimiento preventivo', formula: '(Tipos con plan activo / Total tipos) * 100', origen: 'mantenimiento_preventivo.tipo_activo_id', tipoGrafico: 'KPI' },
  { id: 'M-08', nombre: 'Órdenes de trabajo por origen', formula: 'Correctivas (con ticket) vs. Preventivas (con plan)', origen: 'orden_trabajo.ticket_id, orden_trabajo.mant_prev_id', tipoGrafico: 'Dona' },
  { id: 'M-09', nombre: 'Estado operativo de órdenes de trabajo', formula: 'Conteo de OTs del período por estado', origen: 'orden_trabajo.ot_estado', tipoGrafico: 'Barras verticales' },
  { id: 'M-10', nombre: 'Órdenes de trabajo por prioridad', formula: 'Conteo de OTs no canceladas por prioridad', origen: 'orden_trabajo.ot_prioridad', tipoGrafico: 'Dona' },
  { id: 'M-11', nombre: 'Evolución temporal de generación y cierre de tickets', formula: 'Tickets creados y tickets cerrados agrupados por mes', origen: 'ticket.ticket_fecha_alta, ticket.ticket_fecha_cierre', tipoGrafico: 'Línea' },
  { id: 'M-12', nombre: 'Tasa de cumplimiento y estado de tareas', formula: 'Conteo de tareas de OTs por estado', origen: 'tarea_ot.tarea_estado', tipoGrafico: 'Barras horizontales' },
  { id: 'M-13', nombre: 'Distribución de fallas por tipo', formula: 'Conteo de fallas por categoría', origen: 'falla.falla_tipo', tipoGrafico: 'Barras horizontales / Dona' },
  { id: 'M-14', nombre: 'Carga de trabajo activa por técnico', formula: 'Tareas asignadas no concluidas por técnico', origen: 'tecnico_asignado_tarea_ot', tipoGrafico: 'Barras horizontales' },
  { id: 'M-15', nombre: 'Índice de disponibilidad del plantel técnico', formula: '(Técnicos disponibles / Total de técnicos) * 100', origen: 'tecnico.tecnico_disponibilidad', tipoGrafico: 'KPI' },
  { id: 'M-16', nombre: 'Materiales críticos bajo stock mínimo', formula: 'Materiales con stock_actual <= stock_minimo', origen: 'material.mat_stock_actual, material.mat_stock_min', tipoGrafico: 'KPI / Tabla' },
];

/**
 * Resumen general de KPIs instantáneos (M-01, M-07, M-15, M-16).
 */
export async function obtenerResumenGeneral() {
  const { data, error } = await supabase.rpc('estadistica_resumen_general');
  if (error) throw errorDeBase(error, 'del resumen general del panel');
  return data;
}

/**
 * Distribución de activos por estado (M-02) y por edificio (M-03).
 */
export async function obtenerDistribucionActivos() {
  const { data, error } = await supabase.rpc('estadistica_distribucion_activos');
  if (error) throw errorDeBase(error, 'de la distribución de activos');
  return data;
}

/**
 * Distribución de órdenes de trabajo por origen, estado, prioridad y cumplimiento (M-08, M-09, M-10, M-12).
 */
export async function obtenerOrdenesTrabajo(filtros = {}) {
  const desde = extremoDelPeriodo(filtros.desde, 'desde', false);
  const hasta = extremoDelPeriodo(filtros.hasta, 'hasta', true);
  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  const { data, error } = await supabase.rpc('estadistica_ordenes_trabajo', {
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw errorDeBase(error, 'de las órdenes de trabajo');
  return data;
}

/**
 * Evolución mensual de tickets (M-11) y distribución por estado en el período (M-05).
 */
export async function obtenerEvolucionTickets(filtros = {}) {
  const desde = extremoDelPeriodo(filtros.desde, 'desde', false);
  const hasta = extremoDelPeriodo(filtros.hasta, 'hasta', true);
  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  const { data, error } = await supabase.rpc('estadistica_evolucion_tickets', {
    p_desde: desde,
    p_hasta: hasta,
  });
  if (error) throw errorDeBase(error, 'de la evolución de tickets');
  return data;
}

/**
 * Distribución de carga de trabajo activa por técnico (M-14).
 */
export async function obtenerCargaTecnicos() {
  const { data, error } = await supabase.rpc('estadistica_carga_tecnicos');
  if (error) throw errorDeBase(error, 'de la carga de trabajo técnica');
  return data;
}

/**
 * Payload consolidado del panel completo para visualización y exportación .xlsx (S13, S14, S15).
 */
export async function obtenerPanelCompleto(filtros = {}) {
  const desde = extremoDelPeriodo(filtros.desde, 'desde', false);
  const hasta = extremoDelPeriodo(filtros.hasta, 'hasta', true);
  if (desde && hasta && desde > hasta) {
    throw datoInvalido('La fecha "desde" no puede ser posterior a la fecha "hasta".');
  }

  const [resumenGeneral, distribucionActivos, ordenesTrabajo, evolucionTickets, cargaTecnicos, areasIncidencia, tiemposResolucion] =
    await Promise.all([
      obtenerResumenGeneral(),
      obtenerDistribucionActivos(),
      obtenerOrdenesTrabajo({ desde, hasta }),
      obtenerEvolucionTickets({ desde, hasta }),
      obtenerCargaTecnicos(),
      obtenerAreasConMayorIncidencia({ desde, hasta, tipoFalla: filtros.tipoFalla }),
      obtenerTiemposResolucion({ desde, hasta }),
    ]);

  return {
    datos: {
      resumenGeneral,
      activos: distribucionActivos,
      ordenesTrabajo,
      evolucionTickets,
      cargaTecnicos,
      areasIncidencia,
      tiemposResolucion,
    },
    metadatos: {
      alcance: 'Todo el sistema',
      zonaHoraria: 'America/Argentina/Buenos_Aires',
      generadoEn: new Date().toISOString(),
      versionSistema: '0.1.0',
      commit: '899b562d0c76832de809bf99f3e5875703e503e7',
      filtros: {
        desde: desde ? desde.slice(0, 10) : null,
        hasta: hasta ? hasta.slice(0, 10) : null,
        tipoFalla: filtros.tipoFalla ?? null,
      },
      definiciones: DEFINICIONES_METRICAS,
    },
  };
}
