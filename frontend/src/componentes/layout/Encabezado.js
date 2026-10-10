'use client';

/**
 * Barra de arriba: el boton que abre el menu en el celular y la ruta de
 * migas (el "Inicio / Edificios / Agregar" que indica donde estas parado).
 *
 * Las migas son el componente Breadcrumbs de HeroUI. Antes era el de CoreUI.
 * El cambio trae dos cosas:
 *
 * - LA ULTIMA MIGA LA MARCA EL COMPONENTE. A la que corresponde a la pantalla
 *   donde estamos no se le pasa direccion, y con eso react-aria ya la muestra
 *   como "estas aca" (sin enlace y con data-current). Antes habia que decirle
 *   cual era la ultima a mano.
 *
 * - LOS ENLACES SE VEN TODOS IGUAL. Antes "Inicio" quedaba subrayado y los
 *   demas no, porque el "text-decoration-none" caia en el <li> y no en el
 *   enlace. Ahora el subrayado aparece solo al pasar por encima, parejo.
 *
 * Los colores y el tamano siguen siendo los de SIGMA, no los de HeroUI: eso
 * esta en globals.css, en .sigma-migas.
 *
 * RouterProvider es lo que hace que un clic en una miga navegue por dentro
 * (como un <Link> de Next) y no recargue la pantalla entera: los enlaces de
 * react-aria son <a> comunes hasta que se les dice como navegar.
 */
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Breadcrumbs, RouterProvider } from '@heroui/react';
import {
  CContainer,
  CHeader,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CDropdownDivider,
  CDropdownHeader,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu, cilUser, cilAccountLogout, cilLockLocked } from '@coreui/icons';
import { useLayout } from './ContextoLayout.js';
import { logout } from '@/servicios/auth.js';

/**
 * Como se muestra cada pantalla en las migas.
 *
 * El texto tiene que ser el mismo que el titulo de la pantalla: si en la
 * direccion dice "tipos-activos" y arriba dice "Tipos de activos", la miga dice
 * "Tipos de activos". Cada pantalla nueva se suma aca.
 *
 * SE BUSCA POR LA DIRECCION ENTERA, no por el ultimo tramo. Es lo que permite
 * que "tipos" signifique una cosa en espacios y otra en inventario: si se
 * buscara por el tramo suelto, /inventario/tipos mostraria "Tipos de espacio".
 */
const NOMBRES = {
  '/tickets': 'Tickets',
  '/tareas': 'Mis tareas',
  '/ordenes-trabajo': 'Órdenes de trabajo',
  '/plantillas-tareas': 'Plantillas de tareas',
  '/edificios': 'Edificios',
  '/espacios': 'Espacios',
  '/espacios/tipos': 'Tipos de espacio',
  '/areas': 'Áreas',
  '/activos': 'Activos',
  '/tipos-activos': 'Tipos de activos',
  '/inventario/tipos': 'Tipos de materiales y herramientas',
  '/inventario/remitos': 'Ingresos por remito',
  '/inventario/materiales': 'Materiales',
  '/inventario/herramientas': 'Herramientas',
  '/tecnicos': 'Técnicos',
  '/especialidades': 'Especialidades',
  '/prestadores/tipos': 'Tipos de prestador',
  '/autorizados': 'Usuarios autorizados',
  '/perfil': 'Mi Perfil',
  '/configuracion/cambiar-password': 'Cambiar contraseña'
};

/** Los tramos que se repiten igual en todos los modulos. */
const NOMBRES_COMUNES = {
  agregar: 'Agregar',
  editar: 'Editar',
};

/**
 * Los modulos cuyo registro se identifica con un codigo y no con un numero.
 *
 * Hace falta para la ficha de un material o una herramienta
 * (/inventario/materiales/MAT-006): el tramo "MAT-006" es un identificador,
 * pero no es un numero ni viene seguido de "editar", asi que las dos reglas de
 * abajo no lo agarran y la miga terminaria mostrando el codigo.
 */
const MODULOS_CON_CODIGO = [
  '/activos',
  '/inventario/materiales',
  '/inventario/herramientas',
  '/tecnicos',
];

/**
 * Convierte "/edificios/3/editar" en los tramos de la ruta de migas.
 *
 * Los identificadores no se muestran, porque no son una pantalla a la que se
 * pueda entrar. Un identificador es el tramo que va justo antes de "editar":
 * puede ser un numero (/edificios/3/editar) o un codigo, como el de inventario
 * de un activo (/activos/AC-014/editar). Tambien lo es el tramo que cuelga
 * directo de un modulo de MODULOS_CON_CODIGO (/inventario/materiales/MAT-006).
 */
function armarMigas(direccion) {
  const tramos = direccion.split('/').filter(Boolean);
  const migas = [];
  let acumulada = '';

  tramos.forEach((tramo, indice) => {
    const padre = acumulada;
    acumulada += `/${tramo}`;

    if (/^\d+$/.test(tramo) || tramos[indice + 1] === 'editar') return;

    // "Inventario" es el grupo del menu, no una pantalla: no tiene una
    // pagina propia (/inventario no resuelve a nada), asi que se muestra
    // como una miga sin enlace y nunca como la pantalla en si misma.
    if (acumulada === '/inventario') {
      migas.push({ texto: 'Inventario', direccion: null, ultima: false });
      return;
    }

    // Lo mismo con "Prestadores de servicio": el listado de prestadores es la
    // HU-33 y todavia no existe. Cuando se haga, se saca esto y se agrega
    // '/prestadores' al mapa NOMBRES.
    if (acumulada === '/prestadores') {
      migas.push({ texto: 'Prestadores de servicio', direccion: null, ultima: false });
      return;
    }

    /*
     * Un codigo colgado de un modulo es un identificador, salvo que ese tramo
     * sea una pantalla: una con nombre propio o una de las comunes
     * (/activos/agregar).
     */
    if (
      MODULOS_CON_CODIGO.includes(padre) &&
      !NOMBRES[acumulada] &&
      !NOMBRES_COMUNES[tramo]
    ) {
      return;
    }

    /*
     * Las tareas de una OT no tienen listado propio: viven en el detalle de la
     * OT. Por eso en /ordenes-trabajo/5/tareas/agregar el tramo "tareas" se
     * muestra como la OT y lleva a su detalle.
     */
    if (tramo === 'tareas' && tramos[indice - 2] === 'ordenes-trabajo') {
      migas.push({
        texto: `Orden de trabajo #${tramos[indice - 1]}`,
        direccion: `/ordenes-trabajo/${tramos[indice - 1]}`,
        ultima: false,
      });
      return;
    }

    migas.push({
      texto: NOMBRES[acumulada] ?? NOMBRES_COMUNES[tramo] ?? tramo,
      direccion: acumulada,
      ultima: indice === tramos.length - 1,
    });
  });

  return migas;
}

export default function Encabezado() {
  const { barraVisible, setBarraVisible } = useLayout();
  const direccionActual = usePathname();
  const router = useRouter();
  const migas = armarMigas(direccionActual);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer className="border-bottom px-4 py-3 d-flex align-items-center justify-content-between" fluid>
        <div className="d-flex align-items-center flex-grow-1">
          <button
            className="btn btn-link text-body p-0 d-md-none me-3"
            onClick={() => setBarraVisible(!barraVisible)}
            aria-label="Alternar menú"
          >
            <CIcon icon={cilMenu} size="lg" />
          </button>
          <RouterProvider navigate={router.push}>
            <Breadcrumbs className="sigma-migas">
              {/* En la pantalla de inicio, "Inicio" es la unica miga y es la actual. */}
              <Breadcrumbs.Item href={migas.length > 0 ? '/' : undefined}>Inicio</Breadcrumbs.Item>

              {migas.map((miga) => (
                <Breadcrumbs.Item
                  key={miga.direccion ?? miga.texto}
                  href={miga.ultima || !miga.direccion ? undefined : miga.direccion}
                >
                  {miga.texto}
                </Breadcrumbs.Item>
              ))}
            </Breadcrumbs>
          </RouterProvider>
        </div>

        <div className="d-flex align-items-center">
          <CDropdown variant="nav-item" placement="bottom-end">
            <CDropdownToggle
              className="py-0 px-2 d-flex align-items-center btn btn-ghost-primary rounded-circle"
              caret={false}
              aria-label="Perfil y opciones de cuenta"
              style={{ width: '2.4rem', height: '2.4rem', justifyContent: 'center' }}
            >
              <CIcon icon={cilUser} size="lg" />
            </CDropdownToggle>
            <CDropdownMenu className="pt-0 shadow-sm border" style={{ minWidth: '13rem', borderRadius: 'var(--sigma-radio-md)' }}>
              <CDropdownHeader className="bg-light fw-semibold py-2 text-secondary" style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Mi Cuenta
              </CDropdownHeader>
              <CDropdownItem as={Link} href="/perfil" className="d-flex align-items-center gap-2 py-2">
                <CIcon icon={cilUser} />
                <span>Mi Perfil</span>
              </CDropdownItem>
              <CDropdownItem as={Link} href="/configuracion/cambiar-password" className="d-flex align-items-center gap-2 py-2">
                <CIcon icon={cilLockLocked} />
                <span>Cambiar contraseña</span>
              </CDropdownItem>
              <CDropdownDivider className="my-1" />
              <CDropdownItem
                as="button"
                onClick={handleLogout}
                className="d-flex align-items-center gap-2 py-2 text-danger"
              >
                <CIcon icon={cilAccountLogout} />
                <span>Cerrar sesión</span>
              </CDropdownItem>
            </CDropdownMenu>
          </CDropdown>
        </div>
      </CContainer>
    </CHeader>
  );
}
