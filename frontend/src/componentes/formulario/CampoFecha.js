'use client';

/**
 * El campo de fecha de SIGMA, armado con el DatePicker de HeroUI.
 *
 * Reemplaza al <input type="date"> del navegador. El cambio se hizo porque ese
 * input lo dibuja cada navegador a su manera: el almanaque de Chrome no se
 * parece al de Firefox ni al del celular, y no se puede darle el estilo de la
 * plantilla. El de HeroUI se dibuja igual en todas partes.
 *
 * QUE SE MANTIENE DEL RESTO DE LOS CAMPOS
 *
 * - Hacia afuera sigue hablando en texto "2026-09-14", igual que antes. Los
 *   formularios no cambiaron: guardan y comparan texto. La traduccion al
 *   CalendarDate que pide HeroUI la hacen aFechaCalendario y
 *   deFechaCalendario (utils/fechas.js).
 *
 * - LOS LIMITES SE RESPETAN. `minimo` y `maximo` son la primera y la ultima
 *   fecha que se pueden elegir, en el mismo texto "2026-09-14". Los dias que
 *   quedan afuera se ven apagados en el almanaque y no se pueden tipear en los
 *   casilleros. Ojo: son una ayuda, no el control de verdad. El que corta sigue
 *   siendo la validacion del formulario, porque los formularios son noValidate.
 *
 * - LA MARCA DE VALIDACION ES LA MISMA que en Campo.js: una barrita de color al
 *   costado izquierdo y un tilde o una cruz al final de la caja, no el borde
 *   entero pintado. Ver el punto 2 del comentario de Campo.js.
 *
 * - LA CAJA MIDE LO SUYO. Una fecha ocupa siempre lo mismo (dd/mm/aaaa), asi
 *   que el ancho es fijo y lo pone globals.css, no un width:100%.
 *
 * El idioma se fija en es-AR a proposito: asi los casilleros salen en el orden
 * dd/mm/aaaa y los dias de la semana en castellano, sin depender de como tenga
 * configurado el navegador cada uno.
 *
 *   <CampoFecha
 *     id="fechaAlta"
 *     etiqueta="Fecha de alta"
 *     valor={fechaAlta}
 *     alCambiar={setFechaAlta}
 *     maximo={hoyTexto()}
 *     revisado={revisado}
 *     error={errores.fechaAlta}
 *   />
 */
import { Calendar, DateField, DatePicker, I18nProvider, Label } from '@heroui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

import { aFechaCalendario, deFechaCalendario } from '@/utils/fechas.js';

export default function CampoFecha({
  id,
  etiqueta,
  valor,
  alCambiar,
  minimo = '',
  maximo = '',
  obligatorio = false,
  deshabilitado = false,
  soloLectura = false,
  error = '',
  revisado = false,
  /** Sin etiqueta arriba ni renglon de mensaje: para la barra de filtros. */
  compacto = false,
}) {
  const hayValor = Boolean(valor);
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = [
    'sigma-fecha',
    compacto && 'sigma-fecha--compacto',
    marca && `sigma-fecha--${marca}`,
  ]
    .filter(Boolean)
    .join(' ');

  const idMensaje = `${id}-mensaje`;

  /*
   * `null` quiere decir "sin limite" para nosotros, pero HeroUI espera que la
   * propiedad no venga: si le llega null, la toma como una fecha invalida.
   */
  const desde = aFechaCalendario(minimo) ?? undefined;
  const hasta = aFechaCalendario(maximo) ?? undefined;

  return (
    <I18nProvider locale="es-AR">
      <div className={clases}>
        <DatePicker
          name={id}
          value={aFechaCalendario(valor)}
          onChange={(fecha) => alCambiar(deFechaCalendario(fecha))}
          minValue={desde}
          maxValue={hasta}
          isDisabled={deshabilitado}
          isReadOnly={soloLectura}
          isRequired={obligatorio}
          isInvalid={marca === 'error'}
          aria-describedby={error ? idMensaje : undefined}
        >
          {compacto ? (
            <Label className="sigma-fecha-etiqueta-al-lado">{etiqueta}</Label>
          ) : (
            <Label className={obligatorio ? 'sigma-obligatorio' : undefined}>{etiqueta}</Label>
          )}

          <DateField.Group fullWidth>
            <DateField.Input>{(casillero) => <DateField.Segment segment={casillero} />}</DateField.Input>

            <DateField.Suffix>
              {marca && (
                <span className="sigma-fecha-marca" aria-hidden="true">
                  {/* El tamano lo pone globals.css, no el `size` de CoreUI. */}
                  <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
                </span>
              )}

              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>

          <DatePicker.Popover>
            {/*
              Los limites van DOS VECES a proposito: aca y en el DatePicker de
              arriba. No es repetido por descuido.

              El DatePicker los necesita para los casilleros (que no se pueda
              tipear una fecha de mas), y el Calendar los necesita para apagar
              los dias en el almanaque. Uno no alcanza para el otro: el
              CalendarRoot de HeroUI se queda con su propio minValue/maxValue y
              si no se los pasamos usa los suyos, de 1900 a 2099, con lo cual
              el almanaque deja elegir cualquier dia aunque el DatePicker tenga
              el limite puesto (ver node_modules/@heroui/react/dist/components/
              calendar/calendar.js, donde los pone por defecto).

              Si algun dia se saca una de las dos, el limite deja de cumplirse
              de un lado.
            */}
            <Calendar aria-label={etiqueta} minValue={desde} maxValue={hasta}>
              <Calendar.Header>
                <Calendar.YearPickerTrigger>
                  <Calendar.YearPickerTriggerHeading />
                  <Calendar.YearPickerTriggerIndicator />
                </Calendar.YearPickerTrigger>
                <Calendar.NavButton slot="previous" />
                <Calendar.NavButton slot="next" />
              </Calendar.Header>

              <Calendar.Grid>
                <Calendar.GridHeader>
                  {(dia) => <Calendar.HeaderCell>{dia}</Calendar.HeaderCell>}
                </Calendar.GridHeader>
                <Calendar.GridBody>{(fecha) => <Calendar.Cell date={fecha} />}</Calendar.GridBody>
              </Calendar.Grid>

              {/*
                El selector de anio: sin esto, para una fecha de nacimiento hay
                que apretar la flechita de mes atras cientos de veces.
              */}
              <Calendar.YearPickerGrid>
                <Calendar.YearPickerGridBody>
                  {({ year }) => <Calendar.YearPickerCell year={year} />}
                </Calendar.YearPickerGridBody>
              </Calendar.YearPickerGrid>
            </Calendar>
          </DatePicker.Popover>
        </DatePicker>

        {!compacto && marca === 'error' && (
          <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
            {error}
          </p>
        )}
      </div>
    </I18nProvider>
  );
}
