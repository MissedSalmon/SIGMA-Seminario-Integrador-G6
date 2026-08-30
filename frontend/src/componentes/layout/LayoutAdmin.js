'use client';

/**
 * El armazon de todas las pantallas: barra lateral + encabezado + contenido
 * + pie de pagina.
 *
 * Es el layout de la plantilla de administracion de CoreUI. Se aplica una
 * sola vez, en src/app/layout.js, asi que cada pantalla nueva solo escribe su
 * contenido y ya aparece dentro del panel.
 */
import { CContainer } from '@coreui/react';

import { ProveedorLayout } from './ContextoLayout.js';
import BarraLateral from './BarraLateral.js';
import Encabezado from './Encabezado.js';
import PieDePagina from './PieDePagina.js';
import { ProveedorToast } from '@/componentes/toast/ContextoToast.js';
import Toast from '@/componentes/toast/Toast.js';

export default function LayoutAdmin({ children }) {
  return (
    <ProveedorToast>
      <ProveedorLayout>
        <BarraLateral />

        <div className="wrapper d-flex flex-column min-vh-100">
          <Encabezado />

          <div className="body flex-grow-1">
            <CContainer className="px-4" fluid>
              {children}
            </CContainer>
          </div>

          <PieDePagina />
        </div>

        <Toast />
      </ProveedorLayout>
    </ProveedorToast>
  );
}
