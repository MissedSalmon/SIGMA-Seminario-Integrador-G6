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

/** Como se muestra cada tramo de la direccion en las migas. */
const NOMBRES = {
  edificios: 'Edificios',
  espacios: 'Espacios',
  tipos: 'Tipos de espacio',
  areas: 'Áreas',
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
