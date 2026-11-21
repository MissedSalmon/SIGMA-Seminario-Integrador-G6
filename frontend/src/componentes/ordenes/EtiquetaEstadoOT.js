'use client';

/**
 * Sello de estado de una orden de trabajo (HU-14): el estado en mayusculas
 * dentro de un recuadro de linea, en el color de su etapa (ver
 * componentes/estados/etapas.js). La referencia de los colores va al lado,
 * con ReferenciaEtapas.
 */
import { ETAPAS, ETAPA_OT } from '@/componentes/estados/etapas.js';

export default function EtiquetaEstadoOT({ estado }) {
  if (!estado) return null;

  const etapa = ETAPAS[ETAPA_OT[estado] ?? 'pendiente'];

  return (
    <span className={`sigma-sello sigma-sello--${etapa.tono}`}>
      {estado}
    </span>
  );
}
