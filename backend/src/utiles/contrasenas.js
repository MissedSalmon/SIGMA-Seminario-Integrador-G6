/**
 * La regla de una contraseña nueva, la misma en todos lados: el alta de un
 * usuario (HU-32) y el cambio de contraseña, obligatorio o desde el perfil (HU-30).
 */

export const LARGO_MINIMO_PASSWORD = 6;

// bcrypt sólo mira los primeros 72 bytes: dos contraseñas que difieren después darían el mismo hash.
export const LARGO_MAXIMO_PASSWORD = 72;

/** Devuelve el problema de la contraseña, o null si está bien. No se recorta: un espacio también cuenta. */
export function validarPasswordNueva(password) {
  if (typeof password !== 'string' || password.length < LARGO_MINIMO_PASSWORD) {
    return `La contraseña tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
  }
  if (Buffer.byteLength(password, 'utf8') > LARGO_MAXIMO_PASSWORD) {
    return `La contraseña no puede tener más de ${LARGO_MAXIMO_PASSWORD} caracteres.`;
  }
  return null;
}
