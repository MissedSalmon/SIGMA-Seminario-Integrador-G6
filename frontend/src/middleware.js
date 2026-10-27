import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose'; // Usaremos jose porque jsonwebtoken no corre en Edge (Next.js middleware)

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'supersecret123');

export async function middleware(request) {
  const url = request.nextUrl.clone();
  
  // Rutas públicas
  if (url.pathname === '/login' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/') || url.pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  const token = request.cookies.get('token')?.value;

  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Si requiere cambio de contraseña y no está en la página de configuración, redirigir
    if (payload.requirePasswordChange && url.pathname !== '/configuracion/cambiar-password') {
      url.pathname = '/configuracion/cambiar-password';
      return NextResponse.redirect(url);
    }

    // Reglas de negocio de acceso según rol
    const rol = payload.rol;
    
    if (url.pathname.startsWith('/admin') && rol !== 'administrador') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Autorizados: exclusivo /tickets
    if (rol === 'autorizado' && !url.pathname.startsWith('/tickets') && !url.pathname.startsWith('/perfil') && !url.pathname.startsWith('/configuracion')) {
      url.pathname = '/tickets';
      return NextResponse.redirect(url);
    }

    // Tecnicos: exclusivo /tareas
    if (rol === 'tecnico' && !url.pathname.startsWith('/tareas') && !url.pathname.startsWith('/perfil') && !url.pathname.startsWith('/configuracion')) {
      url.pathname = '/tareas';
      return NextResponse.redirect(url);
    }

    // Redireccion por defecto si entran a /
    if (url.pathname === '/') {
      if (payload.requirePasswordChange) {
        url.pathname = '/configuracion/cambiar-password';
      } else if (rol === 'administrador') {
        // el inicio del admin es /
        return NextResponse.next();
      } else if (rol === 'tecnico') {
        url.pathname = '/tareas';
      } else {
        url.pathname = '/tickets';
      }
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  } catch (error) {
    // Token inválido o expirado
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
