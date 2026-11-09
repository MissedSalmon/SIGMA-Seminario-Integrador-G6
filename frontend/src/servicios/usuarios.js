/**
 * Llamadas a la API sobre el usuario de una persona: activarlo, desactivarlo y
 * restablecer su contraseña. Las usan las listas de técnicos y autorizados
 * (ver componentes/usuarios/AccionesUsuario.js).
 *
 * Solo las puede usar un administrador activo: el resto recibe 403.
 */
import { api } from './api.js';

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
