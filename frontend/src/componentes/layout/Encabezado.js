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
import { Breadcrumbs, RouterProvider } from '@heroui/react';
import { CContainer, CHeader } from '@coreui/react';

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
  '/ordenes-trabajo': 'Órdenes de trabajo',
  '/plantillas-tareas': 'Plantillas de tareas',
  '/edificios': 'Edificios',
  '/espacios': 'Espacios',
  '/espacios/tipos': 'Tipos de espacio',
  '/areas': 'Áreas',
  '/activos': 'Activos',
  '/tipos-activos': 'Tipos de activos',
  '/inventario': 'Inventario',
  '/inventario/tipos': 'Tipos de materiales y herramientas',
  '/tecnicos': 'Técnicos',
  '/especialidades': 'Especialidades',
  '/autorizados': 'Usuarios autorizados',
};

/** Los tramos que se repiten igual en todos los modulos. */
const NOMBRES_COMUNES = {
  agregar: 'Agregar',
  editar: 'Editar',
};

/**
 * Convierte "/edificios/3/editar" en los tramos de la ruta de migas.
 *
 * Los identificadores no se muestran, porque no son una pantalla a la que se
 * pueda entrar. Un identificador es el tramo que va justo antes de "editar":
 * puede ser un numero (/edificios/3/editar) o un codigo, como el de inventario
 * de un activo (/activos/AC-014/editar).
 */
function armarMigas(direccion) {
  const tramos = direccion.split('/').filter(Boolean);
  const migas = [];
  let acumulada = '';

  tramos.forEach((tramo, indice) => {
    acumulada += `/${tramo}`;

    if (/^\d+$/.test(tramo) || tramos[indice + 1] === 'editar') return;

    migas.push({
      texto: NOMBRES[acumulada] ?? NOMBRES_COMUNES[tramo] ?? tramo,
      direccion: acumulada,
      ultima: indice === tramos.length - 1,
    });
  });

  return migas;
}

export default function Encabezado() {
  const direccionActual = usePathname();
  const router = useRouter();
  const migas = armarMigas(direccionActual);

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer className="border-bottom px-4 py-3" fluid>
        <RouterProvider navigate={router.push}>
          <Breadcrumbs className="sigma-migas">
            {/* En la pantalla de inicio, "Inicio" es la unica miga y es la actual. */}
            <Breadcrumbs.Item href={migas.length > 0 ? '/' : undefined}>Inicio</Breadcrumbs.Item>

            {migas.map((miga) => (
              <Breadcrumbs.Item
                key={miga.direccion}
                href={miga.ultima ? undefined : miga.direccion}
              >
                {miga.texto}
              </Breadcrumbs.Item>
            ))}
          </Breadcrumbs>
        </RouterProvider>
      </CContainer>
    </CHeader>
  );
}
