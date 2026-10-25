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

async function delTecnico(legajo) {
  const { tareas } = await obtenerDelTecnico(legajo, { soloPendientes: true });

  return {
    // /tareas ya arranca mostrando sólo las pendientes.
    verMas: '/tareas',
    // La API las da de la mas vieja a la mas nueva; en la campana va primero la ultima asignada.
    notificaciones: tareas.reverse().map((tarea) => ({
      clave: `tarea-${tarea.idOt}-${tarea.idTarea}`,
      titulo: `Tarea pendiente: ${tarea.descripcion}`,
      detalle: `OT #${tarea.idOt} · Prioridad ${tarea.prioridad} · ${tarea.estado}`,
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
