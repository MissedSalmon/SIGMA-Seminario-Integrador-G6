/**
 * Llamadas a la API de activos (HU-7).
 */
import { api } from './api.js';

/**
 * @param {object} [filtros]
 * @param {number} [filtros.idEdificio] - junto con espacioNum, filtra por espacio
 * @param {string} [filtros.espacioNum]
 * @param {number} [filtros.idTipoActivo]
 * @param {string} [filtros.estado] - "Operativo" | "En mantenimiento" | "Fuera de servicio" | "Retirado"
 */
export async function listarActivos(filtros = {}) {
  const { idEdificio, espacioNum, idTipoActivo, estado } = filtros;

  const { data } = await api.get('/activos', {
    params: {
      ...(idEdificio && espacioNum ? { idEdificio, espacioNum } : {}),
      ...(idTipoActivo ? { idTipoActivo } : {}),
      ...(estado ? { estado } : {}),
    },
  });

  return data.datos;
}

/** Los estados posibles: { todos: [...], manuales: [...] }. */
export async function listarEstadosDeActivo() {
  const { data } = await api.get('/activos/estados');
  return data.datos;
}

export async function obtenerActivo(codigo) {
  const { data } = await api.get(`/activos/${encodeURIComponent(codigo)}`);
  return data.datos;
}

export async function crearActivo(activo) {
  const { data } = await api.post('/activos', activo);
  return data.datos;
}

export async function actualizarActivo(codigo, activo) {
  const { data } = await api.put(`/activos/${encodeURIComponent(codigo)}`, activo);
  return data.datos;
}

/**
 * Da de baja un activo: lo pasa a Retirado.
 * No lo borra, para conservar su historial de intervenciones.
 */
export async function darDeBajaActivo(codigo) {
  const { data } = await api.delete(`/activos/${encodeURIComponent(codigo)}`);
  return data.datos;
}
