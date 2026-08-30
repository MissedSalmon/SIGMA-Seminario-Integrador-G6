'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody, CForm, CFormFeedback, CFormInput } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioEspecialidad({ especialidad = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(especialidad);

  const [nombre, setNombre] = useState(especialidad?.nombre ?? '');
  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');
    if (!nombre.trim()) return;

    setGuardando(true);
    try {
      await onGuardar({ nombre });
      mostrarToast({ tipo: 'exito', mensaje: editando ? `Se guardaron los cambios.` : `Se agrego la especialidad.` });
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

        <h2 className="sigma-seccion-titulo">Datos de la especialidad</h2>

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <div className="mb-3">
            <label className="sigma-obligatorio">Nombre</label>
            <CFormInput value={nombre} onChange={(e) => setNombre(e.target.value)} required maxLength={100} />
            <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
          </div>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar especialidad'}
            </CButton>
            <BotonEnlace href="/especialidades" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
