/**
 * Manejador central de errores.
 *
 * Cualquier error que ocurra en un controlador llega aca y se responde
 * siempre con el mismo formato. Va al final de todo, despues de las rutas.
 *
 * Express 5 pasa automaticamente los errores de funciones async a este
 * middleware, asi que no hace falta envolver cada controlador en try/catch.
 */
import { esProduccion } from '../config/env.js';

export function manejadorErrores(err, req, res, next) {
  const estado = err.estado ?? err.status ?? 500;

  // En el servidor siempre queremos ver el error completo.
  console.error(`[error] ${req.method} ${req.originalUrl}`, err);

  res.status(estado).json({
    ok: false,
    mensaje: err.mensaje ?? err.message ?? 'Ocurrio un error inesperado.',
    // El detalle tecnico solo se muestra en desarrollo.
    ...(esProduccion ? {} : { detalle: err.stack }),
  });
}
