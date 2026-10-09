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
import { useRef, useState } from 'react';
import { I18nProvider, Label, TimeField } from '@heroui/react';
import { Time } from '@internationalized/date';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

import { DURACION_INCOMPLETA } from '@/utils/duracion.js';

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

/**
 * La unidad que se lee al final de la caja: "00:22" no dice si son horas o
 * minutos. Menos de una hora, "minutos"; si no, "hora" u "horas".
 */
function unidadDeLaDuracion(texto) {
  const hora = aHoraDelReloj(texto);
  if (!hora) return '';
  if (hora.hour === 0) return 'minutos';

  return hora.hour === 1 && hora.minute === 0 ? 'hora' : 'horas';
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
  const contenedor = useRef(null);
  // Si ya se salio del campo alguna vez: recien ahi se avisa que quedo a medias.
  const [salio, setSalio] = useState(false);

  /*
   * A medias (horas sin minutos, o al reves) el TimeField no manda nada, y el
   * formulario lo tomaria como vacio. Por eso se miran los dos casilleros (cada
   * uno lleva data-placeholder mientras esta vacio): si uno tiene numero y el
   * otro no, se avisa que esta incompleto.
   *
   * Se revisa en cada tecla, y no solo al salir, porque un Enter adentro del
   * campo manda el formulario sin salir de el.
   */
  function revisarCasilleros() {
    const casilleros = contenedor.current?.querySelectorAll('[data-type="hour"], [data-type="minute"]') ?? [];
    const llenos = [...casilleros].filter((casillero) => !casillero.hasAttribute('data-placeholder')).length;

    if (llenos > 0 && llenos < casilleros.length) alCambiar(DURACION_INCOMPLETA);
  }

  // Moverse de las horas a los minutos no cuenta como salir.
  function alSalir(evento) {
    if (contenedor.current?.contains(evento.relatedTarget)) return;
    setSalio(true);
    revisarCasilleros();
  }

  /*
   * El aviso de "a medias" sale apenas se deja el campo, sin esperar a
   * Guardar: es fácil no darse cuenta de que faltó un casillero.
   */
  const aMedias = valor === DURACION_INCOMPLETA && salio;
  const mensaje = aMedias ? 'Completá las horas y los minutos (hh:mm).' : error;

  const hayValor = Boolean(valor);
  const marca = aMedias || (revisado && error) ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = ['sigma-duracion', marca && `sigma-duracion--${marca}`].filter(Boolean).join(' ');
  const idMensaje = `${id}-mensaje`;
  const unidad = unidadDeLaDuracion(valor);

  return (
    <I18nProvider locale="es-AR">
      <div className={clases} ref={contenedor} onBlur={alSalir} onKeyUp={revisarCasilleros}>
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
          aria-describedby={marca === 'error' ? idMensaje : undefined}
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

            {(unidad || marca) && (
              <TimeField.Suffix>
                {unidad && <span className="sigma-duracion-unidad">{unidad}</span>}
                {marca && (
                  <span className="sigma-duracion-marca" aria-hidden="true">
                    {/* El tamano lo pone globals.css, no el `size` de CoreUI. */}
                    <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
                  </span>
                )}
              </TimeField.Suffix>
            )}
          </TimeField.Group>
        </TimeField>

        {marca === 'error' && (
          <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
            {mensaje}
          </p>
        )}
      </div>
    </I18nProvider>
  );
}
