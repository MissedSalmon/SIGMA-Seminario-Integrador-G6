import { api } from './api.js';

export async function restablecerContrasenaUsuario(identificador) {
  const { data } = await api.post(
    `/usuarios/${encodeURIComponent(identificador)}/restablecer-contrasena`
  );
  return data.datos;
}
