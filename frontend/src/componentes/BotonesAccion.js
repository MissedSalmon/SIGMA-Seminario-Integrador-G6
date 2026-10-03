'use client';

/**
 * El par de botones que cierra un formulario o una ventana: la accion
 * principal y "Cancelar".
 *
 * Existe para que todas las pantallas se vean igual:
 *   - La accion principal va siempre primero (a la izquierda) y "Cancelar"
 *     siempre despues (a la derecha).
 *   - La accion principal dice "Guardar". Solo cambia cuando la accion no es
 *     guardar datos, sino algo puntual: "Eliminar", "Validar", "Rechazar".
 *
 * No armar estos botones a mano en una pantalla: usar este componente.
 *
 * En un formulario (el boton principal manda el formulario):
 *
 *   <BotonesAccion procesando={guardando} hrefCancelar="/edificios" className="mt-4" />
 *
 * En una ventana (el boton principal ejecuta una funcion):
 *
 *   <CModalFooter>
 *     <BotonesAccion
 *       texto="Eliminar"
 *       textoProcesando="Eliminando..."
 *       color="danger"
 *       procesando={eliminando}
 *       alAceptar={confirmar}
 *       alCancelar={cerrar}
 *     />
 *   </CModalFooter>
 */
import { CButton } from '@coreui/react';
import BotonEnlace from '@/componentes/BotonEnlace.js';

export default function BotonesAccion({
  texto = 'Guardar',
  textoProcesando = 'Guardando...',
  color = 'primary',
  procesando = false,
  deshabilitado = false,
  // Si no se pasa, el boton principal es de tipo "submit" y manda el formulario.
  alAceptar,
  // "Cancelar" vuelve a una direccion (hrefCancelar) o ejecuta una funcion (alCancelar).
  hrefCancelar,
  alCancelar,
  className,
}) {
  const clases = ['d-flex flex-wrap gap-2', className].filter(Boolean).join(' ');

  return (
    <div className={clases}>
      <CButton
        type={alAceptar ? 'button' : 'submit'}
        color={color}
        onClick={alAceptar}
        disabled={procesando || deshabilitado}
      >
        {procesando ? textoProcesando : texto}
      </CButton>

      {hrefCancelar ? (
        <BotonEnlace href={hrefCancelar} color="secondary" variante="outline">
          Cancelar
        </BotonEnlace>
      ) : (
        <CButton
          type="button"
          color="secondary"
          variant="outline"
          onClick={alCancelar}
          disabled={procesando}
        >
          Cancelar
        </CButton>
      )}
    </div>
  );
}
