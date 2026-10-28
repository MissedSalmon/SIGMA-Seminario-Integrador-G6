/**
 * Llamadas a la API de gestion de usuarios (Sprint 6).
 *
 * Cada usuario llega como
 * { idUsuario, nombreUsuario, rol, legajo, persona, activo, fechaCreacion, fechaActualizacion }.
 *
 * Solo las puede usar un administrador activo: el resto recibe 403.
 */
import { api } from './api.js';

export async function listarUsuarios() {
  const { data } = await api.get('/usuarios');
  return data.datos;
}

/** Las personas registradas que todavia no tienen usuario: { rol, legajo, nombre }. */
export async function listarPersonasSinUsuario() {
  const { data } = await api.get('/usuarios/personas-sin-usuario');
  return data.datos;
}

export async function crearUsuario(usuario) {
  const { data } = await api.post('/usuarios', usuario);
  return data.datos;
}

export async function desactivarUsuario(idUsuario) {
  const { data } = await api.put(`/usuarios/${idUsuario}/desactivar`);
  return data.datos;
}

export async function activarUsuario(idUsuario) {
  const { data } = await api.put(`/usuarios/${idUsuario}/activar`);
  return data.datos;
}

/** Restablecer la contraseña (HU-31). Devuelve { identificador, contrasenaProvisoria }. */
export async function restablecerContrasenaUsuario(identificador) {
  const { data } = await api.post(
    `/usuarios/${encodeURIComponent(identificador)}/restablecer-contrasena`
  );
  return data.datos;
}
