import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'supersecret123');

function normalizarRol(rol) {
  if (rol === null || rol === undefined) return null;
  const texto = String(rol).trim().toLowerCase();
  if (texto === '1' || texto === 'administrador') return 'administrador';
  if (texto === '2' || texto === 'tecnico' || texto === 'técnico') return 'tecnico';
  if (texto === '3' || texto === 'autorizado') return 'autorizado';
  return texto;
}

function inicioPorRol(rol) {
  const r = normalizarRol(rol);
  if (r === 'administrador') return '/';
  if (r === 'tecnico') return '/tareas';
  if (r === 'autorizado') return '/tickets';
  return '/login';
}

function aplicarHeadersSinCache(res) {
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.headers.set('Pragma', 'no-cache');
  res.headers.set('Expires', '0');
  return res;
}

export async function middleware(request) {
  const url = request.nextUrl.clone();
  const token = request.cookies.get('token')?.value;

  // Rutas de archivos estáticos o internas de Next
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/_next/') ||
    url.pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Página pública de login
  if (url.pathname === '/login') {
    if (!token) {
      const res = NextResponse.next();
      return aplicarHeadersSinCache(res);
    }

    // Si ya tiene token válido, lo redirigimos a su pantalla inicial
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);
      const rol = normalizarRol(payload.rol);
      url.pathname = inicioPorRol(rol);
      url.search = '';
      return NextResponse.redirect(url);
    } catch {
      // Token inválido o expirado en /login: borramos la cookie y dejamos pasar
      const res = NextResponse.next();
      res.cookies.delete('token');
      return aplicarHeadersSinCache(res);
    }
  }

  // Si no hay token en ruta protegida, redirigir a login preservando la ruta solicitada
  if (!token) {
    const redireccion = url.pathname + url.search;
    url.pathname = '/login';
    url.search = '';
    if (redireccion && redireccion !== '/') {
      url.searchParams.set('redireccion', redireccion);
    }
    const res = NextResponse.redirect(url);
    return aplicarHeadersSinCache(res);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const rol = normalizarRol(payload.rol);

    // Si requiere cambio de contraseña y no está en la página de configuración, redirigir
    if (payload.requirePasswordChange && url.pathname !== '/configuracion/cambiar-password') {
      url.pathname = '/configuracion/cambiar-password';
      url.search = '';
      const res = NextResponse.redirect(url);
      return aplicarHeadersSinCache(res);
    }

    // Esa pantalla es sólo para el cambio obligatorio; el voluntario es la ventana del perfil.
    if (!payload.requirePasswordChange && url.pathname === '/configuracion/cambiar-password') {
      url.pathname = '/perfil';
      url.search = '';
      const res = NextResponse.redirect(url);
      return aplicarHeadersSinCache(res);
    }

    // Rutas protegidas según rol
    // Autorizados: exclusivo /tickets, /perfil, /configuracion
    if (
      rol === 'autorizado' &&
      !url.pathname.startsWith('/tickets') &&
      !url.pathname.startsWith('/perfil') &&
      !url.pathname.startsWith('/configuracion')
    ) {
      url.pathname = '/tickets';
      url.search = '';
      const res = NextResponse.redirect(url);
      return aplicarHeadersSinCache(res);
    }

    // Técnicos: exclusivo /tareas, /notificaciones, /perfil, /configuracion
    if (
      rol === 'tecnico' &&
      !url.pathname.startsWith('/tareas') &&
      !url.pathname.startsWith('/notificaciones') &&
      !url.pathname.startsWith('/perfil') &&
      !url.pathname.startsWith('/configuracion')
    ) {
      url.pathname = '/tareas';
      url.search = '';
      const res = NextResponse.redirect(url);
      return aplicarHeadersSinCache(res);
    }

    // Redirección por defecto si entran a /
    if (url.pathname === '/') {
      if (payload.requirePasswordChange) {
        url.pathname = '/configuracion/cambiar-password';
        url.search = '';
      } else if (rol === 'administrador') {
        // El inicio del admin es / (Panel de Control)
        const res = NextResponse.next();
        return aplicarHeadersSinCache(res);
      } else if (rol === 'tecnico') {
        url.pathname = '/tareas';
        url.search = '';
      } else {
        url.pathname = '/tickets';
        url.search = '';
      }
      const res = NextResponse.redirect(url);
      return aplicarHeadersSinCache(res);
    }

    const res = NextResponse.next();
    return aplicarHeadersSinCache(res);
  } catch (error) {
    // Token inválido o expirado
    const redireccion = url.pathname + url.search;
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('expirada', 'true');
    if (redireccion && redireccion !== '/') {
      url.searchParams.set('redireccion', redireccion);
    }
    const response = NextResponse.redirect(url);
    response.cookies.delete('token');
    return aplicarHeadersSinCache(response);
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
