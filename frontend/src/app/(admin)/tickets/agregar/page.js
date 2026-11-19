'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTicket from '@/componentes/tickets/FormularioTicket.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';
import { registrarTicket } from '@/servicios/tickets.js';

export default function PantallaRegistrarTicket() {
  const router = useRouter();
  const { usuario } = useSesion();
  const esAutorizado = usuario?.rol === 'autorizado';

  // Sólo el autorizado registra tickets: a los demás se los vuelve al listado.
  useEffect(() => {
    if (usuario && !esAutorizado) router.replace('/tickets');
  }, [usuario, esAutorizado, router]);

  if (!esAutorizado) return null;

  return (
    <>
      <EncabezadoPagina titulo="Registrar ticket" />
      <FormularioTicket onGuardar={registrarTicket} />
    </>
  );
}
