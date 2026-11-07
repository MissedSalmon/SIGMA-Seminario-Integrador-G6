import { supabase } from '../config/supabase.js';
import { datoInvalido } from '../utiles/errores.js';
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
