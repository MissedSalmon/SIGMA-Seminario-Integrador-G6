import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

/**
 * Ordenes de trabajo (HU-14: crear la OT a partir de un ticket).
 *
 * La OT nace sola al validar el ticket (ver dominio.md, "Automatismos") y
 * arranca vacia: lo que se planifica despues son sus TAREAS, y ahi va todo lo
 * que la HU absorbio de las viejas HU-18, HU-19 y HU-20:
 *
 *   - que hay que hacer  -> tarea_desc
 *   - con que urgencia   -> tarea_prioridad (Alta / Media / Baja)
 *   - quien la hace      -> un tecnico propio O un prestador externo
 *   - para cuando        -> tarea_fecha_ini / tarea_fecha_fin
 *
 * DECISION (21/09/2026): la prioridad es de la TAREA, no de la OT. La tabla
 * `tarea_ot` ya tiene `tarea_prioridad` y una misma OT puede tener una tarea
 * urgente y otra que puede esperar. La OT muestra la prioridad mas alta de sus
 * tareas (`prioridad`), que se calcula aca y no se guarda.
 */

/** Los estados de una OT (ver .claude/contexto/dominio.md). */
export const ESTADOS = ['Creada', 'Asignada', 'En ejecución', 'Finalizada', 'Cancelada'];
export const ESTADO_INICIAL = 'Creada';

/** Los estados de una tarea de la OT. */
export const ESTADOS_TAREA = ['Pendiente', 'En ejecución', 'Completada'];
export const ESTADO_TAREA_INICIAL = 'Pendiente';

/** De mas urgente a menos. El orden importa: con el se calcula la de la OT. */
export const PRIORIDADES = ['Alta', 'Media', 'Baja'];
export const PRIORIDAD_POR_DEFECTO = 'Media';

/**
 * La base guarda los valores por defecto en mayuscula ('PENDIENTE', 'MEDIA'),
 * igual que paso con los tickets. Para el sistema son los mismos: al leer se
 * traducen y al filtrar se buscan las dos formas. No se toca la base.
 */
const ALIAS_ESTADO = { PENDIENTE: 'Creada' };
const ALIAS_ESTADO_TAREA = { PENDIENTE: 'Pendiente' };
const ALIAS_PRIORIDAD = { ALTA: 'Alta', MEDIA: 'Media', BAJA: 'Baja' };

/*
 * Los dos estados del TICKET que toca este modulo. Estan escritos aca a mano, y
 * no importados de tickets.servicio.js, para no cruzar los dos archivos: es
 * tickets el que importa a este, no al reves.
 */
const TICKET_VALIDADO = 'Validado';
const TICKET_ASIGNADO = 'Asignado';

/**
 * El estado viejo de la tabla ticket: los primeros tickets quedaron guardados
 * como 'ABIERTO' y para el sistema son lo mismo que "Creado".
 */
const TICKET_ALIAS = { ABIERTO: 'Creado' };

/** Una OT en estos estados ya no se planifica: no se le tocan las tareas. */
const ESTADOS_CERRADOS = ['Finalizada', 'Cancelada'];

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/**
 * El dia de una fecha, sin la hora: de "2026-09-22" y de
 * "2026-09-22T00:00:00+00:00" sale "2026-09-22".
 *
 * Asi escritas, dos fechas se comparan como texto y da lo mismo que una venga
 * del almanaque de la pantalla y la otra de la base.
 */
function soloElDia(valor) {
  return valor ? String(valor).slice(0, 10) : '';
}

/** El dia de hoy, escrito igual: "2026-09-21". */
function hoyEnTexto() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');

  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function normalizarEstado(estado) {
  return ALIAS_ESTADO[estado] ?? estado ?? ESTADO_INICIAL;
}

function normalizarEstadoTarea(estado) {
  return ALIAS_ESTADO_TAREA[estado] ?? estado ?? ESTADO_TAREA_INICIAL;
}

function normalizarPrioridad(prioridad) {
  return ALIAS_PRIORIDAD[prioridad] ?? prioridad ?? PRIORIDAD_POR_DEFECTO;
}

/** Los valores que hay que buscar en la base para un estado dado. */
function valoresEnBase(estado) {
  const alias = Object.keys(ALIAS_ESTADO).filter((clave) => ALIAS_ESTADO[clave] === estado);
  return [estado, ...alias];
}

/**
 * La OT con el ticket que la origino (y, colgando de el, el activo, donde esta
 * y quien reporto el problema) y con sus tareas.
 *
 * El prestador viene embebido en la tarea porque es una FK de una sola
 * columna. El tecnico NO: se asigna en `tecnico_asignado_tarea_ot`, que apunta
 * a la tarea con dos columnas (ot_id, tarea_id), asi que se trae aparte (ver
 * `asignacionesDe`).
 */
const COLUMNAS = `
  ot_id,
  ticket_id,
  mant_prev_id,
  ot_fecha_alta,
  ot_fecha_cierre,
  ot_estado,
  ot_desc,
  ticket (
    ticket_id,
    ticket_desc,
    ticket_estado,
    ticket_fecha_alta,
    activo_codigo,
    activo (
      activo_codigo,
      activo_estado,
      tipo_activo_id,
      tipo_activo (
        tipo_activo_nom
      ),
      espacio (
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
    )
  ),
  tarea_ot (
    ot_id,
    tarea_id,
    tarea_plan_id,
    prestador_serv_id,
    tarea_hom,
    tarea_desc,
    tarea_estado,
    tarea_prioridad,
    tarea_fecha_ini,
    tarea_fecha_fin,
    prestador_servicio (
      prestador_serv_id,
      prestador_serv_nom
    ),
    plantilla_de_tarea (
      tarea_plan_id,
      tarea_plan_nom
    )
  )
`;

/** Los tecnicos asignados a las tareas de esas OT, en una sola consulta. */
async function asignacionesDe(idsOt) {
  if (idsOt.length === 0) return [];

  const { data, error } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .select(
      `
      ot_id,
      tarea_id,
      tecnico_legajo,
      tec_asig_fecha_asig,
      tec_asig_estado,
      tecnico (
        tecnico_legajo,
        tecnico_nom_ape,
        tecnico_disponibilidad
      )
    `
    )
    .in('ot_id', idsOt);

  if (error) throw new Error(error.message);
  return data ?? [];
}

/** La mas alta de una lista de prioridades. Sin tareas no hay prioridad. */
function prioridadMasAlta(prioridades) {
  for (const prioridad of PRIORIDADES) {
    if (prioridades.includes(prioridad)) return prioridad;
  }
  return null;
}

function aTarea(fila, asignaciones) {
  const asignacion = asignaciones.find(
    (item) => item.ot_id === fila.ot_id && item.tarea_id === fila.tarea_id
  );

  let responsable = null;

  if (asignacion) {
    responsable = {
      tipo: 'Técnico',
      legajo: asignacion.tecnico_legajo,
      nombre: asignacion.tecnico?.tecnico_nom_ape ?? '',
    };
  } else if (fila.prestador_serv_id) {
    responsable = {
      tipo: 'Prestador',
      idPrestador: fila.prestador_serv_id,
      nombre: fila.prestador_servicio?.prestador_serv_nom ?? '',
    };
  }

  return {
    idOt: fila.ot_id,
    idTarea: fila.tarea_id,
    descripcion: fila.tarea_desc,
    estado: normalizarEstadoTarea(fila.tarea_estado),
    prioridad: normalizarPrioridad(fila.tarea_prioridad),
    horasEstimadas: fila.tarea_hom === null ? null : Number(fila.tarea_hom),
    fechaInicio: fila.tarea_fecha_ini,
    fechaFin: fila.tarea_fecha_fin,
    idPlantilla: fila.tarea_plan_id,
    nombrePlantilla: fila.plantilla_de_tarea?.tarea_plan_nom ?? null,
    responsable,
  };
}

function aOrden(fila, asignaciones = []) {
  const ticket = fila.ticket ?? null;
  const activo = ticket?.activo ?? null;
  const espacio = activo?.espacio ?? null;
  const areas = espacio?.area ?? [];
  const autorizado = ticket?.autorizado ?? null;

  /*
   * Las tareas van por prioridad: primero las Alta, después las Media y al
   * final las Baja (26/09/2026). Dentro de la misma prioridad, por número.
   */
  const lugarDe = (prioridad) => {
    const lugar = PRIORIDADES.indexOf(prioridad);
    return lugar === -1 ? PRIORIDADES.length : lugar;
  };

  const tareas = (fila.tarea_ot ?? [])
    .map((tarea) => aTarea(tarea, asignaciones))
    .sort(
      (una, otra) => lugarDe(una.prioridad) - lugarDe(otra.prioridad) || una.idTarea - otra.idTarea
    );

  return {
    id: fila.ot_id,
    estado: normalizarEstado(fila.ot_estado),
    fechaAlta: fila.ot_fecha_alta,
    fechaCierre: fila.ot_fecha_cierre,
    descripcion: fila.ot_desc,
    origen: fila.ticket_id ? 'Ticket' : 'Mantenimiento preventivo',
    idTicket: fila.ticket_id,
    idMantenimientoPreventivo: fila.mant_prev_id,
    ticket: ticket
      ? {
          id: ticket.ticket_id,
          descripcion: ticket.ticket_desc,
          estado: ticket.ticket_estado,
          fechaAlta: ticket.ticket_fecha_alta,
        }
      : null,
    codigoActivo: ticket?.activo_codigo ?? null,
    activo: activo
      ? {
          codigo: activo.activo_codigo,
          estado: activo.activo_estado ?? '',
          idTipoActivo: activo.tipo_activo_id,
          nombreTipo: activo.tipo_activo?.tipo_activo_nom ?? '',
          nombreEdificio: espacio?.edificio?.edificio_nom ?? '',
          espacio_num: espacio?.espacio_num ?? '',
        }
      : null,
    nombreArea: areas.map((area) => area.area_nom).join(' / '),
    registradoPor: autorizado
      ? { legajo: autorizado.autorizado_legajo, nombre: autorizado.autorizado_nom_ape }
      : null,
    tareas,
    cantidadTareas: tareas.length,
    tareasSinResponsable: tareas.filter((tarea) => !tarea.responsable).length,
    prioridad: prioridadMasAlta(tareas.map((tarea) => tarea.prioridad)),
  };
}

/**
 * Lista las ordenes de trabajo, de la mas nueva a la mas vieja.
 *
 * El estado y las fechas los filtra la base. La prioridad y el activo se
 * filtran aca, ya con las tareas en la mano: la prioridad de la OT no esta
 * guardada (sale de sus tareas) y el activo cuelga del ticket, dos niveles mas
 * abajo. Son listas chicas, asi que no se justifica complicar la consulta.
 *
 * @param {object} [filtros]
 * @param {string} [filtros.estado]        - uno de ESTADOS
 * @param {string} [filtros.prioridad]     - una de PRIORIDADES
 * @param {string} [filtros.codigoActivo]
 * @param {string} [filtros.desde]         - fecha/hora ISO
 * @param {string} [filtros.hasta]         - fecha/hora ISO
 */
export async function obtenerTodas(filtros = {}) {
  let consulta = supabase
    .from('orden_trabajo')
    .select(COLUMNAS)
    .order('ot_fecha_alta', { ascending: false });

  if (filtros.estado) consulta = consulta.in('ot_estado', valoresEnBase(filtros.estado));
  if (filtros.desde) consulta = consulta.gte('ot_fecha_alta', filtros.desde);
  if (filtros.hasta) consulta = consulta.lte('ot_fecha_alta', filtros.hasta);

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  const asignaciones = await asignacionesDe((data ?? []).map((fila) => fila.ot_id));
  let ordenes = (data ?? []).map((fila) => aOrden(fila, asignaciones));

  if (filtros.prioridad) {
    ordenes = ordenes.filter((orden) => orden.prioridad === filtros.prioridad);
  }

  if (filtros.codigoActivo) {
    ordenes = ordenes.filter((orden) => orden.codigoActivo === filtros.codigoActivo);
  }

  return ordenes;
}

export async function obtenerPorId(id) {
  const { data, error } = await supabase
    .from('orden_trabajo')
    .select(COLUMNAS)
    .eq('ot_id', id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la orden de trabajo ${id}.`);

  return aOrden(data, await asignacionesDe([data.ot_id]));
}

/** La OT de un ticket, o null si todavia no se genero. */
export async function obtenerPorTicket(idTicket) {
  const { data, error } = await supabase
    .from('orden_trabajo')
    .select('ot_id')
    .eq('ticket_id', idTicket)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return obtenerPorId(data.ot_id);
}

/**
 * Genera la OT de un ticket validado.
 *
 * La llama sola `tickets.servicio.js` al validar (es el automatismo del flujo)
 * y tambien la pantalla del ticket, con el boton "Crear OT": eso es para los
 * tickets que quedaron validados sin OT, por ejemplo si el automatismo fallo.
 *
 * La OT nace vacia y en "Creada". Las tareas se cargan despues.
 */
export async function crearDesdeTicket(idTicket, datos = {}) {
  const { data: ticket, error: errorTicket } = await supabase
    .from('ticket')
    .select('ticket_id, ticket_desc, ticket_estado')
    .eq('ticket_id', idTicket)
    .maybeSingle();

  if (errorTicket) throw new Error(errorTicket.message);
  if (!ticket) throw noEncontrado(`No existe el ticket ${idTicket}.`);

  /*
   * La OT sale de un ticket VALIDADO y de ninguno mas (decision del
   * 21/09/2026). Antes de validarlo todavia no se sabe si el trabajo se va a
   * hacer, y una vez que el ticket avanzo (asignado, en ejecucion, cerrado) su
   * OT ya existe: si no existe, es que algo quedo mal y se arregla a mano, no
   * generando una OT nueva.
   */
  const estadoDelTicket = TICKET_ALIAS[ticket.ticket_estado] ?? ticket.ticket_estado;

  if (estadoDelTicket !== TICKET_VALIDADO) {
    throw datoInvalido(
      `Sólo se puede generar la orden de trabajo de un ticket validado. ` +
        `El ticket ${idTicket} está en estado "${estadoDelTicket}".`
    );
  }

  const { data: yaExiste, error: errorExiste } = await supabase
    .from('orden_trabajo')
    .select('ot_id')
    .eq('ticket_id', idTicket)
    .maybeSingle();

  if (errorExiste) throw new Error(errorExiste.message);
  if (yaExiste) {
    throw conflicto(`El ticket ${idTicket} ya tiene la orden de trabajo ${yaExiste.ot_id}.`);
  }

  // Sin descripcion propia, la OT arranca con el motivo que escribio quien
  // reporto el problema: es lo que hay que resolver.
  const descripcion = limpiar(datos.descripcion) ?? ticket.ticket_desc;

  const { data, error } = await supabase
    .from('orden_trabajo')
    .insert({
      ticket_id: idTicket,
      ot_desc: descripcion,
      ot_estado: ESTADO_INICIAL,
    })
    .select('ot_id')
    .single();

  if (error) throw new Error(error.message);

  return obtenerPorId(data.ot_id);
}

/** Cambia la descripcion de la OT: es lo unico suyo que se edita a mano. */
export async function actualizar(id, datos) {
  const descripcion = limpiar(datos.descripcion);
  if (!descripcion) throw datoInvalido('La descripción de la orden de trabajo es obligatoria.');

  const { data, error } = await supabase
    .from('orden_trabajo')
    .update({ ot_desc: descripcion })
    .eq('ot_id', id)
    .select('ot_id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la orden de trabajo ${id}.`);

  return obtenerPorId(id);
}

/* ------------------------------------------------------------------ *
 *  Tareas de la OT
 * ------------------------------------------------------------------ */

/** La OT tal cual esta en la base, para las validaciones de las tareas. */
async function ordenPlanificable(idOt) {
  const { data, error } = await supabase
    .from('orden_trabajo')
    .select('ot_id, ot_estado, ticket_id')
    .eq('ot_id', idOt)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe la orden de trabajo ${idOt}.`);

  const estado = normalizarEstado(data.ot_estado);
  if (ESTADOS_CERRADOS.includes(estado)) {
    throw conflicto(
      `La orden de trabajo ${idOt} está ${estado.toLowerCase()}: ya no se le pueden cambiar las tareas.`
    );
  }

  return data;
}

/**
 * Revisa y acomoda los datos de una tarea.
 *
 * El responsable es uno solo: un tecnico propio O un prestador externo, nunca
 * los dos (correccion #13 de la profe). Puede quedar sin nadie: se permite
 * cargar primero que hay que hacer y asignar despues, y mientras haya una
 * tarea sin responsable la OT sigue en "Creada".
 *
 * @param {object} datos             - lo que mando la pantalla
 * @param {object} [fechasActuales]  - las fechas que la tarea ya tenia guardadas
 *                                     (`inicio` y `fin`), al editar una tarea vieja
 */
async function validarTarea(datos, fechasActuales = {}) {
  const descripcion = limpiar(datos.descripcion);
  if (!descripcion) throw datoInvalido('La descripción de la tarea es obligatoria.');

  const prioridad = limpiar(datos.prioridad) ?? PRIORIDAD_POR_DEFECTO;
  if (!PRIORIDADES.includes(prioridad)) {
    throw datoInvalido(`"${prioridad}" no es una prioridad válida. Son: ${PRIORIDADES.join(', ')}.`);
  }

  const legajoTecnico = limpiar(datos.legajoTecnico);
  const idPrestador = datos.idPrestador ? Number(datos.idPrestador) : null;

  if (legajoTecnico && idPrestador) {
    throw datoInvalido('La tarea la hace un técnico o un prestador externo, no los dos.');
  }

  if (idPrestador !== null && !Number.isInteger(idPrestador)) {
    throw datoInvalido('El prestador elegido no es válido.');
  }

  if (legajoTecnico) {
    const { data, error } = await supabase
      .from('tecnico')
      .select('tecnico_legajo')
      .eq('tecnico_legajo', legajoTecnico)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw datoInvalido(`No existe el técnico con legajo ${legajoTecnico}.`);
  }

  if (idPrestador) {
    const { data, error } = await supabase
      .from('prestador_servicio')
      .select('prestador_serv_id')
      .eq('prestador_serv_id', idPrestador)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!data) throw datoInvalido(`No existe el prestador de servicio ${idPrestador}.`);
  }

  // La tarea estándar es obligatoria (26/09/2026).
  const idPlantilla = datos.idPlantilla ? Number(datos.idPlantilla) : null;
  if (idPlantilla === null) {
    throw datoInvalido('Hay que elegir la tarea estándar.');
  }
  if (!Number.isInteger(idPlantilla)) {
    throw datoInvalido('La plantilla elegida no es válida.');
  }

  const fechaInicio = limpiar(datos.fechaInicio);
  const fechaFin = limpiar(datos.fechaFin);

  if (fechaInicio && Number.isNaN(Date.parse(fechaInicio))) {
    throw datoInvalido('La fecha prevista de inicio no se entiende.');
  }
  if (fechaFin && Number.isNaN(Date.parse(fechaFin))) {
    throw datoInvalido('La fecha prevista de fin no se entiende.');
  }

  /*
   * Ni el inicio ni el fin pueden quedar antes de hoy: se planifica lo que
   * viene, no lo que ya pasó.
   *
   * La excepción es editar una tarea vieja: si la fecha ya estaba guardada así
   * y no se la tocó, se deja pasar. Si no, cambiar la descripción de una tarea
   * de la semana pasada obligaría a cambiarle también las fechas.
   */
  const hoy = hoyEnTexto();

  if (fechaInicio && soloElDia(fechaInicio) < hoy && soloElDia(fechaInicio) !== soloElDia(fechasActuales.inicio)) {
    throw datoInvalido('La fecha prevista de inicio no puede ser anterior a hoy.');
  }
  if (fechaFin && soloElDia(fechaFin) < hoy && soloElDia(fechaFin) !== soloElDia(fechasActuales.fin)) {
    throw datoInvalido('La fecha prevista de fin no puede ser anterior a hoy.');
  }

  if (fechaInicio && fechaFin && Date.parse(fechaFin) < Date.parse(fechaInicio)) {
    throw datoInvalido('La fecha prevista de fin no puede ser anterior a la de inicio.');
  }

  let horasEstimadas = null;
  if (datos.horasEstimadas !== undefined && datos.horasEstimadas !== null && datos.horasEstimadas !== '') {
    horasEstimadas = Number(datos.horasEstimadas);

    // La columna es NUMERIC(5,2): no entra nada de 1000 horas para arriba.
    if (Number.isNaN(horasEstimadas) || horasEstimadas <= 0 || horasEstimadas >= 1000) {
      throw datoInvalido('Las horas estimadas tienen que ser un número mayor que 0 y menor que 1000.');
    }
  }

  return {
    descripcion,
    prioridad,
    legajoTecnico,
    idPrestador,
    idPlantilla,
    fechaInicio,
    fechaFin,
    horasEstimadas,
  };
}

/**
 * El numero que le toca a la tarea nueva dentro de la OT.
 *
 * `tarea_id` no es autonumerico: es parte de la clave (ot_id, tarea_id) y
 * arranca en 1 en cada OT, asi que las tareas se leen "1, 2, 3" en la OT 7 y
 * tambien en la OT 8.
 */
async function proximoNumeroDeTarea(idOt) {
  const { data, error } = await supabase
    .from('tarea_ot')
    .select('tarea_id')
    .eq('ot_id', idOt)
    .order('tarea_id', { ascending: false })
    .limit(1);

  if (error) throw new Error(error.message);
  return (data?.[0]?.tarea_id ?? 0) + 1;
}

/** Deja como unico tecnico de la tarea al que se paso (o a ninguno). */
async function asignarTecnico(idOt, idTarea, legajoTecnico) {
  const { error: errorBorrado } = await supabase
    .from('tecnico_asignado_tarea_ot')
    .delete()
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea);

  if (errorBorrado) throw new Error(errorBorrado.message);

  if (!legajoTecnico) return;

  const { error } = await supabase.from('tecnico_asignado_tarea_ot').insert({
    ot_id: idOt,
    tarea_id: idTarea,
    tecnico_legajo: legajoTecnico,
  });

  if (error) throw new Error(error.message);
}

/**
 * Pone la OT en el estado que le corresponde segun como quedaron sus tareas, y
 * arrastra al ticket con ella.
 *
 *   sin tareas, o con alguna sin responsable  ->  Creada    (ticket Validado)
 *   todas con responsable                     ->  Asignada  (ticket Asignado)
 *
 * De "En ejecucion" en adelante no se toca nada: eso lo mueve el tecnico
 * cuando trabaja (HU-18 y HU-19), no esta pantalla.
 */
async function recalcularEstado(idOt) {
  const { data: orden, error: errorOrden } = await supabase
    .from('orden_trabajo')
    .select('ot_id, ot_estado, ticket_id')
    .eq('ot_id', idOt)
    .maybeSingle();

  if (errorOrden) throw new Error(errorOrden.message);
  if (!orden) return;

  const estadoActual = normalizarEstado(orden.ot_estado);
  if (![ESTADO_INICIAL, 'Asignada'].includes(estadoActual)) return;

  const { data: tareas, error: errorTareas } = await supabase
    .from('tarea_ot')
    .select('ot_id, tarea_id, prestador_serv_id')
    .eq('ot_id', idOt);

  if (errorTareas) throw new Error(errorTareas.message);

  const asignaciones = await asignacionesDe([idOt]);

  const todasAsignadas =
    (tareas ?? []).length > 0 &&
    (tareas ?? []).every(
      (tarea) =>
        tarea.prestador_serv_id ||
        asignaciones.some((item) => item.tarea_id === tarea.tarea_id && item.ot_id === idOt)
    );

  const estadoNuevo = todasAsignadas ? 'Asignada' : ESTADO_INICIAL;
  if (estadoNuevo === estadoActual) return;

  const { error } = await supabase
    .from('orden_trabajo')
    .update({ ot_estado: estadoNuevo })
    .eq('ot_id', idOt);

  if (error) throw new Error(error.message);

  await acompanarEstadoDelTicket(orden.ticket_id, estadoNuevo);
}

/**
 * El ticket sigue a su OT: cuando la OT queda asignada, el ticket pasa a
 * "Asignado"; si la OT vuelve a "Creada" (se borro la ultima tarea, o una
 * quedo sin responsable), el ticket vuelve a "Validado".
 *
 * Solo se mueve entre esos dos estados. Si el ticket ya esta mas adelante en
 * el flujo (en ejecucion, finalizado, cerrado) no se lo hace retroceder.
 */
async function acompanarEstadoDelTicket(idTicket, estadoDeLaOrden) {
  if (!idTicket) return;

  const esperado = estadoDeLaOrden === 'Asignada' ? TICKET_ASIGNADO : TICKET_VALIDADO;
  const desde = estadoDeLaOrden === 'Asignada' ? TICKET_VALIDADO : TICKET_ASIGNADO;

  const { error } = await supabase
    .from('ticket')
    .update({ ticket_estado: esperado })
    .eq('ticket_id', idTicket)
    .eq('ticket_estado', desde);

  if (error) throw new Error(error.message);
}

/** Agrega una tarea a la OT. */
export async function agregarTarea(idOt, datos) {
  await ordenPlanificable(idOt);

  const tarea = await validarTarea(datos);
  const idTarea = await proximoNumeroDeTarea(idOt);

  const { error } = await supabase.from('tarea_ot').insert({
    ot_id: idOt,
    tarea_id: idTarea,
    tarea_desc: tarea.descripcion,
    tarea_estado: ESTADO_TAREA_INICIAL,
    tarea_prioridad: tarea.prioridad,
    tarea_plan_id: tarea.idPlantilla,
    prestador_serv_id: tarea.idPrestador,
    tarea_hom: tarea.horasEstimadas,
    tarea_fecha_ini: tarea.fechaInicio,
    tarea_fecha_fin: tarea.fechaFin,
  });

  if (error) throw new Error(error.message);

  await asignarTecnico(idOt, idTarea, tarea.legajoTecnico);
  await recalcularEstado(idOt);

  return obtenerPorId(idOt);
}

/** Cambia una tarea ya cargada. Se manda completa, como en el alta. */
export async function actualizarTarea(idOt, idTarea, datos) {
  await ordenPlanificable(idOt);

  const { data: existente, error: errorExistente } = await supabase
    .from('tarea_ot')
    .select('ot_id, tarea_id, tarea_estado, tarea_fecha_ini, tarea_fecha_fin')
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .maybeSingle();

  if (errorExistente) throw new Error(errorExistente.message);
  if (!existente) throw noEncontrado(`La orden de trabajo ${idOt} no tiene la tarea ${idTarea}.`);

  if (normalizarEstadoTarea(existente.tarea_estado) === 'Completada') {
    throw conflicto(`La tarea ${idTarea} ya está completada: no se puede modificar.`);
  }

  const tarea = await validarTarea(datos, {
    inicio: existente.tarea_fecha_ini,
    fin: existente.tarea_fecha_fin,
  });

  const { error } = await supabase
    .from('tarea_ot')
    .update({
      tarea_desc: tarea.descripcion,
      tarea_prioridad: tarea.prioridad,
      tarea_plan_id: tarea.idPlantilla,
      prestador_serv_id: tarea.idPrestador,
      tarea_hom: tarea.horasEstimadas,
      tarea_fecha_ini: tarea.fechaInicio,
      tarea_fecha_fin: tarea.fechaFin,
    })
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea);

  if (error) throw new Error(error.message);

  await asignarTecnico(idOt, idTarea, tarea.legajoTecnico);
  await recalcularEstado(idOt);

  return obtenerPorId(idOt);
}

/**
 * Saca una tarea de la OT.
 *
 * Los numeros de las que quedan no se corren: la tarea 2 sigue siendo la 2
 * aunque se borre la 1, porque otras tablas (materiales consumidos, tecnico
 * asignado) la apuntan por ese numero.
 */
export async function eliminarTarea(idOt, idTarea) {
  await ordenPlanificable(idOt);

  const { data: existente, error: errorExistente } = await supabase
    .from('tarea_ot')
    .select('ot_id, tarea_id, tarea_estado')
    .eq('ot_id', idOt)
    .eq('tarea_id', idTarea)
    .maybeSingle();

  if (errorExistente) throw new Error(errorExistente.message);
  if (!existente) throw noEncontrado(`La orden de trabajo ${idOt} no tiene la tarea ${idTarea}.`);

  if (normalizarEstadoTarea(existente.tarea_estado) !== ESTADO_TAREA_INICIAL) {
    throw conflicto(
      `La tarea ${idTarea} ya está ${normalizarEstadoTarea(existente.tarea_estado).toLowerCase()}: no se puede eliminar.`
    );
  }

  const { error } = await supabase.from('tarea_ot').delete().eq('ot_id', idOt).eq('tarea_id', idTarea);
  if (error) throw new Error(error.message);

  await recalcularEstado(idOt);

  return obtenerPorId(idOt);
}
