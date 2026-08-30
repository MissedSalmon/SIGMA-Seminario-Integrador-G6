import { prohibido } from '../utiles/errores.js';

/**
 * Middleware simple para permitir solo a administradores.
 *
 * Nota: este proyecto aun no tiene un sistema de autenticacion completo, así
 * que por ahora el rol se espera en el header `x-rol` con valor
 * "Administrador". Esto permite aplicar la restriccion en endpoints que
 * modifican datos.
 */
export function soloAdministrador(req, res, next) {
  const rol = req.headers['x-rol'] || req.headers['x-rol'.toLowerCase()];
  if (rol !== 'Administrador') {
    throw prohibido('Se requieren permisos de administrador para esta accion.');
  }
  next();
}
