/**
 * Errores con codigo HTTP.
 *
 * Los servicios no saben nada de HTTP, pero si saben si algo "no existe" o si
 * "el dato esta mal". Con esto marcan el caso y el manejador central de errores
 * (src/middlewares/manejadorErrores.js) lo traduce al codigo que corresponde.
 *
 *   throw noEncontrado('El edificio no existe.');   ->  404
 *   throw datoInvalido('El nombre es obligatorio.'); ->  400
 */

function crearError(mensaje, estado) {
  const error = new Error(mensaje);
  error.estado = estado;
  return error;
}

/** 400: el pedido llego mal armado. */
export const datoInvalido = (mensaje) => crearError(mensaje, 400);

/** 404: lo que se pidio no existe. */
export const noEncontrado = (mensaje) => crearError(mensaje, 404);

/** 409: el pedido es valido pero choca con una regla del sistema. */
export const conflicto = (mensaje) => crearError(mensaje, 409);

/** 403: acceso prohibido. */
export const prohibido = (mensaje) => crearError(mensaje, 403);
