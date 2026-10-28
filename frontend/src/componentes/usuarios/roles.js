/**
 * Como se muestra cada rol de usuario. La API habla con el texto del rol
 * ('administrador', 'tecnico', 'autorizado'); aca va el nombre para la pantalla.
 */
export const NOMBRES_ROL = {
  administrador: 'Administrador',
  tecnico: 'Técnico',
  autorizado: 'Usuario autorizado',
};

export const OPCIONES_ROL = Object.entries(NOMBRES_ROL).map(([valor, texto]) => ({ valor, texto }));
