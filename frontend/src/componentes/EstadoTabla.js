'use client';

/**
 * Lo que se muestra en lugar de la tabla cuando todavia no hay tabla que
 * mostrar: mientras carga (esqueleto), cuando no hay ningun registro
 * (talonario en blanco) o cuando la busqueda no encontro nada (con la
 * salida para volver a ver todo).
 */
import { CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilX } from '@coreui/icons';

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
        <td key={columna.clave ?? indiceColumna} className={columna.ocultarDebajoDe ? `d-none d-${columna.ocultarDebajoDe}-table-cell` : undefined}>
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
 * Un talonario en blanco: dos comprobantes apilados, con su talon, la linea de
 * troquel y los renglones vacios (mundo «Talonario», ver frontend/DESIGN.md).
 * Es un dibujo de linea en los colores del sistema; no lleva texto.
 */
function TalonarioEnBlanco() {
  return (
    <svg
      className="sigma-talonario-vacio"
      viewBox="0 0 160 104"
      width="160"
      height="104"
      aria-hidden="true"
      focusable="false"
    >
      {/* El comprobante de atras, corrido. */}
      <rect x="22" y="6" width="130" height="70" rx="6" className="sigma-talonario-vacio-atras" />
      {/* El de adelante: talon, troquel y renglones. */}
      <rect x="8" y="24" width="130" height="72" rx="6" className="sigma-talonario-vacio-hoja" />
      <line x1="46" y1="30" x2="46" y2="90" className="sigma-talonario-vacio-troquel" />
      <rect x="18" y="40" width="18" height="5" rx="2" className="sigma-talonario-vacio-rotulo" />
      <rect x="16" y="52" width="22" height="12" rx="2" className="sigma-talonario-vacio-numero" />
      <rect x="56" y="38" width="64" height="6" rx="3" className="sigma-talonario-vacio-renglon" />
      <rect x="56" y="54" width="70" height="5" rx="2.5" className="sigma-talonario-vacio-renglon" />
      <rect x="56" y="66" width="48" height="5" rx="2.5" className="sigma-talonario-vacio-renglon" />
      <rect x="56" y="78" width="40" height="5" rx="2.5" className="sigma-talonario-vacio-renglon" />
    </svg>
  );
}

/**
 * Estado vacio de una tabla o listado: todavia no se cargo nada.
 *
 *   <SinDatos texto="Todavía no hay edificios cargados." />
 *
 * Avisa que no hay nada, nada mas. No lleva un boton de Agregar a proposito:
 * el de la pantalla esta justo arriba, en el encabezado, y dos botones que
 * hacen lo mismo a diez centimetros uno del otro confunden en vez de ayudar.
 */
export function SinDatos({ texto }) {
  return (
    <div className="sigma-estado-vacio">
      <TalonarioEnBlanco />
      <p className="text-body-secondary mb-0">{texto}</p>
    </div>
  );
}

/**
 * La busqueda o los filtros no encontraron nada. Dice que se busco y ofrece
 * la salida: borrar la busqueda o quitar los filtros, segun lo que haya.
 */
export function SinResultados({ busqueda, alBorrarBusqueda, alQuitarFiltros }) {
  return (
    <div className="sigma-estado-vacio" role="status">
      <p className="mb-1 fw-semibold">
        {busqueda ? <>No hay nada que coincida con «{busqueda}».</> : 'Ningún registro cumple con esos filtros.'}
      </p>
      <p className="text-body-secondary mb-3">Probá con otra palabra o mirá la lista completa.</p>
      <div className="d-flex flex-wrap justify-content-center gap-2">
        {busqueda && alBorrarBusqueda && (
          <CButton color="primary" variant="outline" onClick={alBorrarBusqueda}>
            <CIcon icon={cilX} className="me-1" aria-hidden="true" />
            Borrar la búsqueda
          </CButton>
        )}
        {alQuitarFiltros && (
          <CButton color="primary" variant="outline" onClick={alQuitarFiltros}>
            Quitar los filtros
          </CButton>
        )}
      </div>
    </div>
  );
}
