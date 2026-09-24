'use client';

/**
 * El campo para una cantidad, armado con el NumberField de HeroUI.
 *
 * Trae los dos botones para subir y bajar de a uno, asi que se puede cargar sin
 * teclear: + a la izquierda, el numero en el medio, - a la derecha.
 *
 * ⬜ El orden de los botones es el que se pidio (+ numero -). Lo mas habitual es
 *    el revez (- numero +); si algun dia se quiere cambiar, alcanza con dar
 *    vuelta las dos lineas de abajo, porque el lugar lo decide el orden en que
 *    estan escritas y no el CSS.
 *
 * Es para CANTIDADES, no para numeros que son un nombre. Un legajo tambien se
 * escribe con digitos, pero a nadie le sirve subirlo de a uno: ese sigue siendo
 * un campo de texto comun.
 *
 * QUE SE MANTIENE DEL RESTO DE LOS CAMPOS
 *
 * - HACIA AFUERA HABLA EN TEXTO, como todos los demas: lo que llega a
 *   `alCambiar` es "10" o "" si esta vacio, asi que los formularios que hacian
 *   `Number(stockMinimo)` siguen andando sin cambios. Por dentro HeroUI trabaja
 *   con numeros y usa NaN para "vacio"; la traduccion se hace aca.
 *
 * - LA MARCA DE VALIDACION ES LA MISMA que en Campo.js: una barrita de color al
 *   costado izquierdo y un tilde o una cruz, no el borde entero pintado.
 *
 *   <CampoNumero
 *     id="stockMinimo"
 *     etiqueta="Stock minimo"
 *     valor={stockMinimo}
 *     alCambiar={setStockMinimo}
 *     minimo={0}
 *     obligatorio
 *     revisado={revisado}
 *     error={errores.stockMinimo}
 *   />
 */
import { Input, Label, NumberField } from '@heroui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

export default function CampoNumero({
  id,
  etiqueta,
  valor,
  alCambiar,
  minimo,
  maximo,
  /** De cuanto sube y baja con cada clic en los botones. */
  paso = 1,
  obligatorio = false,
  deshabilitado = false,
  error = '',
  revisado = false,
  /** Cuantos digitos entran en la caja del medio, sin contar los botones. */
  ancho = 5,
}) {
  const texto = String(valor ?? '').trim();
  const hayValor = texto !== '';
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = ['sigma-numero', marca && `sigma-numero--${marca}`].filter(Boolean).join(' ');
  const idMensaje = `${id}-mensaje`;

  return (
    <div className={clases}>
      <NumberField
        name={id}
        /* HeroUI usa NaN para "sin cargar"; nosotros usamos la cadena vacia. */
        value={hayValor ? Number(texto) : Number.NaN}
        onChange={(numero) => alCambiar(Number.isNaN(numero) ? '' : String(numero))}
        minValue={minimo}
        maxValue={maximo}
        step={paso}
        isDisabled={deshabilitado}
        isRequired={obligatorio}
        isInvalid={marca === 'error'}
        aria-describedby={error ? idMensaje : undefined}
        /* Sin esto le pone separador de miles a partir del 1000. */
        formatOptions={{ useGrouping: false }}
      >
        <Label className={obligatorio ? 'sigma-obligatorio' : undefined}>{etiqueta}</Label>

        <NumberField.Group style={{ '--sigma-numero-digitos': ancho }}>
          <NumberField.IncrementButton />
          <Input id={id} />
          <NumberField.DecrementButton />
        </NumberField.Group>
      </NumberField>

      {marca && (
        <span className="sigma-numero-marca" aria-hidden="true">
          {/* El tamano lo pone globals.css, no el `size` de CoreUI. */}
          <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
        </span>
      )}

      {marca === 'error' && (
        <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
          {error}
        </p>
      )}
    </div>
  );
}
