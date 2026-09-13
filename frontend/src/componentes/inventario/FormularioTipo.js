'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody, CCol, CForm, CFormFeedback, CFormInput, CFormLabel, CFormSelect, CFormTextarea, CRow } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioTipo({ tipo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [nombre, setNombre] = useState(tipo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? '');
  const [clase, setClase] = useState(tipo?.clase ?? 'Material');
  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    if (!nombre.trim()) return;
    setGuardando(true);
    try {
      await onGuardar({ nombre: nombre.trim(), descripcion, clase });
      mostrarToast({ tipo: 'exito', mensaje: tipo ? `Se guardaron los cambios de "${nombre}".` : `Se agrego el tipo "${nombre}".` });
      router.push('/inventario/tipos');
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
            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">Nombre</CFormLabel>
              <CFormInput id="nombre" value={nombre} onChange={(evento) => setNombre(evento.target.value)} required maxLength={150} />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>
            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="clase" className="sigma-obligatorio">Clase</CFormLabel>
              <CFormSelect id="clase" value={clase} onChange={(evento) => setClase(evento.target.value)} disabled={Boolean(tipo)} required>
                <option value="Material">Material</option>
                <option value="Herramienta">Herramienta</option>
              </CFormSelect>
            </CCol>
            <CCol xs={12}>
              <CFormLabel htmlFor="descripcion">Descripcion</CFormLabel>
              <CFormTextarea id="descripcion" rows={3} value={descripcion} onChange={(evento) => setDescripcion(evento.target.value)} />
            </CCol>
          </CRow>
          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" disabled={guardando}>{guardando ? 'Guardando...' : 'Guardar tipo'}</CButton>
            <BotonEnlace href="/inventario/tipos" color="secondary" variante="outline">Cancelar</BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
