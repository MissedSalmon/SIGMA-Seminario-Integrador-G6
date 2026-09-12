'use client';

/**
 * Un campo de formulario de SIGMA: etiqueta + caja + marca de validacion.
 *
 * Resuelve dos cosas que CoreUI no hace solo:
 *
 * 1. LA CAJA SE ADAPTA AL TEXTO. En vez de que todos los campos midan lo mismo
 *    (o lo que mida la columna de la grilla), cada caja mide lo que mide su
 *    contenido, entre un minimo y un maximo. Asi un numero de aula no ocupa el
 *    mismo ancho que una descripcion. El ancho se calcula en "ch" (el ancho de
 *    un caracter de la tipografia), mas el lugar del padding y de la marca.
 *    El textarea no crece a lo ancho sino a lo alto, a medida que se escribe.
 *
 * 2. LA VALIDACION NO PINTA TODA LA CAJA. El `validated` de CoreUI (el
 *    was-validated de Bootstrap) pinta el borde entero de verde o de rojo y
 *    mete un icono adentro: con varios campos juntos queda un semaforo. Aca la
 *    marca es chica: una barrita de color al costado izquierdo, un tilde o una
 *    cruz al final de la caja, y el motivo escrito abajo cuando algo esta mal.
 *    Se ve igual de claro que esta bien y que esta mal, sin gritar.
 *
 * La marca aparece recien cuando el formulario se reviso (al apretar Guardar) y
 * de ahi en mas se actualiza sola mientras se escribe, asi se ve al momento que
 * el error quedo corregido.
 *
 *   <Campo
 *     id="descripcion"
 *     etiqueta="Que paso"
 *     tipo="area"
 *     valor={descripcion}
 *     alCambiar={setDescripcion}
 *     obligatorio
 *     revisado={revisado}
 *     error={errores.descripcion}
 *   />
 */
import { useEffect, useRef } from 'react';
import { CFormInput, CFormLabel, CFormSelect, CFormTextarea } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

/** Ancho de la caja, en caracteres, cuando no se pide otra cosa. */
const ANCHO_MINIMO = 12;
const ANCHO_MAXIMO = 44;

/**
 * El ancho que le corresponde a una caja segun lo que tiene escrito.
 *
 * A los caracteres del texto se les suma lo que ocupa todo lo que no es texto:
 * el padding de CoreUI (0.75rem de cada lado) y el lugar fijo de la marca
 * (1.25rem), que se reserva siempre para que la caja no pegue un salto cuando
 * la marca aparece. Una lista suma ademas la flechita del desplegable.
 */
function anchoDeLaCaja(texto, minimo, maximo, esLista) {
  const largo = String(texto ?? '').length;
  const caracteres = Math.min(maximo, Math.max(minimo, largo + 2));
  return `calc(${caracteres}ch + ${esLista ? '4.5rem' : '2.75rem'})`;
}

export default function Campo({
  id,
  etiqueta,
  tipo = 'texto',
  tipoHtml = 'text',
  valor,
  alCambiar,
  opciones = [],
  placeholder = '',
  ayuda = '',
  obligatorio = false,
  deshabilitado = false,
  error = '',
  revisado = false,
  anchoMinimo = ANCHO_MINIMO,
  anchoMaximo = ANCHO_MAXIMO,
  maxLength,
  filas = 3,
}) {
  const refArea = useRef(null);

  // El textarea crece a lo alto con lo que se escribe: se lo lleva a "auto"
  // para que scrollHeight mida el contenido real y despues se fija ese alto.
  useEffect(() => {
    const area = refArea.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  }, [valor]);

  const hayValor = String(valor ?? '').trim() !== '';
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  // En una lista, lo que se ve es el texto de la opcion elegida, no su valor.
  const opcionElegida = opciones.find((opcion) => String(opcion.valor) === String(valor));
  const textoVisible =
    tipo === 'lista' ? (opcionElegida ? opcionElegida.texto : placeholder) : valor || placeholder;

  const clases = ['sigma-campo', tipo === 'area' && 'sigma-campo--ancho', marca && `sigma-campo--${marca}`]
    .filter(Boolean)
    .join(' ');

  const anchoCaja =
    tipo === 'area'
      ? undefined
      : anchoDeLaCaja(textoVisible, anchoMinimo, anchoMaximo, tipo === 'lista');

  const idMensaje = `${id}-mensaje`;
  const propiedadesComunes = {
    id,
    value: valor,
    onChange: (evento) => alCambiar(evento.target.value),
    disabled: deshabilitado,
    'aria-invalid': marca === 'error',
    'aria-describedby': error || ayuda ? idMensaje : undefined,
  };

  return (
    <div className={clases}>
      <CFormLabel htmlFor={id} className={obligatorio ? 'sigma-obligatorio' : undefined}>
        {etiqueta}
      </CFormLabel>

      <div className="sigma-campo-caja" style={anchoCaja ? { width: anchoCaja } : undefined}>
        {tipo === 'lista' && (
          <CFormSelect {...propiedadesComunes}>
            <option value="">{placeholder || 'Seleccionar'}</option>
            {opciones.map((opcion) => (
              <option key={opcion.valor} value={opcion.valor}>
                {opcion.texto}
              </option>
            ))}
          </CFormSelect>
        )}

        {tipo === 'area' && (
          <CFormTextarea
            {...propiedadesComunes}
            ref={refArea}
            rows={filas}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )}

        {tipo === 'texto' && (
          <CFormInput
            {...propiedadesComunes}
            type={tipoHtml}
            placeholder={placeholder}
            maxLength={maxLength}
          />
        )}

        {marca && (
          <span className="sigma-campo-marca" aria-hidden="true">
            <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} size="sm" />
          </span>
        )}
      </div>

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
