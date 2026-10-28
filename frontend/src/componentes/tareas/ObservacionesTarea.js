'use client';

import { useRef, useState } from 'react';
import { CButton } from '@coreui/react';
import Campo from '@/componentes/formulario/Campo.js';
import Aviso from '@/componentes/Aviso.js';
import { agregarObservacion } from '@/servicios/tareas.js';
import { formatearFechaHora } from '@/utils/fechas.js';

/**
 * Las observaciones de la tarea y la caja para agregar una nueva. No lleva
 * tarjeta propia: va adentro de la tarjeta "Qué hay que hacer" del detalle,
 * separada por una línea.
 */
export default function ObservacionesTarea({ idOt, idTarea, observaciones, onGuardado }) {
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const enCurso = useRef(false);

  async function guardar(evento) {
    evento.preventDefault();
    if (enCurso.current) return;
    setError('');
    setConfirmacion('');
    if (!texto.trim()) {
      setError('La observación no puede estar vacía.');
      return;
    }
    enCurso.current = true;
    setGuardando(true);
    try {
      const observacion = await agregarObservacion(idOt, idTarea, texto);
      onGuardado(observacion);
      setTexto('');
      setConfirmacion('La observación se guardó.');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      enCurso.current = false;
      setGuardando(false);
    }
  }

  return (
    <section className="border-top pt-3 mt-2">
      <h3 className="fs-6 fw-semibold mb-3">Observaciones</h3>
      {observaciones.length === 0 ? (
        <p className="text-body-secondary">Todavía no se registraron observaciones.</p>
      ) : (
        <ol className="list-unstyled">
          {observaciones.map((observacion) => (
            <li key={observacion.id} className="border-bottom py-3">
              <div className="small text-body-secondary">
                {observacion.autor} · {formatearFechaHora(observacion.fecha)}
              </div>
              <div style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{observacion.texto}</div>
            </li>
          ))}
        </ol>
      )}
      <form onSubmit={guardar} aria-busy={guardando}>
        <Campo id="observacion" etiqueta="Nueva observación" tipo="area"
          valor={texto} alCambiar={setTexto} maxLength={500} obligatorio deshabilitado={guardando} />
        <div className="small text-body-secondary mb-3">Hasta 500 caracteres.</div>
        <Aviso mensaje={error} />
        <p role="status">{confirmacion}</p>
        <CButton type="submit" color="primary" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </CButton>
      </form>
    </section>
  );
}
