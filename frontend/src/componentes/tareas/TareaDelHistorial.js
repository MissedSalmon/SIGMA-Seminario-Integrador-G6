import { Fragment } from 'react';
import Link from 'next/link';

/**
 * La columna "Tarea" de los historiales del técnico (materiales y herramientas).
 *
 * La descripción de la tarea es el enlace a su detalle. Abajo, sin enlace, la
 * OT, el activo y el espacio: la pantalla de la OT es del administrador.
 */
export default function TareaDelHistorial({ fila }) {
  if (!fila.idTarea) {
    return <span className="text-body-tertiary fst-italic">Sin tarea registrada</span>;
  }

  const datos = [`OT #${fila.idOt}`, fila.codigoActivo, fila.espacio].filter(Boolean);

  return (
    <>
      <Link href={`/tareas/${fila.idOt}/${fila.idTarea}`}>{fila.tarea || `Tarea ${fila.idTarea}`}</Link>
      <div className="text-body-secondary small">
        {/* Cada dato entero en su renglón: "PROY-001" no se corta en el guion. */}
        {datos.map((dato, indice) => (
          <Fragment key={dato}>
            {indice > 0 && ' · '}
            <span className="text-nowrap">{dato}</span>
          </Fragment>
        ))}
      </div>
    </>
  );
}
