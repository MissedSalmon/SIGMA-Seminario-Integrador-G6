/**
 * Un dato de una ficha: el rotulo chico arriba y el valor abajo, como un
 * casillero de un formulario preimpreso (mundo «Talonario», ver
 * frontend/DESIGN.md). Si no hay valor muestra un guion.
 *
 *   <Dato etiqueta="Fecha de alta">11/11/2026 16:23</Dato>
 *
 * Antes cada ficha tenia su propia copia de este componente (18/11/2026).
 */
export default function Dato({ etiqueta, children }) {
  return (
    <div className="sigma-dato">
      <div className="sigma-casillero-rotulo">{etiqueta}</div>
      <div className="sigma-dato-valor">{children ?? '-'}</div>
    </div>
  );
}
