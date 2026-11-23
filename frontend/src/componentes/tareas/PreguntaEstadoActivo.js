'use client';

/**
 * La pregunta de la ventana «Finalizar» cuando es la última tarea de la OT
 * (22/11/2026): la OT se cierra y quien finaliza elige cómo queda el activo.
 * La usan el técnico (su tarea) y el administrador (la tarea de un prestador).
 */
import Campo from '@/componentes/formulario/Campo.js';

export const OPCIONES_ESTADO_ACTIVO = ['Operativo', 'Fuera de servicio'];

export default function PreguntaEstadoActivo({ idOt, codigoActivo, valor, alCambiar, revisado }) {
  return (
    <>
      <p>
        Es la última tarea: la OT <strong>#{idOt}</strong> se finaliza y el ticket se cierra.
      </p>
      <Campo
        id="estadoActivo"
        etiqueta={`¿Cómo queda el activo ${codigoActivo}?`}
        tipo="lista"
        valor={valor}
        alCambiar={alCambiar}
        opciones={OPCIONES_ESTADO_ACTIVO.map((estado) => ({ valor: estado, texto: estado }))}
        placeholder="Elegir"
        obligatorio
        ancho={20}
        revisado={revisado}
        error={revisado && !valor ? 'Elegí cómo queda el activo.' : ''}
      />
    </>
  );
}
