/**
 * Layout raiz de la aplicacion.
 *
 * El orden de los estilos importa: primero CoreUI, despues heroui.css (que
 * solo viste el campo de fecha) y al final globals.css, que es donde
 * ajustamos los colores de SIGMA sobre la plantilla.
 */
import { Public_Sans } from 'next/font/google';

import '@coreui/coreui/dist/css/coreui.min.css';
import './heroui.css';
import './globals.css';

/*
 * Public Sans: una grotesca de trabajo, como la de los formularios preimpresos
 * (ver frontend/DESIGN.md, mundo «Talonario»).
 */
const fuente = Public_Sans({
  subsets: ['latin'],
  variable: '--sigma-fuente',
});

export const metadata = {
  title: 'SIGMA',
  description: 'Sistema Integral de Gestión de Mantenimiento de Activos - UTN FRRe',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className={fuente.variable} data-scroll-behavior="smooth">
      <body>
        {children}
      </body>
    </html>
  );
}
