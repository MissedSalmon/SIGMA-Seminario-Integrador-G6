import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado } from '../utiles/errores.js';

/**
 * Los estados por los que pasa un ticket (ver .claude/contexto/dominio.md).
 * Todo ticket nace en "Creado": es el que todavia no fue validado y espera la
 * decision del administrador.
 */
export const ESTADOS = [
  'Creado',
  'Validado',
  'Asignado',
  'En ejecución',
  'Finalizado',
  'Cerrado',
  'Rechazado',
];
export const ESTADO_INICIAL = 'Creado';

/**
 * La tabla ticket tiene como default 'ABIERTO', y los primeros tickets
 * quedaron guardados asi. Para el sistema son lo mismo que "Creado": al leer
 * se traducen, y al filtrar por "Creado" se incluyen.
 */
const ALIAS_ESTADO = { ABIERTO: ESTADO_INICIAL };

function normalizarEstado(estado) {
  return ALIAS_ESTADO[estado] ?? estado ?? ESTADO_INICIAL;
}

/** Los valores que hay que buscar en la base para un estado dado. */
function valoresEnBase(estado) {
  const alias = Object.keys(ALIAS_ESTADO).filter((clave) => ALIAS_ESTADO[clave] === estado);
  return [estado, ...alias];
}

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/**
 * El ticket con todo lo que se muestra: el activo (con su tipo y su
 * ubicacion), quien lo registro y la OT si ya se genero.
 *
 * El area no esta en el ticket: se deduce de donde esta el activo
 * (area.espacio_id), decision del 13/09/2026. Como varias areas pueden
 * compartir un espacio, viene como lista.
 */
const COLUMNAS = `
  ticket_id,
  activo_codigo,
  autorizado_legajo,
  ticket_fecha_alta,
  ticket_desc,
  ticket_estado,
  ticket_evidencia,
  activo (
    activo_codigo,
    activo_estado,
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
  autorizado (
    autorizado_legajo,
    autorizado_nom_ape
  ),
  orden_trabajo (
    ot_id,
    ot_estado,
    ot_fecha_alta,
    ot_fecha_cierre,
    ot_desc
  )
`;

/**
 * Para filtrar por area hay que forzar el join (!inner) en toda la cadena
 * ticket -> activo -> espacio -> area; si no, Supabase devuelve el ticket
 * igual, con el area vacia.
 */
const COLUMNAS_CON_AREA = COLUMNAS.replace('\n  activo (', '\n  activo!inner (')
  .replace('\n    espacio (', '\n    espacio!inner (')
  .replace('\n      area (', '\n      area!inner (');

function aTicket(fila) {
  const activo = fila.activo ?? null;
  const espacio = activo?.espacio ?? null;
  const areas = espacio?.area ?? [];
  const autorizado = fila.autorizado ?? null;
  // Un ticket tiene a lo sumo una OT, pero la relacion viene como lista.
  const ot = Array.isArray(fila.orden_trabajo) ? fila.orden_trabajo[0] ?? null : fila.orden_trabajo;

  let descripcion = fila.ticket_desc;
  let motivoRechazo = null;
  const separador = '\n\n--- MOTIVO DE RECHAZO ---\n';
  if (descripcion && descripcion.includes(separador)) {
    const partes = descripcion.split(separador);
    descripcion = partes[0];
    motivoRechazo = partes.slice(1).join(separador);
  }

  return {
    id: fila.ticket_id,
    estado: normalizarEstado(fila.ticket_estado),
    fechaAlta: fila.ticket_fecha_alta,
    descripcion,
    motivoRechazo,
    evidencia: fila.ticket_evidencia ?? null,
    codigoActivo: fila.activo_codigo,
    activo: activo
      ? {
          codigo: activo.activo_codigo,
          nombreTipo: activo.tipo_activo?.tipo_activo_nom ?? '',
          estado: activo.activo_estado ?? '',
          nombreEdificio: espacio?.edificio?.edificio_nom ?? '',
          espacio_num: espacio?.espacio_num ?? '',
        }
      : null,
    idArea: areas[0]?.area_id ?? null,
    nombreArea: areas.map((area) => area.area_nom).join(' / '),
    registradoPor: autorizado
      ? { legajo: autorizado.autorizado_legajo, nombre: autorizado.autorizado_nom_ape }
      : { legajo: fila.autorizado_legajo, nombre: '' },
    ot: ot
      ? {
          id: ot.ot_id,
          estado: ot.ot_estado,
          fechaAlta: ot.ot_fecha_alta,
          fechaCierre: ot.ot_fecha_cierre,
          descripcion: ot.ot_desc,
        }
      : null,
  };
}

/**
 * Lista los tickets, del mas nuevo al mas viejo. Los filtros se combinan:
 * si vienen varios, tienen que cumplirse todos.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.estado]        - uno de ESTADOS
 * @param {string} [filtros.desde]         - fecha/hora ISO: tickets dados de alta desde ese momento
 * @param {string} [filtros.hasta]         - fecha/hora ISO: tickets dados de alta hasta ese momento
 * @param {string} [filtros.codigoActivo]
 * @param {number} [filtros.idArea]
 */
export async function obtenerTodos(filtros = {}) {
  const columnas = filtros.idArea ? COLUMNAS_CON_AREA : COLUMNAS;

  let consulta = supabase
    .from('ticket')
    .select(columnas)
    .order('ticket_fecha_alta', { ascending: false });

  if (filtros.estado) {
    consulta = consulta.in('ticket_estado', valoresEnBase(filtros.estado));
  }

  if (filtros.desde) {
    consulta = consulta.gte('ticket_fecha_alta', filtros.desde);
  }

  if (filtros.hasta) {
    consulta = consulta.lte('ticket_fecha_alta', filtros.hasta);
  }

  if (filtros.codigoActivo) {
    consulta = consulta.eq('activo_codigo', filtros.codigoActivo);
  }

  if (filtros.idArea) {
    consulta = consulta.eq('activo.espacio.area.area_id', filtros.idArea);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  return data.map(aTicket);
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('ticket')
    .select(COLUMNAS)
    .eq('ticket_id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el ticket ${id}.`);

  return aTicket(data);
}

export async function crear(datos) {
  const codigoActivo = limpiar(datos.codigoActivo);
  const idEdificio = datos.idEdificio ? Number(datos.idEdificio) : null;
  const espacioNum = limpiar(datos.espacioNum);
  const descripcion = limpiar(datos.descripcion);
  const evidencia = limpiar(datos.evidencia);

  if (!descripcion) {
    throw datoInvalido('La descripción del problema es obligatoria.');
  }

  if (!codigoActivo && (!idEdificio || !espacioNum)) {
    throw datoInvalido('Debe indicar el activo o el espacio afectado.');
  }

  // OJO: La base de datos actual (refactor_modelo_mantenimiento.sql)
  // exige que activo_codigo y autorizado_legajo NO sean nulos.
  // Si el frontend envía un "espacio" en lugar de un "activo", fallará
  // a menos que modifiquemos la BD.
  // Por ahora, usaremos un autorizado ficticio si no viene, y
  // lanzaremos error si intentan guardar un ticket de espacio sin modificar la BD.

  if (!codigoActivo) {
    throw datoInvalido('El modelo de datos actual exige que todo ticket esté asociado a un activo.');
  }

  const { data, error } = await supabase.from('ticket').insert({
    activo_codigo: codigoActivo,
    autorizado_legajo: '0000', // Reemplazar con el usuario logueado en el futuro
    ticket_desc: descripcion,
    ticket_estado: ESTADO_INICIAL,
    ticket_evidencia: evidencia
  }).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.ticket_id,
    codigoActivo: data.activo_codigo,
    descripcion: data.ticket_desc,
    estado: normalizarEstado(data.ticket_estado),
    evidencia: data.ticket_evidencia,
    fechaAlta: data.ticket_fecha_alta
  };
}

/**
 * Valida un ticket que esta en estado 'Creado'.
 * Pasa a estado 'Validado'.
 */
export async function validar(id) {
  const ticket = await obtenerPorId(id);
  
  if (ticket.estado !== ESTADO_INICIAL) {
    throw datoInvalido(`El ticket solo se puede validar si está en estado ${ESTADO_INICIAL}. Estado actual: ${ticket.estado}`);
  }

  const { data, error } = await supabase
    .from('ticket')
    .update({ ticket_estado: 'Validado' })
    .eq('ticket_id', id)
    .select(COLUMNAS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return aTicket(data);
}

/**
 * Rechaza un ticket que esta en estado 'Creado'.
 * Requiere un motivo de rechazo y pasa a estado 'Rechazado'.
 */
export async function rechazar(id, motivo) {
  const motivoLimpio = limpiar(motivo);
  if (!motivoLimpio) {
    throw datoInvalido('Debe indicar el motivo del rechazo.');
  }

  const ticket = await obtenerPorId(id);
  
  if (ticket.estado !== ESTADO_INICIAL) {
    throw datoInvalido(`El ticket solo se puede rechazar si está en estado ${ESTADO_INICIAL}. Estado actual: ${ticket.estado}`);
  }

  const { data, error } = await supabase
    .from('ticket')
    .update({
      ticket_estado: 'Rechazado',
      ticket_desc: ticket.descripcion + '\n\n--- MOTIVO DE RECHAZO ---\n' + motivoLimpio
    })
    .eq('ticket_id', id)
    .select(COLUMNAS)
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return aTicket(data);
}
