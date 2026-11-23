'use client';

/**
 * Sello de estado de un ticket (HU-10): el estado en mayusculas dentro de un
 * recuadro de linea, en el color de su etapa (ver componentes/estados/etapas.js).
 * La referencia de los colores va al lado, con ReferenciaEtapas.
 */
import { ETAPAS, ETAPA_TICKET } from '@/componentes/estados/etapas.js';

export default function EtiquetaEstadoTicket({ estado }) {
  if (!estado) return null;

  const etapa = ETAPAS[ETAPA_TICKET[estado] ?? 'cerrado'];

  return (
    <span className={`sigma-sello sigma-sello--${etapa.tono}`}>
      {estado}
    </span>
  );
}
