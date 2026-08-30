/**
 * Llamadas a la API de especialidades.
 *
 * Solo lectura: HU-4 (el ABM de especialidades) todavia no esta implementada,
 * asi que esto solo sirve para el selector del formulario de tecnicos (HU-5)
 * y el filtro del listado.
 */
import { api } from './api.js';

export async function listarEspecialidades() {
  const { data } = await api.get('/especialidades');
  return data.datos;
}
