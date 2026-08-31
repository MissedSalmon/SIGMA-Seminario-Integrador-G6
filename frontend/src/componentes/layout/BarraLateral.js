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
 *
 * Ojo tambien con CSidebarNav: no se usa a proposito. Ese componente no hace
 * mas que este <ul className="sidebar-nav">, pero ademas mete un contexto que
 * maneja el acordeon por su cuenta. Queremos el acordeon, pero el de CoreUI
 * pelea con nuestro estado: al abrir un grupo teniendo otro abierto, cerraba
 * el anterior y no abria el nuevo, y habia que hacer clic dos veces. Ese
 * contexto no se exporta, asi que no hay forma de desactivarlo desde afuera:
 * se arma el <ul> a mano y el acordeon lo llevamos nosotros, mas abajo.
 */
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
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

  /*
   * Solo se puede tener un desplegable abierto a la vez: al abrir uno, el que
   * estaba abierto se cierra. Asi el menu no se llena de opciones y siempre
   * entra en la pantalla sin tener que hacer scroll.
   *
   * Por eso se guarda el NOMBRE del grupo abierto y no un abierto/cerrado por
   * cada uno: si solo puede haber uno, un solo dato alcanza.
   *
   * Los tres valores posibles:
   *   undefined  el usuario todavia no toco el menu
   *   null       lo toco y no dejo ninguno abierto
   *   "Activos"  ese es el que esta abierto
   */
  const [grupoAbierto, setGrupoAbierto] = useState(undefined);

  /** El grupo que contiene la pantalla en la que estamos, si hay alguno. */
  const grupoDeLaPantalla =
    navegacion.find(
      (opcion) =>
        opcion.tipo === 'grupo' &&
        opcion.items.some((item) => item.direccion === direccionActiva)
    )?.texto ?? null;

  // Mientras no toque nada, se abre solo el grupo de la pantalla actual.
  const abiertoAhora = grupoAbierto === undefined ? grupoDeLaPantalla : grupoAbierto;

  function abrirOCerrar(texto, abierto) {
    setGrupoAbierto(abierto ? texto : null);
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

      <ul className="sidebar-nav">
        {navegacion.map((opcion) => {
          if (opcion.tipo === 'titulo') {
            return <CNavTitle key={opcion.texto}>{opcion.texto}</CNavTitle>;
          }

          if (opcion.tipo === 'grupo') {
            return (
              <CNavGroup
                key={opcion.texto}
                visible={abiertoAhora === opcion.texto}
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
      </ul>

      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler />
      </CSidebarFooter>
    </CSidebar>
  );
}
