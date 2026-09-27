'use client';

/**
 * El campo para elegir una opcion, armado con el ComboBox de HeroUI.
 *
 * Reemplaza a los dos selectores que habia antes: el desplegable comun
 * (`<select>` de CoreUI) y el buscador (react-select). Ahora es uno solo, y en
 * todo el sistema se elige igual.
 *
 * QUE GANA CON EL CAMBIO
 *
 * - SE BUSCA ESCRIBIENDO. La lista se va filtrando con lo que se teclea, que es
 *   lo que hacia falta en las listas largas (espacios, activos). El filtrado lo
 *   hace react-aria solo: alcanza con NO pasarle `items`, y entonces filtra la
 *   lista que le dimos comparando lo escrito con el texto de cada opcion.
 *
 * - NO SE PUEDE ESCRIBIR CUALQUIER COSA. Solo se puede quedar una opcion de la
 *   lista: si se escribe algo que no esta, al salir del campo vuelve a lo que
 *   habia. Es el comportamiento de fabrica del ComboBox y es el que queremos,
 *   porque lo que se guarda es un id.
 *
 * QUE SE MANTIENE DEL RESTO DE LOS CAMPOS
 *
 * - HACIA AFUERA HABLA EN TEXTO, igual que el `<select>` de antes: lo que llega
 *   a `alCambiar` es siempre una cadena ("5", o "" si no hay nada elegido), asi
 *   que los formularios que hacian `Number(idTipo)` siguen andando sin cambios.
 *   Las claves de las opciones tambien se pasan a texto, porque react-aria
 *   compara la clave elegida con la de cada opcion y un 5 no es un "5".
 *
 * - LA MARCA DE VALIDACION ES LA MISMA que en Campo.js: una barrita de color al
 *   costado izquierdo y un tilde o una cruz al final de la caja, no el borde
 *   entero pintado. Ver el punto 2 del comentario de Campo.js.
 *
 * - LOS COLORES SON LOS DE SIGMA, no los de HeroUI. Se ponen en globals.css.
 *
 * COMO SE VACIA
 *
 * Un `<select>` tenia una opcion vacia para volver a "sin elegir". Aca eso se
 * pide con `textoVacio`: si viene, se agrega esa opcion arriba de la lista y
 * elegirla deja el campo en "". Es lo que usan los filtros de las tablas para
 * su "Todos". Un campo obligatorio no la lleva.
 *
 *   <CampoLista
 *     id="idEspacio"
 *     etiqueta="Espacio"
 *     valor={idEspacio}
 *     alCambiar={setIdEspacio}
 *     opciones={opcionesEspacios}
 *     placeholder="Elegir espacio"
 *     obligatorio
 *     ancho={22}
 *     revisado={revisado}
 *     error={errores.idEspacio}
 *   />
 */
import { ComboBox, Input, Label, ListBox } from '@heroui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

/**
 * La clave de la opcion que vacia el campo. Es un texto cualquiera que no puede
 * chocar con un id de verdad; no se puede usar "" porque react-aria toma la
 * cadena vacia como "ninguna clave".
 */
const CLAVE_VACIA = '__sin_elegir__';

/** Ancho de la caja, en caracteres, cuando el campo no pide otro. */
const ANCHO_POR_DEFECTO = 16;

/**
 * Lo que ocupa en la caja todo lo que no es texto, en rem: el relleno de los
 * costados, el lugar fijo de la marca de validacion y la flechita de abrir.
 * Es el mismo numero que usa Campo.js para sus desplegables.
 */
const LUGAR_EXTRA = 4.5;

/**
 * El tamano de un filtro en la barra de una tabla: arranca en 7rem, se estira
 * si sobra lugar y NUNCA pasa de 11rem. Son los mismos numeros que tenia el
 * desplegable de antes, asi que la barra entra en los mismos renglones.
 *
 * Va aca y no en globals.css a proposito. La caja de HeroUI lleva width:100%,
 * asi que sin un tope se estira hasta ocupar el renglon entero; el <select> que
 * habia antes no hacia eso porque tenia ancho propio. Dejandolo en el
 * componente, el tope viaja siempre con la caja y no depende de que una regla
 * de CSS llegue a aplicarse.
 */
const MEDIDA_COMPACTA = { flex: '1 1 7rem', minWidth: 0, maxWidth: '11rem' };

export default function CampoLista({
  id,
  etiqueta,
  valor,
  alCambiar,
  opciones = [],
  placeholder = '',
  /** El texto de la opcion que deja el campo vacio. Sin esto, no se puede vaciar. */
  textoVacio = '',
  obligatorio = false,
  deshabilitado = false,
  error = '',
  revisado = false,
  ancho = ANCHO_POR_DEFECTO,
  /** Mas baja y sin etiqueta arriba: para la barra de filtros de las tablas. */
  compacto = false,
  /**
   * La etiqueta no se dibuja, solo queda para los lectores de pantalla. Los
   * filtros de una tabla la usan asi: el nombre de la columna se lee como
   * placeholder de la caja, no arriba.
   */
  etiquetaOculta = false,
}) {
  const elegido = String(valor ?? '');
  const hayValor = elegido !== '';
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = [
    'sigma-lista',
    compacto && 'sigma-lista--compacto',
    marca && `sigma-lista--${marca}`,
  ]
    .filter(Boolean)
    .join(' ');

  const idMensaje = `${id}-mensaje`;

  function alElegir(clave) {
    // null es "se borro lo escrito"; CLAVE_VACIA es la opcion de vaciar.
    alCambiar(clave === null || clave === CLAVE_VACIA ? '' : String(clave));
  }

  return (
    /*
      En un formulario la caja mide los caracteres que pide el campo. En la barra
      de filtros se estira y se encoge, para que todos los filtros entren en la
      menor cantidad de renglones posible (ver MEDIDA_COMPACTA).
    */
    <div
      className={clases}
      style={compacto ? MEDIDA_COMPACTA : { width: `calc(${ancho}ch + ${LUGAR_EXTRA}rem)` }}
    >
      <ComboBox
        name={id}
        selectedKey={hayValor ? elegido : null}
        onSelectionChange={alElegir}
        isDisabled={deshabilitado}
        isRequired={obligatorio}
        isInvalid={marca === 'error'}
        aria-label={etiquetaOculta ? etiqueta : undefined}
        aria-describedby={error ? idMensaje : undefined}
      >
        {!etiquetaOculta && (
          <Label className={obligatorio ? 'sigma-obligatorio' : undefined}>{etiqueta}</Label>
        )}

        <ComboBox.InputGroup>
          <Input id={id} placeholder={placeholder || etiqueta} />

          {marca && (
            <span className="sigma-lista-marca" aria-hidden="true">
              {/* El tamano lo pone globals.css, no el `size` de CoreUI. */}
              <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
            </span>
          )}

          <ComboBox.Trigger />
        </ComboBox.InputGroup>

        {/*
          El popover lo dibuja el navegador al final del <body>, fuera de
          .sigma-lista, asi que para poder darle los colores de SIGMA lleva su
          propia clase.
        */}
        <ComboBox.Popover className="sigma-lista-popover">
          <ListBox>
            {textoVacio && (
              <ListBox.Item id={CLAVE_VACIA} textValue={textoVacio}>
                {textoVacio}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            )}

            {opciones.map((opcion) => (
              <ListBox.Item
                key={String(opcion.valor)}
                id={String(opcion.valor)}
                textValue={opcion.texto}
              >
                {opcion.texto}
                <ListBox.ItemIndicator />
              </ListBox.Item>
            ))}
          </ListBox>
        </ComboBox.Popover>
      </ComboBox>

      {!compacto && marca === 'error' && (
        <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
          {error}
        </p>
      )}
    </div>
  );
}
