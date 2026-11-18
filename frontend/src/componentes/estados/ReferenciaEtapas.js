/**
 * La referencia escrita de los colores de los sellos (regla 6 de UI del
 * CLAUDE.md): un color sin su explicacion no se usa. Va al lado de cada lugar
 * que muestra sellos de tickets u OT.
 *
 *   <ReferenciaEtapas />                       todas las etapas
 *   <ReferenciaEtapas etapas={['pendiente', 'enCurso']} />   solo las que aparecen
 */
import { ETAPAS } from './etapas.js';

export default function ReferenciaEtapas({ etapas = Object.keys(ETAPAS), className = '' }) {
  return (
    <div className={`sigma-referencia-etapas ${className}`} aria-label="Referencia de colores de los estados">
      <span className="sigma-referencia-etapas-titulo">Referencia:</span>
      {etapas.map((clave) => (
        <span key={clave} className="sigma-referencia-etapa">
          <span className="sigma-referencia-etapa-muestra" style={{ borderColor: ETAPAS[clave].color }} aria-hidden="true" />
          {ETAPAS[clave].texto}
        </span>
      ))}
    </div>
  );
}
