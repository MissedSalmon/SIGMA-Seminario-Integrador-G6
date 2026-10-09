import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

/**
 * Middleware para validar el token JWT y establecer req.usuario
 */
export const validarSesion = (req, res, next) => {
  try {
    // El token puede venir en la cookie 'token' o en el header Authorization (Bearer ...)
    let token = req.cookies?.token;
    
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ ok: false, mensaje: 'No hay sesión activa' });
    }

    const payload = jwt.verify(token, JWT_SECRET);
    req.usuario = payload;
    next();
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Sesión inválida o expirada' });
  }
};

/**
 * Genera un middleware que permite el paso si el usuario tiene uno de los roles permitidos
 * @param {string[]} rolesPermitidos - Arreglo de roles (ej: ['administrador', 'tecnico'])
 */
export const protegerPorRol = (rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No hay sesión activa' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({ ok: false, mensaje: 'No tienes permisos para realizar esta acción' });
    }

    // Regla de negocio: Si requiere cambio de contraseña, bloquear acceso a todo menos cambiar contraseña
    if (req.usuario.requirePasswordChange) {
      // Excepción si la ruta misma es para cambiar la contraseña (esto lo manejamos en las rutas, pero por las dudas)
      // Lo dejaremos pasar aquí si la ruta es explícitamente para cambiar password
      if (!req.originalUrl.includes('cambiar-password')) {
        return res.status(403).json({ 
          ok: false, 
          mensaje: 'Debe cambiar su contraseña inicial obligatoriamente.',
          codigo: 'REQUIRE_PASSWORD_CHANGE'
        });
      }
    }

    next();
  };
};
