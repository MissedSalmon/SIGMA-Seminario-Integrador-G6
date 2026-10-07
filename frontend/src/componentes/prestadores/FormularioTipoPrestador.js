'use client';

/**
 * Formulario de alta y de edicion de un tipo de prestador de servicio (HU-24).
 *
 * Un tipo de prestador es la clase de servicio que da una empresa o un
 * profesional de afuera (electricidad, plomeria, ascensores). Sirve para que
 * despues, al cargar un prestador, se elija de una lista en vez de escribirlo
 * a mano y que cada uno lo escriba distinto.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioTipoPrestador({ tipo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tipo);

  const [nombre, setNombre] = useState(tipo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? '');

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const errores = useMemo(() => {
    const encontrados = {};
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    return encontrados;
  }, [nombre]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim() });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó el tipo de prestador "${nombre}".`,
      });

      router.push('/prestadores/tipos');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <div className="sigma-campos mb-4">
            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Electricidad"
              obligatorio
              maxLength={100}
              ancho={18}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="descripcion"
              etiqueta="Descripción"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Opcional: qué trabajos hace este tipo de prestador."
              maxLength={300}
              revisado={revisado}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <BotonesAccion procesando={guardando} hrefCancelar="/prestadores/tipos" className="mt-4" />
        </form>
      </CCardBody>
    </CCard>
  );
}
