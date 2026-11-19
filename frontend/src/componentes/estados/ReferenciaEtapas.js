/**
 * La referencia escrita de los colores de los sellos (regla 6 de UI del
 * CLAUDE.md): un color sin su explicacion no se usa. Va al lado de cada lugar
 * que muestra sellos de tickets u OT.
 *
 *   <ReferenciaEtapas />                                    todas las etapas
 *   <ReferenciaEtapas etapas={['pendiente', 'enCurso']} />  solo las que aparecen
 *   <ReferenciaEtapas de="ot" />                            nombra los estados de OT
 *
 * Con `de` ("ot" o "ticket"), cada etapa dice entre parentesis que estados
 * agrupa ("Falta empezar (Creada)"), asi la palabra del sello aparece tambien
 * en la referencia y no hay que deducir que una es la otra.
 */
import { ETAPAS, ETAPA_OT, ETAPA_TICKET } from './etapas.js';

const ESTADOS_POR_ETAPA = { ot: ETAPA_OT, ticket: ETAPA_TICKET };

/** Los estados que caen en una etapa, en el orden del flujo: "Asignada, En ejecución". */
function estadosDe(mapa, etapa) {
  return Object.entries(mapa)
    .filter(([, clave]) => clave === etapa)
    .map(([estado]) => estado)
    .join(', ');
}

export default function ReferenciaEtapas({ etapas = Object.keys(ETAPAS), de, className = '' }) {
  const mapa = ESTADOS_POR_ETAPA[de];

  return (
    <div className={`sigma-referencia-etapas ${className}`} aria-label="Referencia de colores de los estados">
      <span className="sigma-referencia-etapas-titulo">Referencia:</span>
      {etapas.map((clave) => {
        const estados = mapa ? estadosDe(mapa, clave) : '';
        return (
          <span key={clave} className="sigma-referencia-etapa">
            <span className="sigma-referencia-etapa-muestra" style={{ borderColor: ETAPAS[clave].color }} aria-hidden="true" />
            {ETAPAS[clave].texto}
            {estados && <span className="text-body-secondary">({estados})</span>}
          </span>
        );
      })}
    </div>
  );
}
