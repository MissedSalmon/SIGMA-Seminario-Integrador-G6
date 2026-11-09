import * as authServicio from '../servicios/auth.servicio.js';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';
const JWT_EXPIRES_IN = '30m';

export async function login(req, res, next) {
  try {
    const { identificador, password } = req.body;
    
    if (!identificador || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Credenciales incorrectas' });
    }

    const usuario = await authServicio.validarCredenciales(identificador, password);
    
    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales incorrectas. Verifique su usuario o contraseña.' });
    }

    // Generar JWT
    const token = jwt.sign(
      { 
        usuarioId: usuario.usuarioId, 
        identificador: usuario.identificador, 
        rol: usuario.rol, 
        requirePasswordChange: usuario.requirePasswordChange 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Enviar cookie HttpOnly
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000, // 30 minutos
    });

    res.json({
      ok: true,
      datos: {
        usuarioId: usuario.usuarioId,
        identificador: usuario.identificador,
        rol: usuario.rol,
        requirePasswordChange: usuario.requirePasswordChange
      },
      token // Opcional, pero util para clientes no navegadores o nextjs
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    res.clearCookie('token');
    res.json({ ok: true, mensaje: 'Sesión cerrada' });
  } catch (error) {
    next(error);
  }
}

export async function perfil(req, res, next) {
  try {
    const perfil = await authServicio.obtenerPerfil(req.usuario.identificador, req.usuario.rol);
    if (!perfil) {
      return res.status(404).json({ ok: false, mensaje: 'Perfil no encontrado' });
    }
    res.json({ ok: true, datos: perfil });
  } catch (error) {
    next(error);
  }
}

export async function cambiarPassword(req, res, next) {
  try {
    const { passwordActual, passwordNueva } = req.body ?? {};

    await authServicio.cambiarPassword(req.usuario.identificador, passwordActual, passwordNueva);

    // El token viejo todavia dice requirePasswordChange = true: se emite uno nuevo.
    const token = jwt.sign(
      { 
        usuarioId: req.usuario.usuarioId, 
        identificador: req.usuario.identificador, 
        rol: req.usuario.rol, 
        requirePasswordChange: false 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 60 * 1000,
    });

    res.json({ ok: true, mensaje: 'Contraseña actualizada con éxito' });
  } catch (error) {
    next(error);
  }
}
