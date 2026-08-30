/**
 * Layout raiz de la aplicacion.
 *
 * Todas las pantallas quedan dentro del panel de administracion (barra
 * lateral + encabezado + pie), asi que el armazon se aplica una sola vez aca.
 *
 * El orden de los estilos importa: primero CoreUI, despues globals.css, que
 * es donde ajustamos los colores de SIGMA sobre la plantilla.
 */
import '@coreui/coreui/dist/css/coreui.min.css';
import './globals.css';

import LayoutAdmin from '@/componentes/layout/LayoutAdmin.js';

export const metadata = {
  title: 'SIGMA',
  description: 'Sistema Integral de Gestion de Mantenimiento de Activos - UTN FRRe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <LayoutAdmin>{children}</LayoutAdmin>
      </body>
    </html>
  );
}
