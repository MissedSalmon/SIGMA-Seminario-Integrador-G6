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
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarNav,
  CSidebarToggler,
  CNavGroup,
  CNavItem,
  CNavLink,
  CNavTitle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu } from '@coreui/icons';

import { navegacion } from './navegacion.js';
import { useLayout } from './ContextoLayout.js';

/** Todas las direcciones del menu, incluidas las de adentro de los grupos. */
function juntarDirecciones(opciones) {
  return opciones.flatMap((opcion) => {
    if (opcion.tipo === 'grupo') return opcion.items.map((item) => item.direccion);
    if (opcion.tipo === 'item') return [opcion.direccion];
    return [];
  });
}

/**
 * De todas las opciones del menu, cual es la que hay que marcar como activa.
 *
 * Se queda con la mas larga que coincida, asi en "/espacios/tipos/agregar"
 * queda marcado "Tipos de espacio" y no "Listado de espacios", aunque las dos
 * direcciones arranquen igual.
 */
function buscarActiva(direccionActual, direcciones) {
  let activa = null;

  for (const direccion of direcciones) {
    const coincide =
      direccion === '/'
        ? direccionActual === '/'
        : direccionActual === direccion || direccionActual.startsWith(`${direccion}/`);

    if (coincide && (activa === null || direccion.length > activa.length)) {
      activa = direccion;
    }
  }

  return activa;
}

export default function BarraLateral() {
  const { barraVisible, setBarraVisible } = useLayout();
  const direccionActual = usePathname() ?? '/';
  const direccionActiva = buscarActiva(direccionActual, juntarDirecciones(navegacion));

  // Los desplegables que el usuario abrio o cerro a mano, por nombre de grupo.
  // Mientras no toque ninguno, el grupo se abre solo si estamos en una de sus
  // pantallas.
  const [gruposAbiertos, setGruposAbiertos] = useState({});

  function abrirOCerrar(texto, abierto) {
    setGruposAbiertos((grupos) => ({ ...grupos, [texto]: abierto }));
  }

  /** El enlace de una opcion. Se usa suelto y tambien adentro de un grupo. */
  function enlace(opcion) {
    return (
      <CNavItem key={opcion.direccion}>
        <CNavLink
          as={Link}
          href={opcion.direccion}
          active={opcion.direccion === direccionActiva}
        >
          <CIcon customClassName="nav-icon" icon={opcion.icono} />
          {opcion.texto}
        </CNavLink>
      </CNavItem>
    );
  }

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
        {navegacion.map((opcion) => {
          if (opcion.tipo === 'titulo') {
            return <CNavTitle key={opcion.texto}>{opcion.texto}</CNavTitle>;
          }

          if (opcion.tipo === 'grupo') {
            // El desplegable arranca abierto si estamos en alguna de sus pantallas.
            const abierto =
              gruposAbiertos[opcion.texto] ??
              opcion.items.some((item) => item.direccion === direccionActiva);

            return (
              <CNavGroup
                key={opcion.texto}
                visible={abierto}
                onVisibleChange={(valor) => abrirOCerrar(opcion.texto, valor)}
                toggler={
                  <>
                    <CIcon customClassName="nav-icon" icon={opcion.icono} />
                    {opcion.texto}
                  </>
                }
              >
                {opcion.items.map(enlace)}
              </CNavGroup>
            );
          }

          return enlace(opcion);
        })}
      </CSidebarNav>

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler />
      </CSidebarFooter>
    </CSidebar>
  );
}
