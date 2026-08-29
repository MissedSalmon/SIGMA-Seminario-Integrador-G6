'use client';

/**
 * Un enlace que se ve como un boton de CoreUI.
 *
 * Por que no se usa <CButton as={Link}>: CButton, cuando recibe `href`,
 * ignora el `as` y arma un <a> comun. Eso funciona, pero cada clic recarga
 * toda la aplicacion en vez de navegar como hace Next.js. Este componente usa
 * el <Link> de Next con las clases de boton de CoreUI, asi que se ve igual y
 * navega bien.
 *
 *   <BotonEnlace href="/edificios/agregar">Agregar edificio</BotonEnlace>
 *   <BotonEnlace href="/edificios" color="secondary" variante="outline">Cancelar</BotonEnlace>
 */
import Link from 'next/link';

export default function BotonEnlace({
  href,
  color = 'primary',
  variante,
  tamano,
  className,
  children,
  ...resto
}) {
  const clases = [
    'btn',
    variante ? `btn-${variante}-${color}` : `btn-${color}`,
    tamano && `btn-${tamano}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Link href={href} className={clases} {...resto}>
      {children}
    </Link>
  );
}
