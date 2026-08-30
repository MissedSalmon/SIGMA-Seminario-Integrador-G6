'use client';

/**
 * Formulario de alta y de edicion de un tipo de activo.
 *
 * Un tipo de activo es la categoria a la que pertenece un activo (aires
 * acondicionados, luminarias, mobiliario). Sirve para dos cosas: agrupar el
 * inventario, y mas adelante colgar de ahi los planes de mantenimiento
 * preventivo y las tareas estandar.
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
  CFormTextarea,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioTipoActivo({ tipo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tipo);

  const [nombre, setNombre] = useState(tipo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? '');

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
      await onGuardar({ nombre, descripcion });

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

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol xs={12} md={5}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Aires acondicionados"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
              <CFormText>Asi va a aparecer en el desplegable al cargar un activo.</CFormText>
            </CCol>

            <CCol xs={12} md={7}>
              <CFormLabel htmlFor="descripcion">Descripcion</CFormLabel>
              <CFormTextarea
                id="descripcion"
                rows={3}
                value={descripcion}
                onChange={(evento) => setDescripcion(evento.target.value)}
                placeholder="Equipos de refrigeracion split y de ventana"
              />
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar tipo'}
            </CButton>
            <BotonEnlace href="/tipos-activos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
