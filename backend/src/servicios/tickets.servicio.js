import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado } from '../utiles/errores.js';
import * as ordenesTrabajo from './ordenesTrabajo.servicio.js';
import { ENUM_ESTADO_ACTIVO, ENUM_ESTADO_OT, ENUM_ESTADO_TICKET } from '../utiles/enumerados.js';

/**
 * Los estados por los que pasa un ticket (ver .claude/contexto/dominio.md).
 * Todo ticket nace en "Creado": es el que todavia no fue validado y espera la
 * decision del administrador.
 *
 * En la base el estado es un numero (1=Creado ... 7=Rechazado); la traduccion
 * esta en utiles/enumerados.js. Los viejos 'ABIERTO' pasaron a 1=Creado en la
 * migracion del 07/10/2026.
 */
export const ESTADOS = ENUM_ESTADO_TICKET.textos;
export const ESTADO_INICIAL = 'Creado';

/** El texto del estado guardado en la base. */
function normalizarEstado(codigo) {
  return ENUM_ESTADO_TICKET.texto(codigo) ?? ESTADO_INICIAL;
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
          estado: ENUM_ESTADO_ACTIVO.texto(activo.activo_estado) ?? '',
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
          estado: ENUM_ESTADO_OT.texto(ot.ot_estado),
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
export async function obtenerTodos(filtros = {}, usuario = null) {
  const columnas = filtros.idArea ? COLUMNAS_CON_AREA : COLUMNAS;

  let consulta = supabase
    .from('ticket')
    .select(columnas)
    .order('ticket_fecha_alta', { ascending: false });

  // Si el usuario es un autorizado, solo puede ver los tickets que el mismo creo
  if (usuario?.rol === 'autorizado') {
    consulta = consulta.eq('autorizado_legajo', usuario.identificador);
  } else if (filtros.autorizadoLegajo) {
    consulta = consulta.eq('autorizado_legajo', filtros.autorizadoLegajo);
  }

  if (filtros.estado) {
    consulta = consulta.eq('ticket_estado', ENUM_ESTADO_TICKET.codigo(filtros.estado));
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

export async function obtenerPorId(id, usuario = null) {
  const { data, error } = await supabase
    .from('ticket')
    .select(COLUMNAS)
    .eq('ticket_id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el ticket ${id}.`);

  const ticket = aTicket(data);

  // Si es un usuario autorizado, solo puede ver tickets de su propia autoría
  if (usuario?.rol === 'autorizado' && ticket.registradoPor?.legajo !== usuario.identificador) {
    throw noEncontrado(`No existe el ticket ${id}.`);
  }

  return ticket;
}

export async function crear(datos, usuario = null) {
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

  if (!codigoActivo) {
    throw datoInvalido('El modelo de datos actual exige que todo ticket esté asociado a un activo.');
  }

  // Si el usuario es autorizado, usamos su identificador (legajo). Si es admin, puede usar el del form o '0000'
  const legajoAutorizado = usuario?.rol === 'autorizado'
    ? usuario.identificador
    : (datos.autorizadoLegajo || usuario?.identificador || '0000');

  const { data, error } = await supabase.from('ticket').insert({
    activo_codigo: codigoActivo,
    autorizado_legajo: legajoAutorizado,
    ticket_desc: descripcion,
    ticket_estado: ENUM_ESTADO_TICKET.codigo(ESTADO_INICIAL),
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
 * Pasa a estado 'Validado' y se le genera la orden de trabajo (HU-14).
 *
 * El orden importa: primero se valida, que es lo que se vino a hacer, y recien
 * despues se genera la OT. Si la OT falla, el ticket igual queda validado y se
 * avisa con todas las letras: desde el detalle del ticket se puede generar a
 * mano con el boton "Crear OT".
 */
export async function validar(id) {
  const ticket = await obtenerPorId(id);

  if (ticket.estado !== ESTADO_INICIAL) {
    throw datoInvalido(`El ticket solo se puede validar si está en estado ${ESTADO_INICIAL}. Estado actual: ${ticket.estado}`);
  }

  const { error } = await supabase
    .from('ticket')
    .update({ ticket_estado: ENUM_ESTADO_TICKET.codigo('Validado') })
    .eq('ticket_id', id)
    .select('ticket_id')
    .single();

  if (error) {
    throw new Error(error.message);
  }

  try {
    await ordenesTrabajo.crearDesdeTicket(id);
  } catch (fallo) {
    throw new Error(
      `El ticket ${id} se validó, pero no se pudo generar la orden de trabajo: ${fallo.message} ` +
        'Podés generarla desde el detalle del ticket, con el botón "Crear OT".'
    );
  }

  // Se vuelve a leer para devolver el ticket ya con su OT.
  return obtenerPorId(id);
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
      ticket_estado: ENUM_ESTADO_TICKET.codigo('Rechazado'),
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
