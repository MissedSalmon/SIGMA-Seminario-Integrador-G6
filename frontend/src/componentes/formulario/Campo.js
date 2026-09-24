'use client';

/**
 * Un campo de formulario de SIGMA: etiqueta + caja + marca de validacion.
 *
 * Resuelve tres cosas que CoreUI no hace solo:
 *
 * 1. CADA CAJA MIDE LO SUYO, Y NO SE MUEVE. En vez de que todos los campos
 *    midan lo mismo (o lo que mida la columna de la grilla), cada uno declara su
 *    `ancho` en caracteres: un numero de aula no ocupa lo mismo que una
 *    descripcion. Ese ancho es fijo, no cambia con lo que se escribe, porque si
 *    la caja creciera se corren de lugar todos los campos que siguen.
 *
 * 2. LA VALIDACION NO PINTA TODA LA CAJA. El `validated` de CoreUI (el
 *    was-validated de Bootstrap) pinta el borde entero de verde o de rojo y
 *    mete un icono adentro: con varios campos juntos queda un semaforo. Aca la
 *    marca es chica: una barrita de color al costado izquierdo, un tilde o una
 *    cruz al final de la caja, y el motivo escrito abajo cuando algo esta mal.
 *    Se ve igual de claro que esta bien y que esta mal, sin gritar.
 *
 * 3. LA CAJA PUEDE ORDENAR LO QUE SE ESCRIBE. Con `formato` se le pasa una
 *    funcion que acomoda el texto en cada tecla: asi el DNI no acepta letras y
 *    el CUIL y el telefono muestran los guiones y el espacio solos, sin que
 *    haga falta escribirlos (ver utils/validaciones.js).
 *
 *    El cursor se queda donde estaba. Hace falta cuidarlo a mano: al reescribir
 *    el texto, el navegador manda el cursor al final, y entonces no se podia
 *    corregir un numero del medio. Lo que se guarda no es la posicion (los
 *    guiones y los espacios la corren) sino CUANTOS DIGITOS quedaban a la
 *    izquierda; despues de formatear se busca el lugar que deja esos mismos
 *    digitos atras.
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
import { useEffect, useLayoutEffect, useRef } from 'react';
import { CFormInput, CFormLabel, CFormTextarea } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilX } from '@coreui/icons';

import CampoDuracion from './CampoDuracion.js';
import CampoNumero from './CampoNumero.js';
import CampoFecha from './CampoFecha.js';
import CampoLista from './CampoLista.js';

/** Ancho de la caja, en caracteres, cuando el campo no pide otro. */
const ANCHO_POR_DEFECTO = 16;

const ES_DIGITO = /\d/;

function cuantosDigitos(texto) {
  let cuenta = 0;
  for (const caracter of texto) if (ES_DIGITO.test(caracter)) cuenta++;
  return cuenta;
}

/** El lugar del texto que deja `cantidad` digitos a la izquierda. */
function lugarTrasDigitos(texto, cantidad) {
  if (cantidad === 0) return 0;

  let vistos = 0;
  for (let i = 0; i < texto.length; i++) {
    if (!ES_DIGITO.test(texto[i])) continue;
    vistos++;
    if (vistos === cantidad) return i + 1;
  }

  return texto.length;
}

/** Saca el digito numero `cual` (1 es el primero). */
function quitarDigito(texto, cual) {
  let vistos = 0;
  for (let i = 0; i < texto.length; i++) {
    if (!ES_DIGITO.test(texto[i])) continue;
    vistos++;
    if (vistos === cual) return texto.slice(0, i) + texto.slice(i + 1);
  }

  return texto;
}

/**
 * Lo que ocupa en la caja todo lo que no es texto, en rem: el padding de CoreUI
 * (0.75rem de cada lado) y el lugar fijo de la marca, que se reserva siempre
 * para que la caja no pegue un salto cuando la marca aparece.
 *
 * Los desplegables y las fechas no estan aca: los dibujan CampoLista y
 * CampoFecha, y cada uno se encarga de su propio ancho.
 */
const LUGAR_EXTRA = 2.75;

/** El ancho de la caja: los caracteres que pide el campo mas el lugar extra. */
function anchoDeLaCaja(ancho) {
  return `calc(${ancho}ch + ${LUGAR_EXTRA}rem)`;
}

export default function Campo({
  id,
  etiqueta,
  tipo = 'texto',
  tipoHtml = 'text',
  valor,
  alCambiar,
  formato,
  opciones = [],
  placeholder = '',
  obligatorio = false,
  deshabilitado = false,
  soloLectura = false,
  error = '',
  revisado = false,
  ancho = ANCHO_POR_DEFECTO,
  sugerencias,
  maxLength,
  min,
  max,
  step,
  filas = 3,
}) {
  const refArea = useRef(null);
  const refCaja = useRef(null);
  const lugarDelCursor = useRef(null);

  // El textarea crece a lo alto con lo que se escribe: se lo lleva a "auto"
  // para que scrollHeight mida el contenido real y despues se fija ese alto.
  useEffect(() => {
    const area = refArea.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${area.scrollHeight}px`;
  }, [valor]);

  /*
   * Devuelve el cursor a donde estaba, despues de que React reescribio la caja.
   * Va en un layout effect para que pase antes de que se dibuje la pantalla: si
   * no, se ve el salto al final y vuelve.
   */
  useLayoutEffect(() => {
    if (lugarDelCursor.current === null) return;
    const caja = refCaja.current;
    const lugar = lugarDelCursor.current;
    lugarDelCursor.current = null;
    if (caja) caja.setSelectionRange(lugar, lugar);
  });

  function alEscribir(evento) {
    const caja = evento.target;
    const escrito = caja.value;

    if (!formato) {
      alCambiar(escrito);
      return;
    }

    const anterior = String(valor ?? '');
    const cursor = caja.selectionStart ?? escrito.length;

    let digitosALaIzquierda = cuantosDigitos(escrito.slice(0, cursor));
    let ordenado = formato(escrito);

    /*
     * Borrar un guion o un espacio no borra nada, porque el formato lo vuelve a
     * poner. Para que la tecla no quede muerta se borra el digito de antes, que
     * es lo que se quiso borrar.
     */
    if (ordenado === anterior && escrito.length < anterior.length && digitosALaIzquierda > 0) {
      ordenado = formato(quitarDigito(escrito, digitosALaIzquierda));
      digitosALaIzquierda--;
    }

    const lugar = lugarTrasDigitos(ordenado, digitosALaIzquierda);
    alCambiar(ordenado);

    /*
     * Si el texto quedo igual que antes (se escribio una letra, por ejemplo) no
     * hay nada que volver a dibujar, asi que el layout effect no corre. React
     * igual le devuelve a la caja el valor que conoce, y eso manda el cursor al
     * final: hay que reponerlo cuando eso ya paso.
     */
    if (ordenado === anterior) {
      queueMicrotask(() => caja.setSelectionRange(lugar, lugar));
      return;
    }

    lugarDelCursor.current = lugar;
  }

  /*
   * Elegir una opcion lo dibuja CampoLista (el ComboBox de HeroUI), tanto el
   * desplegable comun como el buscador: antes eran dos cosas distintas (el
   * <select> de CoreUI y react-select) y ahora es una sola.
   *
   * `textoVacio` es la opcion que deja el campo sin elegir. Es el reemplazo de
   * la <option value=""> que encabezaba el desplegable, y lleva el mismo texto
   * que llevaba esa, para que nada cambie de lugar.
   */
  if (tipo === 'lista' || tipo === 'buscador') {
    return (
      <CampoLista
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        alCambiar={alCambiar}
        opciones={opciones}
        placeholder={placeholder || (tipo === 'buscador' ? 'Buscar...' : 'Seleccionar')}
        textoVacio={placeholder || 'Seleccionar'}
        obligatorio={obligatorio}
        deshabilitado={deshabilitado}
        error={error}
        revisado={revisado}
        ancho={ancho}
      />
    );
  }

  /*
   * La duracion la dibuja CampoDuracion (el TimeField de HeroUI): dos
   * casilleros de reloj, hh:mm. Igual que la fecha, hacia afuera habla en texto
   * ("01:30"), asi que el formulario guarda y compara texto.
   */
  /*
   * Una cantidad la dibuja CampoNumero (el NumberField de HeroUI), que trae los
   * botones de + y -. Es a pedido con tipo="numero" y no automatico para todo
   * tipoHtml="number", porque hay numeros que no son cantidades: un legajo se
   * escribe con digitos pero no tiene sentido subirlo de a uno.
   */
  if (tipo === 'numero') {
    return (
      <CampoNumero
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        alCambiar={alCambiar}
        minimo={min === undefined || min === '' ? undefined : Number(min)}
        maximo={max === undefined || max === '' ? undefined : Number(max)}
        paso={step === undefined || step === '' ? 1 : Number(step)}
        obligatorio={obligatorio}
        deshabilitado={deshabilitado}
        error={error}
        revisado={revisado}
        ancho={ancho}
      />
    );
  }

  if (tipo === 'duracion') {
    return (
      <CampoDuracion
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        alCambiar={alCambiar}
        obligatorio={obligatorio}
        deshabilitado={deshabilitado}
        soloLectura={soloLectura}
        error={error}
        revisado={revisado}
      />
    );
  }

  /*
   * Las fechas las dibuja CampoFecha (el DatePicker de HeroUI) y no un
   * <input type="date">. Se delega desde aca, y no cambiando cada formulario,
   * para que todos sigan escribiendo <Campo tipoHtml="date"> como siempre.
   *
   * `min` y `max` pasan a ser los limites del almanaque: los dias que quedan
   * afuera se ven apagados y no se pueden elegir. Son los mismos que antes iban
   * al input, asi que ninguna pantalla pierde su restriccion.
   */
  if (tipo === 'texto' && tipoHtml === 'date') {
    return (
      <CampoFecha
        id={id}
        etiqueta={etiqueta}
        valor={valor}
        alCambiar={alCambiar}
        minimo={min}
        maximo={max}
        obligatorio={obligatorio}
        deshabilitado={deshabilitado}
        soloLectura={soloLectura}
        error={error}
        revisado={revisado}
      />
    );
  }

  const hayValor = String(valor ?? '').trim() !== '';
  const marca = revisado && error ? 'error' : revisado && hayValor ? 'ok' : null;

  const clases = [
    'sigma-campo',
    tipo === 'area' && 'sigma-campo--ancho',
    marca && `sigma-campo--${marca}`,
  ]
    .filter(Boolean)
    .join(' ');

  const anchoCaja = tipo === 'area' ? undefined : anchoDeLaCaja(ancho);

  const idMensaje = `${id}-mensaje`;
  const propiedadesComunes = {
    id,
    value: valor,
    onChange: alEscribir,
    disabled: deshabilitado,
    'aria-invalid': marca === 'error',
    'aria-describedby': error ? idMensaje : undefined,
  };

  return (
    <div className={clases}>
      <CFormLabel htmlFor={id} className={obligatorio ? 'sigma-obligatorio' : undefined}>
        {etiqueta}
      </CFormLabel>

      <div className="sigma-campo-caja" style={anchoCaja ? { width: anchoCaja } : undefined}>
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
          <>
            <CFormInput
              {...propiedadesComunes}
              ref={refCaja}
              type={tipoHtml}
              placeholder={placeholder}
              maxLength={maxLength}
              min={min}
              max={max}
              step={step}
              readOnly={soloLectura}
              list={sugerencias ? `${id}-sugerencias` : undefined}
            />

            {/*
              Las sugerencias son una ayuda, no una lista cerrada: el navegador
              las muestra al hacer foco en la caja, pero se puede escribir
              cualquier otra cosa. Se usa para la duracion de una tarea de la
              OT ("30 min", "1 h 30 min").
            */}
            {sugerencias && (
              <datalist id={`${id}-sugerencias`}>
                {sugerencias.map((sugerencia) => (
                  <option key={sugerencia} value={sugerencia} />
                ))}
              </datalist>
            )}
          </>
        )}

        {marca && (
          <span className="sigma-campo-marca" aria-hidden="true">
            {/* El tamano lo pone globals.css, no el `size` de CoreUI: ver .sigma-campo-marca. */}
            <CIcon icon={marca === 'ok' ? cilCheckAlt : cilX} />
          </span>
        )}
      </div>

      {marca === 'error' && (
        <p id={idMensaje} className="sigma-campo-mensaje sigma-campo-mensaje--error">
          {error}
        </p>
      )}
    </div>
  );
}
