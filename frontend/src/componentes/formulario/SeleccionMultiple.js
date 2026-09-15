'use client';

/**
 * Un desplegable para elegir varias opciones a la vez.
 *
 * Se ve como una lista comun, pero al abrirlo cada opcion es una casilla para
 * tildar. Arriba de todo hay una casilla que marca y desmarca todas juntas, y
 * que queda tildada solo cuando estan todas.
 *
 * El menu no se cierra al tildar (`autoClose="outside"`): se eligen varias de
 * una y se cierra haciendo clic afuera.
 *
 *   <SeleccionMultiple
 *     id="especialidades"
 *     etiqueta="Especialidades"
 *     opciones={[{ valor: 1, texto: 'Plomeria' }]}
 *     elegidos={elegidos}
 *     alCambiar={setElegidos}
 *     textoTodas="Todas las especialidades"
 *   />
 */
import { CDropdown, CDropdownMenu, CDropdownToggle, CFormCheck, CFormLabel } from '@coreui/react';

/** Lo que muestra el boton cerrado. */
function resumen(opciones, elegidos, placeholder, textoTodas) {
  if (elegidos.length === 0) return placeholder;
  if (elegidos.length === opciones.length) return textoTodas;
  if (elegidos.length <= 2) {
    return opciones
      .filter((opcion) => elegidos.includes(opcion.valor))
      .map((opcion) => opcion.texto)
      .join(', ');
  }
  return `${elegidos.length} seleccionadas`;
}

export default function SeleccionMultiple({
  id,
  etiqueta,
  opciones = [],
  elegidos = [],
  alCambiar,
  textoTodas = 'Todas',
  placeholder = 'Seleccionar',
  ayuda = '',
  obligatorio = false,
  error = '',
  revisado = false,
}) {
  const todasElegidas = opciones.length > 0 && elegidos.length === opciones.length;

  const marca = revisado && error ? 'error' : revisado && elegidos.length > 0 ? 'ok' : null;
  const idMensaje = `${id}-mensaje`;

  function alternar(valor) {
    alCambiar(
      elegidos.includes(valor) ? elegidos.filter((otro) => otro !== valor) : [...elegidos, valor]
    );
  }

  function alternarTodas() {
    alCambiar(todasElegidas ? [] : opciones.map((opcion) => opcion.valor));
  }

  return (
    <div className={`sigma-campo${marca ? ` sigma-campo--${marca}` : ''}`}>
      <CFormLabel htmlFor={id} className={obligatorio ? 'sigma-obligatorio' : undefined}>
        {etiqueta}
      </CFormLabel>

      <CDropdown autoClose="outside" className="sigma-seleccion">
        <CDropdownToggle
          id={id}
          color="secondary"
          variant="outline"
          className="sigma-seleccion-boton"
          aria-invalid={marca === 'error'}
          aria-describedby={error || ayuda ? idMensaje : undefined}
        >
          {resumen(opciones, elegidos, placeholder, textoTodas)}
        </CDropdownToggle>

        <CDropdownMenu className="sigma-seleccion-menu">
          <CFormCheck
            id={`${id}-todas`}
            label={textoTodas}
            checked={todasElegidas}
            onChange={alternarTodas}
          />

          <hr className="sigma-seleccion-raya" />

          {opciones.map((opcion) => (
            <CFormCheck
              key={opcion.valor}
              id={`${id}-${opcion.valor}`}
              label={opcion.texto}
              checked={elegidos.includes(opcion.valor)}
              onChange={() => alternar(opcion.valor)}
            />
          ))}
        </CDropdownMenu>
      </CDropdown>

      {marca === 'error' ? (
        <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
          {error}
        </p>
      ) : (
        ayuda && (
          <p id={idMensaje} className="sigma-campo-mensaje">
            {ayuda}
          </p>
        )
      )}
    </div>
  );
}
