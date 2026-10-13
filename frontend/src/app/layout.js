/**
 * Layout raiz de la aplicacion.
 *
 * El orden de los estilos importa: primero CoreUI, despues heroui.css (que
 * solo viste el campo de fecha) y al final globals.css, que es donde
 * ajustamos los colores de SIGMA sobre la plantilla.
 */
import { Inter } from 'next/font/google';

import '@coreui/coreui/dist/css/coreui.min.css';
import './heroui.css';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--sigma-fuente',
});

export const metadata = {
  title: 'SIGMA',
  description: 'Sistema Integral de Gestión de Mantenimiento de Activos - UTN FRRe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={inter.variable}>
      <body>
        {children}
      </body>
    </html>
  );
}
