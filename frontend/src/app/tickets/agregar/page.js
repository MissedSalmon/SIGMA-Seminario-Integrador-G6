'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTicket from '@/componentes/tickets/FormularioTicket.js';
import { registrarTicket } from '@/servicios/tickets.js';

export default function PantallaRegistrarTicket() {
  return (
    <>
      <EncabezadoPagina titulo="Registrar ticket" />
      <FormularioTicket onGuardar={registrarTicket} />
    </>
  );
}
