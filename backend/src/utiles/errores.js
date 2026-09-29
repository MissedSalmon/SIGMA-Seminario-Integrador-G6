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

/**
 * Los codigos con los que PostgREST avisa que algo del esquema no esta:
 *
 *   PGRST202  la funcion no existe
 *   PGRST205  la tabla no existe
 *   PGRST200  la relacion entre dos tablas no existe
 *
 * Los tres significan siempre lo mismo para nosotros: hay una migracion
 * escrita que todavia no se aplico en la base.
 */
const FALTA_MIGRACION = ['PGRST202', 'PGRST205', 'PGRST200'];

/**
 * Traduce el error que devuelve Supabase a uno que se pueda mostrar.
 *
 * Cuando falta aplicar una migracion, el mensaje crudo ("Could not find the
 * table 'public.remito' in the schema cache") no le dice nada a quien lo lee
 * en la pantalla. Se cambia por el que dice que hacer. El resto de los errores
 * pasan como estan: son problemas tecnicos de verdad y hay que verlos.
 *
 *   if (error) throw errorDeBase(error, 'del remito');
 */
export function errorDeBase(error, queFalta = '') {
  if (FALTA_MIGRACION.includes(error?.code)) {
    return new Error(
      `Falta aplicar la migración ${queFalta ? `${queFalta} ` : ''}en la base de datos (npm run db:push).`
    );
  }

  return new Error(error?.message ?? 'Ocurrió un error al consultar la base de datos.');
}
