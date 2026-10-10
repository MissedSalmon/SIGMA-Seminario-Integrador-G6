import { validarSesion, protegerPorRol } from './auth.middleware.js';

/**
 * Middleware que exige sesion JWT activa y rol administrador.
 *
 * Antes usaba el header `x-rol` como mecanismo ad-hoc; ahora delega en el
 * sistema de autenticacion real (HU-30) para garantizar que la identidad
 * viene de un token firmado y no de un header que cualquiera puede inventar.
 *
 * Uso en rutas: router.use(soloAdministrador) o router.post('/', soloAdministrador, ctrl.crear)
 */
export function soloAdministrador(req, res, next) {
  validarSesion(req, res, (err) => {
    if (err) return;
    protegerPorRol(['administrador'])(req, res, next);
  });
}
