'use client';

/**
 * Formulario de alta y de edicion de un tipo de espacio (HU-2).
 *
 * Un tipo de espacio es nada mas que un nombre (aula, laboratorio, oficina).
 * Sirve para que despues, al cargar un espacio, se elija de una lista en vez
 * de escribirlo a mano y que cada uno lo escriba distinto.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormText,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';

export default function FormularioTipoEspacio({ tipo = null, onGuardar }) {
  const router = useRouter();
  const editando = Boolean(tipo);

  const [nombre, setNombre] = useState(tipo?.nombre ?? '');

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
      router.push('/espacios/tipos');
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

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Laboratorio"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
              <CFormText>Asi va a aparecer en el desplegable al cargar un espacio.</CFormText>
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar tipo'}
            </CButton>
            <BotonEnlace href="/espacios/tipos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
