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

/*
  Punto de quiebre "escritorio" de la plantilla de CoreUI (el mismo que usa
  la variable --cui-is-mobile del CSS compilado): a partir de 992px la barra
  deja de ser un overlay para quedar siempre fija al costado.
*/
const PUNTO_QUIEBRE_ESCRITORIO = 992;

export default function BarraLateral() {
  const { barraVisible, setBarraVisible } = useLayout();
  const direccionActual = usePathname() ?? '/';

  return (
    <CSidebar
      className="border-end"
      colorScheme="dark"
      position="fixed"
      visible={barraVisible}
      onVisibleChange={(visible) => {
        /*
         * CSidebar tambien dispara este callback al cruzar el punto de
         * quiebre mobile/escritorio, con una medicion de posicion que todavia
         * no se actualizo (bug conocido: mide antes de que React vuelva a
         * pintar las clases nuevas). Eso hacia que la barra se ocultara sola
         * al agrandar la ventana en escritorio, sin ninguna forma de
         * volver a abrirla. En escritorio no hay ningun boton que la cierre
         * a mano, asi que ahi se ignora el callback; en mobile (donde si hay
         * un boton para cerrarla) se respeta como siempre.
         */
        if (typeof window !== 'undefined' && window.innerWidth < PUNTO_QUIEBRE_ESCRITORIO) {
          setBarraVisible(visible);
        }
      }}
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

      <CSidebarNav className="mt-2">
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
