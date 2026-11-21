/**
 * La referencia escrita de los colores de los sellos (regla 6 de UI del
 * CLAUDE.md): un color sin su explicacion no se usa. Va al lado de cada lugar
 * que muestra sellos de tickets u OT.
 *
 *   <ReferenciaEtapas />                                    todas las etapas
 *   <ReferenciaEtapas etapas={['pendiente', 'enCurso']} />  solo esas etapas
 *   <ReferenciaEtapas de="ot" estados={['Creada', ...]} />  solo lo que hay en pantalla
 *
 * Con `de` ("ot" o "ticket"), cada etapa dice entre parentesis que estados
 * agrupa ("Falta empezar (Creada)"), asi la palabra del sello aparece tambien
 * en la referencia y no hay que deducir que una es la otra.
 *
 * 21/11/2026: con `estados` (los estados de lo que se ve, con repetidos o no)
 * la referencia nombra solo las etapas y los estados que aparecen. Una tabla
 * de OT ya no explica «Cerrado», que una OT nunca tiene, y una ficha explica
 * solo su sello. Si no hay ningun estado, no se dibuja.
 */
import { ETAPAS, ETAPA_OT, ETAPA_TICKET } from './etapas.js';

const ESTADOS_POR_ETAPA = { ot: ETAPA_OT, ticket: ETAPA_TICKET };

export default function ReferenciaEtapas({ etapas, estados, de, className = '' }) {
  const mapa = ESTADOS_POR_ETAPA[de];
  const presentes = estados ? new Set(estados.filter(Boolean)) : null;

  // Los estados de cada etapa, en el orden del flujo, recortados a los presentes.
  const estadosDe = (clave) =>
    mapa
      ? Object.entries(mapa)
          .filter(([estado, etapa]) => etapa === clave && (!presentes || presentes.has(estado)))
          .map(([estado]) => estado)
      : [];

  let claves = etapas ?? Object.keys(ETAPAS);
  if (presentes && mapa) claves = claves.filter((clave) => estadosDe(clave).length > 0);
  if (claves.length === 0) return null;

  return (
    <div className={`sigma-referencia-etapas ${className}`} aria-label="Referencia de colores de los estados">
      <span className="sigma-referencia-etapas-titulo">Referencia:</span>
      {claves.map((clave) => {
        const lista = estadosDe(clave).join(', ');
        // Si el estado se llama igual que la etapa («Cerrado»), no se repite.
        const detalle = lista === ETAPAS[clave].texto ? '' : lista;
        return (
          <span key={clave} className="sigma-referencia-etapa">
            <span className="sigma-referencia-etapa-muestra" style={{ color: ETAPAS[clave].color }} aria-hidden="true" />
            {ETAPAS[clave].texto}
            {detalle && <span className="text-body-secondary">({detalle})</span>}
          </span>
        );
      })}
    </div>
  );
}
