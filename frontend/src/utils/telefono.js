/**
 * La regla del numero de telefono.
 *
 * Un telefono de SIGMA son 10 digitos: el codigo de area sin el 0 de adelante
 * y el numero sin el 15. Por ejemplo, 3624 12-3456 se guarda como 3624123456.
 *
 * Se guardan solo los digitos, sin espacios, guiones ni parentesis. Asi dos
 * personas que escriben el mismo numero de distinta forma terminan con el
 * mismo dato guardado, y se puede buscar por numero sin pelear con el formato.
 */

/** Cuantos digitos tiene que tener un telefono. */
export const LARGO_TELEFONO = 10;

/** Los digitos que tiene escritos, sin puntos, espacios ni guiones. */
export function digitosDelTelefono(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/**
 * Lo que se deja escribir en la caja: solo digitos, y como mucho 10.
 *
 * Se corta aca y no al guardar para que no se pueda ni siquiera tipear el
 * digito once: la caja deja de aceptar teclas sola. Lo mismo vale para lo que
 * se pega desde otro lado, que pasa por esta misma funcion.
 */
export function limpiarTelefono(texto) {
  return digitosDelTelefono(texto).slice(0, LARGO_TELEFONO);
}
