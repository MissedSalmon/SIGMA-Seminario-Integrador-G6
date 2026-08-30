'use client';

import { useEffect, useState } from 'react';
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CForm,
  CFormInput,
  CFormLabel,
  CFormTextarea
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilPlus } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import { listarTiposActivos, eliminarTipoActivo, crearTipoActivo, actualizarTipoActivo } from '@/servicios/tiposActivos.js';

export default function PantallaTiposActivos() {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [formError, setFormError] = useState('');
  const [formState, setFormState] = useState({ idTipoActivo: null, nombre: '', descripcion: '' });

  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;
    async function pedir() {
      try {
        const filas = await listarTiposActivos();
        if (!vigente) return;
        setTipos(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }
    pedir();
    return () => {
      vigente = false;
    };
  }, [recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');
    try {
      await eliminarTipoActivo(aEliminar.idTipoActivo);
      setExito(`Se elimino el tipo de activo "${aEliminar.nombre}".`);
      setAEliminar(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  function abrirModal(tipo = null) {
    if (tipo) {
      setFormState({ idTipoActivo: tipo.idTipoActivo, nombre: tipo.nombre, descripcion: tipo.descripcion || '' });
    } else {
      setFormState({ idTipoActivo: null, nombre: '', descripcion: '' });
    }
    setFormError('');
    setModalVisible(true);
  }

  async function guardarModal(e) {
    e.preventDefault();
    setGuardando(true);
    setFormError('');
    try {
      if (formState.idTipoActivo) {
        await actualizarTipoActivo(formState.idTipoActivo, { nombre: formState.nombre, descripcion: formState.descripcion });
        setExito(`Se actualizo el tipo de activo "${formState.nombre}".`);
      } else {
        await crearTipoActivo({ nombre: formState.nombre, descripcion: formState.descripcion });
        setExito(`Se creo el tipo de activo "${formState.nombre}".`);
      }
      setModalVisible(false);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setFormError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-4">
        <div>
          <h1 className="sigma-titulo">Tipos de Activos</h1>
        </div>
        <CButton color="primary" onClick={() => abrirModal()}>
          <CIcon icon={cilPlus} className="me-2" />
          Agregar tipo de activo
        </CButton>
      </div>

      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <Aviso mensaje={exito} color="success" onCerrar={() => setExito('')} />

      <CCard>
        <CCardBody>
          {cargando ? (
            <Cargando texto="Cargando tipos de activos..." />
          ) : tipos.length === 0 ? (
            <SinDatos texto="Todavia no hay tipos de activos cargados." />
          ) : (
            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Nombre</CTableHeaderCell>
                  <CTableHeaderCell>Descripcion</CTableHeaderCell>
                  <CTableHeaderCell>Cant. Activos</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {tipos.map((tipo) => (
                  <CTableRow key={tipo.idTipoActivo}>
                    <CTableDataCell className="fw-semibold">{tipo.nombre}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">{tipo.descripcion || '-'}</CTableDataCell>
                    <CTableDataCell>{tipo.cantidadActivos || 0}</CTableDataCell>
                    <CTableDataCell className="text-end">
                      <CButtonGroup size="sm">
                        <CButton
                          color="primary"
                          variant="outline"
                          title="Editar"
                          onClick={() => abrirModal(tipo)}
                        >
                          <CIcon icon={cilPencil} />
                        </CButton>
                        <CButton
                          color="danger"
                          variant="outline"
                          onClick={() => setAEliminar(tipo)}
                          title="Eliminar"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CButtonGroup>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          )}
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aEliminar)}
        eliminando={eliminando}
        onConfirmar={confirmarBaja}
        onCancelar={() => setAEliminar(null)}
      >
        <p className="mb-0">
          Se va a eliminar el tipo de activo <strong>{aEliminar?.nombre}</strong>.
        </p>
      </DialogoEliminar>

      <CModal visible={modalVisible} onClose={() => !guardando && setModalVisible(false)}>
        <CForm onSubmit={guardarModal}>
          <CModalHeader onClose={() => !guardando && setModalVisible(false)}>
            <CModalTitle>{formState.idTipoActivo ? 'Editar Tipo de Activo' : 'Nuevo Tipo de Activo'}</CModalTitle>
          </CModalHeader>
          <CModalBody>
            <Aviso mensaje={formError} onCerrar={() => setFormError('')} />
            <div className="mb-3">
              <CFormLabel htmlFor="nombre">Nombre</CFormLabel>
              <CFormInput
                type="text"
                id="nombre"
                value={formState.nombre}
                onChange={(e) => setFormState({ ...formState, nombre: e.target.value })}
                required
                disabled={guardando}
              />
            </div>
            <div className="mb-3">
              <CFormLabel htmlFor="descripcion">Descripción</CFormLabel>
              <CFormTextarea
                id="descripcion"
                rows="3"
                value={formState.descripcion}
                onChange={(e) => setFormState({ ...formState, descripcion: e.target.value })}
                disabled={guardando}
              ></CFormTextarea>
            </div>
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="ghost" onClick={() => setModalVisible(false)} disabled={guardando}>
              Cancelar
            </CButton>
            <CButton color="primary" type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Guardar'}
            </CButton>
          </CModalFooter>
        </CForm>
      </CModal>
    </>
  );
}
