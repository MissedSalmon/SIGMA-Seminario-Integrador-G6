'use client';

/**
 * Un desplegable para elegir varias opciones a la vez.
 *
 * Se ve como una lista común, pero al abrirlo cada opción es una casilla para
 * tildar. Arriba de todo hay una casilla que marca y desmarca todas juntas, y
 * que queda tildada sólo cuando están todas.
 *
 * Es el control de SIGMA para elegir varias cosas (decisión del 03/11/2026):
 * especialidades del técnico, tipos del prestador, tareas y técnicos del plan.
 * Con muchas opciones, arriba aparece un buscador que filtra la lista mientras
 * se escribe; la casilla de "todas" marca entonces sólo las que se ven.
 *
 * El menú no se cierra al tildar (`autoClose="outside"`): se eligen varias de
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
 *
 * `accion` es un botón opcional que va al lado del desplegable, alineado con
 * la caja (por ejemplo, para crear una opción que no está en la lista).
 */
import { useMemo, useState } from 'react';
import { CDropdown, CDropdownMenu, CDropdownToggle, CFormCheck, CFormInput, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSearch } from '@coreui/icons';

// Con más opciones que esto, el menú trae buscador.
const OPCIONES_SIN_BUSCADOR = 8;

/**
 * Lo que muestra el botón cerrado: el nombre si hay una sola elegida y, desde
 * dos, la cantidad ("2 técnicos"), igual en todos los campos.
 */
function resumen(opciones, elegidos, placeholder, textoTodas, textoCantidad) {
  if (elegidos.length === 0) return placeholder;
  if (elegidos.length === opciones.length && opciones.length > 1) return textoTodas;
  if (elegidos.length === 1) return opciones.find((opcion) => opcion.valor === elegidos[0])?.texto ?? placeholder;
  return textoCantidad(elegidos.length);
}

/** Sin mayúsculas ni tildes, para que "electrica" encuentre "Eléctrica". */
function normalizar(texto) {
  return String(texto).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export default function SeleccionMultiple({
  id,
  etiqueta,
  opciones = [],
  elegidos = [],
  alCambiar,
  textoTodas = 'Todas',
  textoCantidad = (cantidad) => `${cantidad} seleccionadas`,
  placeholder = 'Seleccionar',
  obligatorio = false,
  error = '',
  revisado = false,
  ancho = 24,
  accion = null,
}) {
  const [busqueda, setBusqueda] = useState('');

  const conBuscador = opciones.length > OPCIONES_SIN_BUSCADOR;
  const visibles = useMemo(() => {
    const texto = normalizar(busqueda.trim());
    return texto ? opciones.filter((opcion) => normalizar(opcion.texto).includes(texto)) : opciones;
  }, [opciones, busqueda]);

  const todasVisiblesElegidas = visibles.length > 0 && visibles.every((opcion) => elegidos.includes(opcion.valor));

  const marca = revisado && error ? 'error' : revisado && elegidos.length > 0 ? 'ok' : null;
  const idMensaje = `${id}-mensaje`;

  function alternar(valor) {
    alCambiar(elegidos.includes(valor) ? elegidos.filter((otro) => otro !== valor) : [...elegidos, valor]);
  }

  function alternarTodas() {
    const valoresVisibles = visibles.map((opcion) => opcion.valor);
    alCambiar(
      todasVisiblesElegidas
        ? elegidos.filter((valor) => !valoresVisibles.includes(valor))
        : [...new Set([...elegidos, ...valoresVisibles])]
    );
  }

  return (
    <div className="sigma-campos">
      <div className={`sigma-campo${marca ? ` sigma-campo--${marca}` : ''}`}>
        <CFormLabel htmlFor={id} className={obligatorio ? 'sigma-obligatorio' : undefined}>
          {etiqueta}
        </CFormLabel>

        <CDropdown autoClose="outside" className="sigma-seleccion">
          <CDropdownToggle
            id={id}
            color="secondary"
            variant="outline"
            className="sigma-seleccion-boton d-flex align-items-center"
            style={{ width: `calc(${ancho}ch + 2.5rem)` }}
            aria-invalid={marca === 'error'}
            aria-describedby={error ? idMensaje : undefined}
          >
            {/* El texto se corta con "..." pero la flechita queda siempre a la vista. */}
            <span className="text-truncate flex-grow-1">
              {resumen(opciones, elegidos, placeholder, textoTodas, textoCantidad)}
            </span>
          </CDropdownToggle>

          <CDropdownMenu className="sigma-seleccion-menu">
            {conBuscador && (
              <div className="sigma-tabla-buscador mb-2">
                <CIcon icon={cilSearch} size="sm" />
                <CFormInput
                  size="sm"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Buscar"
                  aria-label={`Buscar en ${etiqueta}`}
                />
              </div>
            )}

            {visibles.length === 0 ? (
              <p className="text-body-secondary small mb-0">No hay ninguna con ese nombre.</p>
            ) : (
              <>
                <CFormCheck
                  id={`${id}-todas`}
                  label={busqueda.trim() ? 'Todas las que se ven' : textoTodas}
                  checked={todasVisiblesElegidas}
                  onChange={alternarTodas}
                />

                <hr className="sigma-seleccion-raya" />

                {visibles.map((opcion) => (
                  <CFormCheck
                    key={opcion.valor}
                    id={`${id}-${opcion.valor}`}
                    label={opcion.texto}
                    checked={elegidos.includes(opcion.valor)}
                    onChange={() => alternar(opcion.valor)}
                  />
                ))}
              </>
            )}
          </CDropdownMenu>
        </CDropdown>

        {marca === 'error' && (
          <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
            {error}
          </p>
        )}
      </div>

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
  );
}
