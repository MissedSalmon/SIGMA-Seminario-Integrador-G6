'use client';

/**
 * Para elegir varias opciones de una lista larga (03/11/2026).
 *
 * Arriba va un buscador (el mismo CampoLista de todo el sistema, que se filtra
 * escribiendo) y cada opción que se elige pasa a una ficha de abajo, con su
 * cruz para sacarla. Sirve igual con 5 opciones que con 200, a diferencia de
 * una lista de casillas. Lo usan las tareas y los técnicos del plan
 * preventivo.
 *
 *   <SeleccionConChips
 *     id="tareas"
 *     etiqueta="Tareas"
 *     opciones={[{ valor: 10, texto: 'Limpiar filtros (Refrigeracion)' }]}
 *     elegidos={idsTareas}
 *     alCambiar={setIdsTareas}
 *     placeholder="Buscar tarea para agregar"
 *     textoSinElegir="Todavía no agregaste tareas."
 *     accion={<CButton>Agregar</CButton>}
 *   />
 *
 * `accion` es un botón opcional que va al lado del buscador, alineado con la
 * caja (por ejemplo, para crear una opción que no está en la lista).
 */
import { useState } from 'react';
import { CCloseButton, CFormLabel } from '@coreui/react';

import CampoLista from '@/componentes/formulario/CampoLista.js';

export default function SeleccionConChips({
  id,
  etiqueta,
  opciones = [],
  elegidos = [],
  alCambiar,
  placeholder = 'Buscar para agregar',
  textoSinElegir = '',
  obligatorio = false,
  revisado = false,
  error = '',
  ancho = 34,
  accion = null,
}) {
  // Cambiar la clave vuelve a montar el buscador vacío después de cada elección.
  const [vuelta, setVuelta] = useState(0);

  const sinElegir = opciones.filter((opcion) => !elegidos.includes(opcion.valor));
  const fichas = elegidos
    .map((valor) => opciones.find((opcion) => opcion.valor === valor))
    .filter(Boolean);

  function agregar(texto) {
    const opcion = opciones.find((una) => String(una.valor) === texto);
    if (opcion) alCambiar([...elegidos, opcion.valor]);
    setVuelta((numero) => numero + 1);
  }

  function quitar(valor) {
    alCambiar(elegidos.filter((otro) => otro !== valor));
  }

  return (
    <div>
      <div className="sigma-campos">
        <CampoLista
          key={vuelta}
          id={id}
          etiqueta={etiqueta}
          valor=""
          alCambiar={agregar}
          opciones={sinElegir}
          placeholder={sinElegir.length === 0 && opciones.length > 0 ? 'Ya están todas agregadas' : placeholder}
          deshabilitado={sinElegir.length === 0}
          obligatorio={obligatorio}
          revisado={revisado}
          error={error}
          ancho={ancho}
        />

        {accion && (
          <div className="sigma-campo">
            {/* La etiqueta invisible baja el botón a la altura de la caja. */}
            <CFormLabel className="invisible" aria-hidden="true">
              {etiqueta}
            </CFormLabel>
            {accion}
          </div>
        )}
      </div>

      {fichas.length > 0 ? (
        <ul className="list-unstyled d-flex flex-wrap gap-2 mt-2 mb-0" aria-label={`${etiqueta} elegidas`}>
          {fichas.map((opcion) => (
            <li key={opcion.valor} className="d-inline-flex align-items-center gap-1 border rounded px-2 py-1 bg-body-tertiary">
              <span>{opcion.texto}</span>
              <CCloseButton
                className="ms-1"
                style={{ fontSize: '0.6rem' }}
                aria-label={`Quitar ${opcion.texto}`}
                onClick={() => quitar(opcion.valor)}
              />
            </li>
          ))}
        </ul>
      ) : (
        textoSinElegir && <p className="text-body-secondary small mt-2 mb-0">{textoSinElegir}</p>
      )}
    </div>
  );
}
