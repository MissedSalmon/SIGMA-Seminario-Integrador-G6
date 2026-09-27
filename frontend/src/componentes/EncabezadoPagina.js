'use client';

/**
 * Titulo de una pantalla, con un boton de accion opcional a la derecha.
 *
 *   <EncabezadoPagina titulo="Edificios" accion={{ direccion: '/edificios/agregar' }} />
 *
 * El boton dice "Agregar" a secas: el titulo de arriba ya aclara de que. Por
 * eso el texto no se pasa, sale solo. Se puede cambiar con accion.texto, pero
 * en un alta comun no hace falta.
 *
 * El encabezado es el titulo y nada mas: no lleva una linea de explicacion
 * abajo. Los campos tampoco llevan descripcion (decision del 23/09/2026): la
 * etiqueta dice que va en cada uno, y lo unico que aparece debajo de la caja es
 * el motivo cuando algo esta mal.
 */
import CIcon from '@coreui/icons-react';
import { cilPlus } from '@coreui/icons';

import BotonEnlace from './BotonEnlace.js';

export default function EncabezadoPagina({ titulo, accion }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <h1 className="sigma-titulo">{titulo}</h1>

      {accion && (
        <BotonEnlace href={accion.direccion}>
          <CIcon icon={cilPlus} className="me-2" />
          {accion.texto ?? 'Agregar'}
        </BotonEnlace>
      )}
    </div>
  );
}
