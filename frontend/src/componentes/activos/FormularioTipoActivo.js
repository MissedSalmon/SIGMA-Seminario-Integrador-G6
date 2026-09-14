'use client';

/**
 * Formulario de alta y de edicion de un tipo de activo.
 *
 * Un tipo de activo es la categoria a la que pertenece un activo (aires
 * acondicionados, luminarias, mobiliario). Sirve para dos cosas: agrupar el
 * inventario, y mas adelante colgar de ahi los planes de mantenimiento
 * preventivo y las tareas estandar.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioTipoActivo({ tipo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tipo);

  const [nombre, setNombre] = useState(tipo?.nombre ?? '');

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
          : `Se agrego el tipo de activo "${nombre}".`,
      });

      router.push('/tipos-activos');
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
              placeholder="Aires acondicionados"
              obligatorio
              maxLength={100}
              anchoMinimo={20}
              revisado={revisado}
              error={errores.nombre}
              ayuda="Asi va a aparecer en el desplegable al cargar un activo."
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisa los campos marcados y volve a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/tipos-activos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
