/**
 * La regla de una contraseña nueva: el alta de un usuario y el cambio de la propia.
 *
 * OJO: está repetida en backend/src/utiles/contrasenas.js, porque a la API se le
 * puede pegar sin pasar por la pantalla. Si se cambia acá, hay que cambiarla allá.
 */

export const LARGO_MINIMO_PASSWORD = 6;

// bcrypt sólo mira los primeros 72 bytes.
export const LARGO_MAXIMO_PASSWORD = 72;

/** Devuelve el motivo del error, o '' si está bien. No se recorta: un espacio también cuenta. */
export function validarPasswordNueva(password) {
  if (typeof password !== 'string' || password.length < LARGO_MINIMO_PASSWORD) {
    return `Tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
  }
  if (new TextEncoder().encode(password).length > LARGO_MAXIMO_PASSWORD) {
    return `No puede tener más de ${LARGO_MAXIMO_PASSWORD} caracteres.`;
  }
  return '';
}
