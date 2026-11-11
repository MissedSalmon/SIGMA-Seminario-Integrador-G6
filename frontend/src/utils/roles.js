/**
 * Utilidades para normalización y control de rutas por rol en el frontend.
 *
 * Mapea tanto las cadenas estándar ('administrador', 'tecnico', 'autorizado')
 * como los códigos numéricos de la base (1, 2, 3) a la denominación textual única.
 */

export function normalizarRol(rol) {
  if (rol === null || rol === undefined) return null;
  const texto = String(rol).trim().toLowerCase();

  if (texto === '1' || texto === 'administrador') return 'administrador';
  if (texto === '2' || texto === 'tecnico' || texto === 'técnico') return 'tecnico';
  if (texto === '3' || texto === 'autorizado') return 'autorizado';

  return texto;
}

/**
 * Devuelve la ruta inicial (pantalla principal) según el rol normalizado.
 */
export function inicioPorRol(rol) {
  const rolNorm = normalizarRol(rol);
  if (rolNorm === 'administrador') return '/';
  if (rolNorm === 'tecnico') return '/tareas';
  if (rolNorm === 'autorizado') return '/tickets';
  return '/login';
}

/**
 * Verifica si un rol tiene permiso para navegar a una ruta dada.
 */
export function rutaPermitidaParaRol(rol, ruta) {
  const rolNorm = normalizarRol(rol);
  if (!rolNorm || !ruta) return false;

  // Rutas comunes a todos los usuarios autenticados
  if (ruta.startsWith('/perfil') || ruta.startsWith('/configuracion')) {
    return true;
  }

  if (rolNorm === 'administrador') {
    return true; // Administrador tiene acceso a todo el panel y sus módulos
  }

  if (rolNorm === 'tecnico') {
    return ruta.startsWith('/tareas') || ruta.startsWith('/notificaciones');
  }

  if (rolNorm === 'autorizado') {
    return ruta.startsWith('/tickets');
  }

  return false;
}
