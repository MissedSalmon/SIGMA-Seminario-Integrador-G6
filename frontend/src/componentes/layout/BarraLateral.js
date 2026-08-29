'use client';

/**
 * Barra lateral de navegacion (el menu de la izquierda).
 *
 * Es la version de la plantilla de administracion de CoreUI adaptada a
 * Next.js: en lugar de los enlaces de React Router usa <Link> de Next, y
 * marca como activa la opcion que coincide con la direccion actual.
 *
 * Ojo con CNavItem: su prop `as` reemplaza el <li> de afuera, no el enlace.
 * Por eso el <Link> va en el CNavLink de adentro y no en el CNavItem.
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavItem,
  CNavLink,
  CNavTitle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu } from '@coreui/icons';

import { navegacion } from './navegacion.js';
import { useLayout } from './ContextoLayout.js';

/**
 * Decide si una opcion del menu esta activa.
 * "/edificios" tiene que quedar marcado tambien en "/edificios/agregar".
 */
function estaActiva(direccionActual, direccionDelItem) {
  if (direccionDelItem === '/') {
    return direccionActual === '/';
  }

  return direccionActual.startsWith(direccionDelItem);
}

export default function BarraLateral() {
  const { barraVisible, setBarraVisible } = useLayout();
  const direccionActual = usePathname() ?? '/';

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      visible={barraVisible}
      onVisibleChange={(visible) => setBarraVisible(visible)}
    >
      <CSidebarHeader className="border-bottom d-flex align-items-center justify-content-between">
        <CSidebarBrand as={Link} href="/" className="text-decoration-none">
          <span className="sigma-marca">SIGMA</span>
        </CSidebarBrand>
        <button 
          className="btn btn-link text-white p-0 d-md-none" 
          onClick={() => setBarraVisible(false)}
        >
          <CIcon icon={cilMenu} size="lg" />
        </button>
      </CSidebarHeader>

      <CSidebarNav>
        {navegacion.map((opcion) =>
          opcion.tipo === 'titulo' ? (
            <CNavTitle key={opcion.texto}>{opcion.texto}</CNavTitle>
          ) : (
            <CNavItem key={opcion.direccion}>
              <CNavLink
                as={Link}
                href={opcion.direccion}
                active={estaActiva(direccionActual, opcion.direccion)}
              >
                <CIcon customClassName="nav-icon" icon={opcion.icono} />
                {opcion.texto}
              </CNavLink>
            </CNavItem>
          )
        )}
      </CSidebarNav>

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler />
      </CSidebarFooter>
    </CSidebar>
  );
}
