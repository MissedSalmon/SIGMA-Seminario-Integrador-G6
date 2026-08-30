'use client';

/**
 * Lo que se muestra en lugar de la tabla cuando todavia no hay tabla que
 * mostrar: mientras carga (esqueleto), o cuando no hay ningun registro
 * (estado vacio, con icono y una accion opcional).
 */
import CIcon from '@coreui/icons-react';
import { cilInbox } from '@coreui/icons';

import BotonEnlace from './BotonEnlace.js';

/** @deprecated usar EsqueletoFilas dentro de una tabla real. Se deja por si algo la usa suelta. */
export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="text-center text-body-secondary py-5">
      <div className="sigma-esqueleto-linea mx-auto mb-3" style={{ width: '10rem' }} />
      <div>{texto}</div>
    </div>
  );
}

/**
 * Filas de esqueleto para mostrar mientras carga una tabla, con la misma
 * cantidad de columnas que la tabla real para que no salte el layout.
 */
export function EsqueletoFilas({ columnas, filas = 5 }) {
  return Array.from({ length: filas }).map((_, indiceFila) => (
    <tr key={indiceFila}>
      {columnas.map((columna, indiceColumna) => (
        <td key={columna.clave ?? indiceColumna}>
          <div
            className="sigma-esqueleto-linea"
            style={{ width: indiceColumna === columnas.length - 1 ? '4rem' : `${60 + ((indiceColumna * 13) % 30)}%` }}
          />
        </td>
      ))}
    </tr>
  ));
}

/**
 * Estado vacio de una tabla o listado.
 *
 *   <SinDatos texto="Todavia no hay edificios cargados." accion={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }} />
 */
export function SinDatos({ texto, accion, icono = cilInbox }) {
  return (
    <div className="sigma-estado-vacio">
      <div className="sigma-estado-vacio-icono">
        <CIcon icon={icono} size="xl" />
      </div>
      <p className="text-body-secondary mb-0">{texto}</p>
      {accion && (
        <div className="mt-3">
          <BotonEnlace href={accion.direccion}>{accion.texto}</BotonEnlace>
        </div>
      )}
    </div>
  );
}
