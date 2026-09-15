'use client';

/**
 * Formulario de alta y de edicion de una especialidad (HU-4).
 *
 * Una especialidad es el oficio de un tecnico (electricidad, plomeria,
 * refrigeracion). Es nada mas que un nombre: se elige de una lista al dar de
 * alta al tecnico.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioEspecialidad({ especialidad = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(especialidad);

  const [nombre, setNombre] = useState(especialidad?.nombre ?? '');

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
      await onGuardar({ nombre: nombre.trim() });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó la especialidad "${nombre}".`,
      });
      router.push('/especialidades');
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
          <h2 className="sigma-seccion-titulo">Datos de la especialidad</h2>

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
              ayuda="Así va a aparecer al elegir las especialidades de un técnico."
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/especialidades" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
