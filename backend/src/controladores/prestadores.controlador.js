/**
 * Controlador de prestadores de servicio.
 *
 * Solo lista: se usa para elegir el responsable de una tarea de la OT (HU-14).
 * El ABM completo es la HU-33.
 */
import * as prestadoresServicio from '../servicios/prestadores.servicio.js';

/** GET /api/prestadores */
export async function listar(req, res) {
  const prestadores = await prestadoresServicio.obtenerTodos();
  res.json({ ok: true, datos: prestadores });
}
