/**
 * Llamadas a la API de tecnicos (HU-5).
 */
import { api } from './api.js';

/**
 * @param {object} [filtros]
 * @param {number} [filtros.especialidadId]
 * @param {string} [filtros.disponibilidad] - "Disponible" | "No disponible"
 */
export async function listarTecnicos(filtros = {}) {
  const { especialidadId, disponibilidad } = filtros;
  const { data } = await api.get('/tecnicos', {
    params: {
      ...(especialidadId ? { especialidadId } : {}),
      ...(disponibilidad ? { disponibilidad } : {}),
    },
  });
  return data.datos;
}

export async function obtenerTecnico(legajo) {
  const { data } = await api.get(`/tecnicos/${legajo}`);
  return data.datos;
}

export async function crearTecnico(tecnico) {
  const { data } = await api.post('/tecnicos', tecnico);
  return data.datos;
}

export async function actualizarTecnico(legajo, tecnico) {
  const { data } = await api.put(`/tecnicos/${legajo}`, tecnico);
  return data.datos;
}

export async function eliminarTecnico(legajo) {
  const { data } = await api.delete(`/tecnicos/${legajo}`);
  return data.datos;
}
