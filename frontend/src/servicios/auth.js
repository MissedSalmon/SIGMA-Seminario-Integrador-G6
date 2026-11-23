import { api } from './api.js';

export async function login(identificador, password) {
  const { data } = await api.post('/auth/login', { identificador, password });
  return data; // { ok, datos: { ... }, token }
}

export async function logout() {
  const { data } = await api.post('/auth/logout');
  return data;
}

export async function obtenerPerfil() {
  const { data } = await api.get('/auth/perfil');
  return data;
}

/** Guarda los datos personales de quien inicio sesion. El legajo y el rol no se cambian. */
export async function actualizarPerfil(datos) {
  const { data } = await api.put('/auth/perfil', datos);
  return data;
}

export async function cambiarPassword(passwordActual, passwordNueva) {
  const { data } = await api.post('/auth/cambiar-password', { passwordActual, passwordNueva });
  return data;
}
