/**
 * Las notificaciones de la campana de arriba, segun el rol de la sesion.
 *
 * No se guardan en una tabla: se calculan cada vez que se piden (23/11/2026).
 * Lo que si se guarda es si cada usuario la leyo o la elimino
 * (ver estadoNotificaciones.servicio.js).
 *   - Administrador:
 *       · los tickets nuevos, que esperan que los valide o rechace;
 *       · las OT que finalizaron en los ultimos DIAS_RECIENTES dias;
 *       · los materiales por debajo del stock minimo (HU-33).
 *   - Tecnico: sus tareas pendientes (HU-21), la mas nueva primero. Las que
 *     tiene que hacer hoy (su fecha prevista es hoy) lo dicen en el titulo.
 *   - Solicitante (rol "autorizado"), sobre los tickets que el registro:
 *       · que se lo validaron o se lo rechazaron;
 *       · que la OT de ese ticket finalizo.
 *     Tambien sólo las de los ultimos DIAS_RECIENTES dias.
 *
 * Todas tienen la misma forma, asi la campana las dibuja igual sin saber de que son:
 *   clave, tipo, titulo, detalle, enlace, accion (el texto del boton que lleva
 *   al enlace en /notificaciones), fecha y leida.
 * Van todas juntas, de la mas nueva a la mas vieja. La fecha es la del hecho
 * (alta del ticket, cierre de la OT, asignacion de la tarea) y, si no tiene
 * una propia (el stock bajo), la primera vez que se le mostro al usuario.
 * "verMas" es la pantalla con la lista completa.
 */
import { obtenerAlertasStock } from './inventario.servicio.js';
import { obtenerDelTecnico } from './tareas.servicio.js';
import { obtenerTodos as obtenerTickets } from './tickets.servicio.js';
import { obtenerTodas as obtenerOrdenes } from './ordenesTrabajo.servicio.js';
import * as estado from './estadoNotificaciones.servicio.js';

/**
 * Cuanto tiempo sigue en la campana algo que ya paso (una OT finalizada, un
 * ticket validado o rechazado). Despues deja de aparecer sola, aunque no se
 * la haya eliminado.
 */
export const DIAS_RECIENTES = 7;
const MS_POR_DIA = 24 * 60 * 60 * 1000;

function esReciente(fecha, ahora = Date.now()) {
  if (!fecha) return false;
  const momento = new Date(fecha).getTime();
  return !Number.isNaN(momento) && ahora - momento <= DIAS_RECIENTES * MS_POR_DIA;
}

/** Del mas nuevo al mas viejo. */
function porFechaDescendente(una, otra) {
  const momento = (fecha) => (fecha ? new Date(fecha).getTime() || 0 : 0);
  return momento(otra.fecha) - momento(una.fecha);
}

/** "2026-10-25" en Argentina: el servidor puede estar en UTC, donde despues de las 21 ya es mañana. */
function hoyEnArgentina() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function fechaLegible(texto) {
  const [anio, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${anio}`;
}

/** "25/10/2026" de una fecha y hora ISO, en hora de Argentina. */
function diaLegible(fechaHora) {
  return fechaLegible(
    new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date(fechaHora))
  );
}

/** "en Edificio Central, Aula 3" del activo de un ticket, o "" si no se sabe. */
function dondeDelTicket(ticket) {
  const activo = ticket.activo;
  if (!activo) return '';
  const lugar = [activo.nombreEdificio, activo.nombreEspacio].filter(Boolean).join(', ');
  return lugar ? ` en ${lugar}` : '';
}

/** "activo AA-01 en Edificio Central, Aula 3" */
function activoDelTicket(ticket) {
  return `${ticket.codigoActivo ? `activo ${ticket.codigoActivo}` : 'activo'}${dondeDelTicket(ticket)}`;
}

// ---------------------------------------------------------------------------
// Administrador
// ---------------------------------------------------------------------------

/** Los tickets en estado Creado: los que todavia no valido ni rechazo. */
async function ticketsNuevos() {
  const tickets = await obtenerTickets({ estado: 'Creado' });

  return tickets.map((ticket) => ({
    fecha: ticket.fechaAlta,
    clave: `ticket-nuevo-${ticket.id}`,
    tipo: 'Ticket',
    titulo: `Nuevo ticket #${ticket.id}`,
    detalle:
      `${ticket.registradoPor?.nombre || 'Un solicitante'} reportó un problema en el ${activoDelTicket(ticket)}. ` +
      'Falta validarlo o rechazarlo.',
    enlace: `/tickets/${ticket.id}`,
    accion: 'Ver ticket',
  }));
}

/** Las OT que se finalizaron hace poco. */
async function ordenesFinalizadas() {
  const ordenes = await obtenerOrdenes({ estado: 'Finalizada' });

  return ordenes
    .filter((orden) => esReciente(orden.fechaCierre))
    .map((orden) => {
      const origen = orden.idTicket ? `Del ticket #${orden.idTicket}` : `Del plan «${orden.nombrePlan || 'preventivo'}»`;
      const activo = orden.codigoActivo ? `, activo ${orden.codigoActivo}` : '';
      return {
        fecha: orden.fechaCierre,
        clave: `ot-finalizada-${orden.id}`,
        tipo: 'Orden de trabajo',
        titulo: `OT #${orden.id} finalizada`,
        detalle: `${origen}${activo}. Finalizó el ${diaLegible(orden.fechaCierre)}.`,
        enlace: `/ordenes-trabajo/${orden.id}`,
        accion: 'Ver OT',
      };
    });
}

async function delAdministrador() {
  const [tickets, ordenes, alertas] = await Promise.all([ticketsNuevos(), ordenesFinalizadas(), obtenerAlertasStock()]);

  return [
    ...tickets,
    ...ordenes,
    // El stock bajo no tiene fecha propia: toma la de la primera vez que se mostro.
    ...alertas.map((alerta) => ({
      clave: `stock-${alerta.codigo}`,
      tipo: 'Stock',
      titulo: `Stock bajo: ${alerta.nombre}`,
      detalle: `Quedan ${alerta.stockActual} ${alerta.unidadMedida || 'unidad'} · mínimo ${alerta.stockMinimo} ${alerta.unidadMedida || 'unidad'}`,
      enlace: `/inventario/materiales/${encodeURIComponent(alerta.codigo)}`,
      accion: 'Ver material',
    })),
  ];
}

// ---------------------------------------------------------------------------
// Tecnico
// ---------------------------------------------------------------------------

/**
 * El mensaje de una tarea pendiente, segun en que punto esta (25/10/2026):
 *   - en ejecucion: falta finalizarla;
 *   - sin empezar y con la fecha prevista hoy: la tiene que hacer hoy (23/11/2026);
 *   - sin empezar y con la fecha prevista de inicio ya pasada: esta atrasada;
 *   - sin empezar: se la asignaron.
 */
function mensajeDeTarea(tarea, hoy) {
  const nombre = `la tarea «${tarea.descripcion}»`;
  const sinEmpezar = tarea.estado !== 'En ejecución';
  const esHoy = sinEmpezar && tarea.fechaPrevista === hoy;
  const atrasada = sinEmpezar && tarea.fechaPrevista && tarea.fechaPrevista < hoy;

  let titulo = `Te asignaron ${nombre}`;
  if (!sinEmpezar) titulo = `Falta finalizar ${nombre}`;
  else if (esHoy) titulo = `Hoy tenés que realizar ${nombre}`;
  else if (atrasada) titulo = `Tarea «${tarea.descripcion}» está atrasada`;

  const donde = tarea.ubicacion ? ` en ${tarea.ubicacion.edificio}, ${tarea.ubicacion.espacio}` : '';
  const partes = [`Es de la OT #${tarea.idOt}${donde}.`, `Prioridad ${tarea.prioridad.toLowerCase()}.`];
  if (esHoy) partes.push(`Fecha prevista: hoy, ${fechaLegible(tarea.fechaPrevista)}.`);
  else if (atrasada) partes.push(`Tenía que empezar el ${fechaLegible(tarea.fechaPrevista)}.`);
  else if (sinEmpezar && tarea.fechaPrevista) {
    partes.push(`Empieza el ${fechaLegible(tarea.fechaPrevista)}.`);
  }

  return { titulo, detalle: partes.join(' '), esHoy };
}

async function delTecnico(legajo) {
  const { tareas } = await obtenerDelTecnico(legajo, { soloPendientes: true });
  const hoy = hoyEnArgentina();

  return tareas.map((tarea) => {
    const { esHoy, ...mensaje } = mensajeDeTarea(tarea, hoy);
    return {
      // El aviso de "hoy" es la fecha en que se le muestra; si no, cuando se la asignaron.
      fecha: esHoy ? null : tarea.fechaAsignacion,
      // Otra clave el dia que toca: asi llega como notificacion nueva, sin leer.
      clave: `tarea-${tarea.idOt}-${tarea.idTarea}${esHoy ? '-hoy' : ''}`,
      tipo: 'Tarea',
      ...mensaje,
      enlace: `/tareas/${tarea.idOt}/${tarea.idTarea}`,
      accion: 'Ver tarea',
    };
  });
}

// ---------------------------------------------------------------------------
// Solicitante (rol "autorizado")
// ---------------------------------------------------------------------------

/**
 * La decision sobre el ticket:
 *   - Validado: al validarlo se genera la OT, asi que la fecha de la decision
 *     es la del alta de la OT.
 *   - Rechazado: el rechazo no guarda fecha; se usa la del alta del ticket,
 *     que es lo mas cercano que hay.
 */
function decisionDelTicket(ticket) {
  if (ticket.estado === 'Rechazado') {
    if (!esReciente(ticket.fechaAlta)) return null;
    return {
      fecha: ticket.fechaAlta,
      clave: `ticket-rechazado-${ticket.id}`,
      tipo: 'Ticket',
      titulo: `Tu ticket #${ticket.id} fue rechazado`,
      detalle: ticket.motivoRechazo ? `Motivo: ${ticket.motivoRechazo}` : `Reportaste el ${activoDelTicket(ticket)}.`,
      enlace: `/tickets/${ticket.id}`,
      accion: 'Ver ticket',
    };
  }

  if (ticket.estado !== 'Creado' && ticket.ot && esReciente(ticket.ot.fechaAlta)) {
    return {
      fecha: ticket.ot.fechaAlta,
      clave: `ticket-validado-${ticket.id}`,
      tipo: 'Ticket',
      titulo: `Tu ticket #${ticket.id} fue validado`,
      detalle: `Se generó la OT #${ticket.ot.id} para el ${activoDelTicket(ticket)}.`,
      enlace: `/tickets/${ticket.id}`,
      accion: 'Ver ticket',
    };
  }

  return null;
}

function finalDelTicket(ticket) {
  const ot = ticket.ot;
  if (!ot || ot.estado !== 'Finalizada' || !esReciente(ot.fechaCierre)) return null;
  return {
    fecha: ot.fechaCierre,
    clave: `ot-finalizada-${ot.id}`,
    tipo: 'Orden de trabajo',
    titulo: `Se resolvió tu ticket #${ticket.id}`,
    detalle: `La OT #${ot.id} del ${activoDelTicket(ticket)} finalizó el ${diaLegible(ot.fechaCierre)}.`,
    enlace: `/tickets/${ticket.id}`,
    accion: 'Ver ticket',
  };
}

async function delSolicitante(legajo) {
  // Con el usuario, obtenerTodos trae sólo los tickets que registro el.
  const tickets = await obtenerTickets({}, { rol: 'autorizado', identificador: legajo });
  return tickets.flatMap((ticket) => [decisionDelTicket(ticket), finalDelTicket(ticket)]).filter(Boolean);
}

const POR_ROL = {
  administrador: delAdministrador,
  tecnico: delTecnico,
  autorizado: delSolicitante,
};

/**
 * Las notificaciones del usuario de la sesion, sin las que elimino, con si las
 * leyo y de la mas nueva a la mas vieja.
 *
 * @param {{ rol: string, identificador: string }} usuario - el de la sesion (req.usuario)
 * @returns {Promise<{ verMas: string|null, noLeidas: number, notificaciones: object[] }>}
 */
export async function obtenerDelUsuario({ rol, identificador }) {
  const buscar = POR_ROL[rol];
  if (!buscar) return { verMas: null, noLeidas: 0, notificaciones: [] };

  const calculadas = await buscar(identificador);
  const estados = await estado.sincronizar(
    identificador,
    calculadas.map((notificacion) => notificacion.clave)
  );

  const notificaciones = calculadas
    .filter((notificacion) => !estados.get(notificacion.clave)?.eliminada)
    .map((notificacion) => {
      const guardado = estados.get(notificacion.clave);
      return {
        ...notificacion,
        fecha: notificacion.fecha || guardado?.fecha || null,
        leida: Boolean(guardado?.leida),
      };
    })
    .sort(porFechaDescendente);

  return {
    verMas: '/notificaciones',
    noLeidas: notificaciones.filter((notificacion) => !notificacion.leida).length,
    notificaciones,
  };
}

/** Marca una notificacion del usuario como leida o no leida. */
export function marcarLeida({ identificador }, clave, leida) {
  return estado.marcarLeida(identificador, clave, leida);
}

/** Marca como leidas todas las notificaciones del usuario. */
export function marcarTodasLeidas({ identificador }) {
  return estado.marcarTodasLeidas(identificador);
}

/** Elimina una notificacion del usuario. */
export function eliminar({ identificador }, clave) {
  return estado.eliminar(identificador, clave);
}
