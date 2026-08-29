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
  CHeaderToggler,
  CHeaderNav,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilMenu } from '@coreui/icons';

import { useLayout } from './ContextoLayout.js';

/** Como se muestra cada tramo de la direccion en las migas. */
const NOMBRES = {
  edificios: 'Edificios',
  espacios: 'Espacios',
  areas: 'Areas',
  agregar: 'Agregar',
  editar: 'Editar',
};

/**
 * Convierte "/edificios/3/editar" en los tramos de la ruta de migas.
 * Los tramos que son un numero (el id) no se muestran.
 */
function armarMigas(direccion) {
  const tramos = direccion.split('/').filter(Boolean);
  const migas = [];
  let acumulada = '';

  tramos.forEach((tramo, indice) => {
    acumulada += `/${tramo}`;

    if (/^\d+$/.test(tramo)) return;

    migas.push({
      texto: NOMBRES[tramo] ?? tramo,
      direccion: acumulada,
      ultima: indice === tramos.length - 1,
    });
  });

  return migas;
}

export default function Encabezado() {
  const { barraVisible, setBarraVisible } = useLayout();
  const direccionActual = usePathname();
  const migas = armarMigas(direccionActual);

  return (
    <CHeader position="sticky" className="mb-4 p-0">
      <CContainer className="border-bottom px-4" fluid>
        <CHeaderToggler onClick={() => setBarraVisible(!barraVisible)}>
          <CIcon icon={cilMenu} size="lg" />
        </CHeaderToggler>

        <CHeaderNav className="d-none d-md-flex">
          <CBreadcrumb className="my-0">
            <CBreadcrumbItem href="/">Inicio</CBreadcrumbItem>
            {migas.map((miga) =>
              miga.ultima ? (
                <CBreadcrumbItem key={miga.direccion} active>
                  {miga.texto}
                </CBreadcrumbItem>
              ) : (
                <CBreadcrumbItem key={miga.direccion}>
                  <Link href={miga.direccion}>{miga.texto}</Link>
                </CBreadcrumbItem>
              )
            )}
          </CBreadcrumb>
        </CHeaderNav>
      </CContainer>
    </CHeader>
  );
}
