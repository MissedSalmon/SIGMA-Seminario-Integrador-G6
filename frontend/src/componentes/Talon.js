'use client';

/**
 * El talon: el numero de un registro como su identidad, como en un talonario
 * de ordenes de trabajo (mundo «Talonario», ver frontend/DESIGN.md).
 *
 *   <Talon rotulo="OT N°" numero={47} />
 *   <Talon numero={34} href="/tickets/34" />   (en una tabla, sin rotulo)
 *
 * Con `href` el talon es un enlace a la ficha del registro.
 */
import Link from 'next/link';

export default function Talon({ rotulo, numero, href, titulo }) {
  const contenido = (
    <>
      {/* En una tabla el rotulo ya lo dice el encabezado de la columna. */}
      {rotulo && <span className="sigma-talon-rotulo">{rotulo}</span>}
      <span className="sigma-talon-numero">{numero}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className="sigma-talon" title={titulo}>
        {contenido}
      </Link>
    );
  }

  return <span className="sigma-talon">{contenido}</span>;
}
