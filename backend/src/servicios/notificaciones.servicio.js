/**
 * Las notificaciones de la campana de arriba, segun el rol de la sesion.
 *
 * Ninguna se guarda en una tabla: se calculan cada vez que se piden.
 *   - Administrador: los materiales por debajo del stock minimo (HU-33).
 *   - Tecnico: sus tareas pendientes (HU-21), la mas nueva primero.
 *
 * Todas tienen la misma forma (clave, titulo, detalle, enlace), asi la campana
 * las dibuja igual sin saber de que son. "verMas" es la pantalla con la lista
 * completa de cada rol.
 */
import { obtenerAlertasStock } from './inventario.servicio.js';
import { obtenerDelTecnico } from './tareas.servicio.js';

async function delAdministrador() {
  const alertas = await obtenerAlertasStock();

  return {
    verMas: '/notificaciones',
    notificaciones: alertas.map((alerta) => ({
      clave: `stock-${alerta.codigo}`,
      titulo: `Stock bajo: ${alerta.nombre}`,
      detalle: `Quedan ${alerta.stockActual} · mínimo ${alerta.stockMinimo}`,
      enlace: `/inventario/materiales/${encodeURIComponent(alerta.codigo)}`,
    })),
  };
}

/** "2026-10-25" en Argentina: el servidor puede estar en UTC, donde despues de las 21 ya es mañana. */
function hoyEnArgentina() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires' }).format(new Date());
}

function fechaLegible(texto) {
  const [anio, mes, dia] = texto.split('-');
  return `${dia}/${mes}/${anio}`;
}

/**
 * El mensaje de una tarea pendiente, segun en que punto esta (25/10/2026):
 *   - en ejecucion: falta finalizarla;
 *   - sin empezar y con la fecha prevista de inicio ya pasada: esta atrasada;
 *   - sin empezar: se la asignaron.
 */
function mensajeDeTarea(tarea, hoy) {
  const nombre = `la tarea «${tarea.descripcion}»`;
  const atrasada = tarea.estado !== 'En ejecución' && tarea.fechaPrevista && tarea.fechaPrevista < hoy;

  let titulo = `Te asignaron ${nombre}`;
  if (tarea.estado === 'En ejecución') titulo = `Falta finalizar ${nombre}`;
  else if (atrasada) titulo = `Tarea «${tarea.descripcion}» está atrasada`;

  const donde = tarea.ubicacion ? ` en ${tarea.ubicacion.edificio}, ${tarea.ubicacion.espacio}` : '';
  const partes = [`Es de la OT #${tarea.idOt}${donde}.`, `Prioridad ${tarea.prioridad.toLowerCase()}.`];
  if (atrasada) partes.push(`Tenía que empezar el ${fechaLegible(tarea.fechaPrevista)}.`);
  else if (tarea.estado !== 'En ejecución' && tarea.fechaPrevista) {
    partes.push(`Empieza el ${fechaLegible(tarea.fechaPrevista)}.`);
  }

  return { titulo, detalle: partes.join(' ') };
}

async function delTecnico(legajo) {
  const { tareas } = await obtenerDelTecnico(legajo, { soloPendientes: true });
  const hoy = hoyEnArgentina();

  return {
    // No /tareas: es la pantalla de inicio del tecnico y el enlace no hacia nada estando ahi.
    verMas: '/notificaciones',
    // La API las da de la mas vieja a la mas nueva; en la campana va primero la ultima asignada.
    notificaciones: tareas.reverse().map((tarea) => ({
      clave: `tarea-${tarea.idOt}-${tarea.idTarea}`,
      ...mensajeDeTarea(tarea, hoy),
      enlace: `/tareas/${tarea.idOt}/${tarea.idTarea}`,
    })),
  };
}

const POR_ROL = {
  administrador: delAdministrador,
  tecnico: delTecnico,
};

/**
 * @param {{ rol: string, identificador: string }} usuario - el de la sesion (req.usuario)
 * @returns {Promise<{ verMas: string|null, notificaciones: object[] }>}
 */
export async function obtenerDelUsuario({ rol, identificador }) {
  const buscar = POR_ROL[rol];
  if (!buscar) return { verMas: null, notificaciones: [] };
  return buscar(identificador);
}
