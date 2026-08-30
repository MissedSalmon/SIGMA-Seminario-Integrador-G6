'use client';

/**
 * Barra de arriba: el boton que abre el menu en el celular y la ruta de
 * migas (el "Inicio / Edificios / Agregar" que indica donde estas parado).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  CBreadcrumb,
  CBreadcrumbItem,
  CContainer,
  CHeader,
} from '@coreui/react';

/**
 * Como se muestra cada tramo de la direccion en las migas.
 *
 * El texto tiene que ser el mismo que el titulo de la pantalla: si en la
 * direccion dice "tipos-activos" y arriba dice "Tipos de activos", la miga
 * dice "Tipos de activos". Cada pantalla nueva se suma aca.
 */
const NOMBRES = {
  edificios: 'Edificios',
  espacios: 'Espacios',
  tipos: 'Tipos de espacio',
  areas: 'Áreas',
  activos: 'Activos',
  'tipos-activos': 'Tipos de activos',
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
      texto: NOMBRES[tramo] ?? tramo,
      direccion: acumulada,
      ultima: indice === tramos.length - 1,
    });
  });

  return migas;
}

export default function Encabezado() {
  const direccionActual = usePathname();
  const migas = armarMigas(direccionActual);

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer className="border-bottom px-4 py-3" fluid>
        <CBreadcrumb className="my-0 fs-5 fw-semibold">
          <CBreadcrumbItem href="/" className="text-decoration-none">Inicio</CBreadcrumbItem>
          {migas.map((miga) =>
            miga.ultima ? (
              <CBreadcrumbItem key={miga.direccion} active>
                {miga.texto}
              </CBreadcrumbItem>
            ) : (
              <CBreadcrumbItem key={miga.direccion}>
                <Link href={miga.direccion} className="text-decoration-none">{miga.texto}</Link>
              </CBreadcrumbItem>
            )
          )}
        </CBreadcrumb>
      </CContainer>
    </CHeader>
  );
}
