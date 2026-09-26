'use client';

/**
 * El campo de duración de SIGMA, armado con el TimeField de HeroUI.
 *
 * Se carga como un reloj, en dos casilleros: horas y minutos (hh:mm). Antes era
 * una caja de texto libre donde había que escribir "30 min" o "1 h 30 min" y el
 * sistema lo interpretaba; ahora no hay nada que interpretar, porque los
 * casilleros sólo aceptan números y cada uno sabe hasta dónde llega.
 *
 * Es el mismo componente de HeroUI que el campo de fecha por dentro (los dos
 * usan date-input-group), asi que se ven iguales y comparten los estilos.
 *
 * QUE SE MANTIENE DEL RESTO DE LOS CAMPOS
 *
 * - HACIA AFUERA HABLA EN TEXTO "01:30", igual que la fecha habla en
 *   "2026-09-14". Quien lo usa guarda y compara texto; pasar eso a las horas
 *   con decimales que van a la base es tarea de utils/duracion.js.
 *
 * - LA MARCA DE VALIDACION ES LA MISMA que en Campo.js: una barrita de color al
 *   costado izquierdo y un tilde o una cruz al final de la caja.
 *
 * ⬜ EL TOPE ES 23:59, porque son dos casilleros de reloj. Para una tarea de
 *    mantenimiento alcanza de sobra; antes se podian cargar hasta 1000 horas,
 *    pero no habia ninguna tan larga.
 *
 * El idioma se fija en es-AR para que las horas vayan de 00 a 23 y no aparezca
 * el "a. m. / p. m." que agregan otros idiomas.
 */
import { I18nProvider, Label, TimeField } from '@heroui/react';
import { Time } from '@internationalized/date';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

/** Lo que se lee en cada casillero mientras esta vacio. */
const PLACEHOLDER = { hour: 'hh', minute: 'mm' };

/** De "01:30" al objeto Time que pide HeroUI. Sin texto valido, null. */
function aHoraDelReloj(texto) {
  const reloj = String(texto ?? '').trim().match(/^(\d{1,2}):([0-5]\d)$/);
  if (!reloj) return null;

  const horas = Number(reloj[1]);
  if (horas > 23) return null;

  return new Time(horas, Number(reloj[2]));
}

/** Del objeto Time de HeroUI al texto "01:30". Sin hora, cadena vacia. */
function deHoraDelReloj(hora) {
  if (!hora) return '';

  return `${String(hora.hour).padStart(2, '0')}:${String(hora.minute).padStart(2, '0')}`;
}

export default function CampoDuracion({
  id,
  etiqueta,
  valor,
  alCambiar,
  obligatorio = false,
  deshabilitado = false,
  soloLectura = false,
  error = '',
  revisado = false,
}) {
  const hayValor = Boolean(valor);
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = ['sigma-duracion', marca && `sigma-duracion--${marca}`].filter(Boolean).join(' ');
  const idMensaje = `${id}-mensaje`;

  return (
    <I18nProvider locale="es-AR">
      <div className={clases}>
        <TimeField
          name={id}
          value={aHoraDelReloj(valor)}
          onChange={(hora) => alCambiar(deHoraDelReloj(hora))}
          // Sin esto aparecerian tambien los segundos.
          granularity="minute"
          // De 00 a 23, sin "a. m." ni "p. m.".
          hourCycle={24}
          isDisabled={deshabilitado}
          isReadOnly={soloLectura}
          isRequired={obligatorio}
          isInvalid={marca === 'error'}
          aria-describedby={error ? idMensaje : undefined}
        >
          <Label className={obligatorio ? 'sigma-obligatorio' : undefined}>{etiqueta}</Label>

          <TimeField.Group>
            <TimeField.Input>
              {(casillero) => (
                /*
                  Vacio, react-aria dibuja "--" en cada casillero. Se le cambia
                  por "hh" y "mm" para que se lea que va en cada uno, igual que
                  la fecha muestra dd/mm/aaaa. Los casilleros que no son horas
                  ni minutos (los dos puntos del medio) quedan como estan.
                */
                <TimeField.Segment segment={casillero}>
                  {casillero.isPlaceholder && PLACEHOLDER[casillero.type]
                    ? PLACEHOLDER[casillero.type]
                    : casillero.text}
                </TimeField.Segment>
              )}
            </TimeField.Input>

            {marca && (
              <TimeField.Suffix>
                <span className="sigma-duracion-marca" aria-hidden="true">
                  {/* El tamano lo pone globals.css, no el `size` de CoreUI. */}
                  <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
                </span>
              </TimeField.Suffix>
            )}
          </TimeField.Group>
        </TimeField>

        {marca === 'error' && (
          <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
            {error}
          </p>
        )}
      </div>
    </I18nProvider>
  );
}
