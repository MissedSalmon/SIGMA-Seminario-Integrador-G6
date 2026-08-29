'use client';

/**
 * Formulario de alta y de edicion de un area funcional (HU-3).
 *
 * El area se ubica en un espacio, asi que el desplegable muestra los espacios
 * con su edificio adelante ("Edificio Central - Aula 1"), que es como los
 * distingue la gente de infraestructura.
 *
 * No pide el responsable del area a proposito: el usuario autorizado es el que
 * apunta a su area, no al reves (contexto.md, pregunta abierta 4). Se asigna
 * al dar de alta al usuario, en el Sprint 6.
 */
import { useEffect, useState } from 'react';
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
  CFormSelect,
  CFormText,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { listarEspacios } from '@/servicios/espacios.js';

export default function FormularioArea({ area = null, onGuardar }) {
  const router = useRouter();
  const editando = Boolean(area);

  const [nombre, setNombre] = useState(area?.nombre ?? '');
  const [idEspacio, setIdEspacio] = useState(area?.idEspacio ?? '');

  const [espacios, setEspacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEspacios()
      .then(setEspacios)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    if (!nombre.trim() || !idEspacio) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre, idEspacio: Number(idEspacio) });
      router.push('/areas');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <CCard>
        <CCardBody>
          <Cargando texto="Cargando el formulario..." />
        </CCardBody>
      </CCard>
    );
  }

  if (espacios.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un espacio: toda area funciona en uno."
      />
    );
  }

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

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
                placeholder="Departamento de Sistemas"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>

            <CCol md={7}>
              <CFormLabel htmlFor="idEspacio" className="sigma-obligatorio">
                Espacio donde funciona
              </CFormLabel>
              <CFormSelect
                id="idEspacio"
                value={idEspacio}
                onChange={(evento) => setIdEspacio(evento.target.value)}
                required
              >
                <option value="">Elegi un espacio...</option>
                {espacios.map((espacio) => (
                  <option key={espacio.idEspacio} value={espacio.idEspacio}>
                    {espacio.nombreEdificio} - {espacio.nombre}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir el espacio.</CFormFeedback>
              <CFormText>
                El responsable del area se asigna despues, al dar de alta al usuario autorizado.
              </CFormText>
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar area'}
            </CButton>
            <BotonEnlace href="/areas" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
