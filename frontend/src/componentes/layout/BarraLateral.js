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
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CNavItem,
  CNavLink,
  CNavTitle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilAccountLogout } from '@coreui/icons';

import { navegacion } from './navegacion.js';
import { useLayout } from './ContextoLayout.js';
import { useSesion } from './ContextoSesion.js';
import { logout } from '@/servicios/auth.js';

/** Devuelve true si el item debe mostrarse al rol dado. Sin propiedad roles = visible para todos. */
function visible(opcion, rol) {
  if (!opcion.roles) return true;
  if (!rol) return false;
  return opcion.roles.includes(rol);
}

/** Todas las direcciones de los enlaces del menu. */
function juntarDirecciones(opciones) {
  return opciones
    .filter((opcion) => opcion.tipo === 'item')
    .map((opcion) => opcion.direccion);
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
  const router = useRouter();
  const { barraVisible, setBarraVisible } = useLayout();
  const { usuario } = useSesion();
  const rol = usuario?.rol ?? null;
  const direccionActual = usePathname() ?? '/';

  // Solo se calculan las direcciones de los items que el usuario puede ver.
  const opcionesVisibles = navegacion.filter((opcion) => visible(opcion, rol));
  const direccionActiva = buscarActiva(direccionActual, juntarDirecciones(opcionesVisibles));

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  /** El enlace directo de una opcion. */
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
      onVisibleChange={(v) => setBarraVisible(v)}
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
        {opcionesVisibles.map((opcion) => {
          if (opcion.tipo === 'titulo') {
            return <CNavTitle key={opcion.texto}>{opcion.texto}</CNavTitle>;
          }
          return enlace(opcion);
        })}
      </ul>

      <CSidebarFooter className="border-top d-flex flex-column px-3 py-2 gap-1">
        {usuario && (
          <div className="text-white-50 small" style={{ fontSize: '0.78rem' }}>
            {usuario.admin_nom_ape || usuario.tecnico_nom_ape || usuario.autorizado_nom_ape || usuario.identificador}
          </div>
        )}
        <button
          type="button"
          className="btn btn-link text-white-50 text-decoration-none d-flex align-items-center gap-2 p-1 border-0"
          onClick={handleLogout}
          title="Cerrar sesión"
          style={{ cursor: 'pointer' }}
        >
          <CIcon icon={cilAccountLogout} />
          <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>Cerrar sesión</span>
        </button>
      </CSidebarFooter>
    </CSidebar>
  );
}
