'use client';

/**
 * Lo que se muestra en lugar de la tabla cuando todavia no hay tabla que
 * mostrar: mientras carga, o cuando no hay ningun registro.
 */
import { CSpinner } from '@coreui/react';

export function Cargando({ texto = 'Cargando...' }) {
  return (
    <div className="text-center text-body-secondary py-5">
      <CSpinner color="primary" className="mb-3" />
      <div>{texto}</div>
    </div>
  );
}

export function SinDatos({ texto }) {
  return <div className="text-center text-body-secondary py-5">{texto}</div>;
}
