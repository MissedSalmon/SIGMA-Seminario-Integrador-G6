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

export async function cambiarPassword(passwordActual, passwordNueva) {
  const { data } = await api.post('/auth/cambiar-password', { passwordActual, passwordNueva });
  return data;
}
