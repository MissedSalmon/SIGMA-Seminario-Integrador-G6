import { soloAdministrador } from './soloAdministrador.js';
import { esAdministradorActivo } from '../servicios/usuarios.servicio.js';

/**
 * Como soloAdministrador, pero ademas confirma en la base que el usuario sigue
 * activo y sigue siendo administrador.
 *
 * soloAdministrador solo mira el token, que dura 30 minutos. Para gestionar
 * usuarios eso no alcanza: si a un administrador lo desactivan, tiene que
 * perder el acceso a esta pantalla en el momento.
 *
 * Uso en rutas: router.use(soloAdministradorActivo)
 */
export function soloAdministradorActivo(req, res, next) {
  soloAdministrador(req, res, async () => {
    try {
      if (!(await esAdministradorActivo(req.usuario?.usuarioId))) {
        return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
      }
      next();
    } catch (error) {
      next(error);
    }
  });
}
