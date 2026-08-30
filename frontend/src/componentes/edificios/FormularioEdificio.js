'use client';

/**
 * Formulario de alta y de edicion de un edificio (HU-1).
 *
 * Es el mismo formulario para las dos cosas: si recibe `edificio`, arranca con
 * los datos cargados y edita; si no, arranca vacio y da de alta. Asi los
 * campos y las validaciones se escriben una sola vez.
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
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioEdificio({ edificio = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(edificio);

  const [nombre, setNombre] = useState(edificio?.nombre ?? '');
  const [direccion, setDireccion] = useState(edificio?.direccion ?? '');

  // `validado` prende los mensajes de campo obligatorio de CoreUI.
  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    // Validacion en la pantalla, para no ir al servidor al pedazo.
    // El backend igual vuelve a validar: es el que manda.
    if (!nombre.trim()) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre, direccion });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando ? `Se guardaron los cambios de "${nombre}".` : `Se agrego el edificio "${nombre}".`,
      });
      router.push('/edificios');
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

        <h2 className="sigma-seccion-titulo">Datos del edificio</h2>

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol md={5}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Edificio Central"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>

            <CCol md={7}>
              <CFormLabel htmlFor="direccion">Direccion</CFormLabel>
              <CFormInput
                id="direccion"
                value={direccion}
                onChange={(evento) => setDireccion(evento.target.value)}
                placeholder="French 414, Resistencia"
                maxLength={200}
              />
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar edificio'}
            </CButton>
            <BotonEnlace href="/edificios" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
