'use client';

/**
 * Titulo de una pantalla, con un boton de accion opcional a la derecha.
 *
 *   <EncabezadoPagina
 *     titulo="Edificios"
 *     descripcion="Los edificios de la facultad."
 *     accion={{ direccion: '/edificios/agregar' }}
 *   />
 *
 * El boton dice "Agregar" a secas: el titulo de arriba ya aclara de que. Por
 * eso el texto no se pasa, sale solo. Se puede cambiar con accion.texto, pero
 * en un alta comun no hace falta.
 */
import CIcon from '@coreui/icons-react';
import { cilPlus } from '@coreui/icons';

import BotonEnlace from './BotonEnlace.js';

export default function EncabezadoPagina({ titulo, descripcion, accion }) {
  return (
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
      <div>
        <h1 className="sigma-titulo">{titulo}</h1>
        {descripcion && <p className="text-body-secondary mb-0">{descripcion}</p>}
      </div>

      {accion && (
        <BotonEnlace href={accion.direccion}>
          <CIcon icon={cilPlus} className="me-2" />
          {accion.texto ?? 'Agregar'}
        </BotonEnlace>
      )}
    </div>
  );
}
