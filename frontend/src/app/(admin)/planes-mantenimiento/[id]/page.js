'use client';

/**
 * /planes-mantenimiento/5 - detalle de un plan de mantenimiento preventivo (Sprint 5).
 */
import { use, useEffect, useState } from 'react';
import {
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilDescription, cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { obtenerPlan, darDeBajaPlan } from '@/servicios/planesMantenimiento.js';
import { formatearFechaHora } from '@/utils/fechas.js';

function soloFechaLegible(iso) {
  if (!iso) return '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '-';
}

function Dato({ etiqueta, children }) {
  return (
    <div className="mb-3">
      <div className="text-body-secondary small">{etiqueta}</div>
      <div className="fs-6">{children ?? '-'}</div>
    </div>
  );
}

export default function PantallaDetallePlanMantenimiento({ params }) {
  const { id } = use(params);
  const { mostrarToast } = useToast();

  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalBaja, setModalBaja] = useState(false);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);

  useEffect(() => {
    setCargando(true);
    obtenerPlan(id)
      .then(setPlan)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function confirmarBaja() {
    setDandoDeBaja(true);
    try {
      await darDeBajaPlan(plan.id);
      mostrarToast({
        tipo: 'exito',
        mensaje: `El plan "${plan.nombre}" fue dado de baja correctamente.`,
      });
      setModalBaja(false);
      // Recargar detalle
      const actualizado = await obtenerPlan(id);
      setPlan(actualizado);
    } catch (fallo) {
      setError(fallo.message);
      setModalBaja(false);
    } finally {
      setDandoDeBaja(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !plan) return <Aviso color="danger">{error}</Aviso>;
  if (!plan) return <Aviso color="warning">No se encontró el plan de mantenimiento.</Aviso>;

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-4">
        <EncabezadoPagina titulo={`Plan: ${plan.nombre}`} />
        <div className="d-flex gap-2">
          <BotonEnlace href="/planes-mantenimiento" variante="outline-secondary">
            <CIcon icon={cilArrowLeft} className="me-1" />
            Volver
          </BotonEnlace>
          {plan.activo && (
            <>
              <BotonEnlace href={`/planes-mantenimiento/${plan.id}/editar`} variante="primary">
                <CIcon icon={cilPencil} className="me-1" />
                Editar
              </BotonEnlace>
              <CButton color="danger" variant="outline" onClick={() => setModalBaja(true)}>
                <CIcon icon={cilTrash} className="me-1" />
                Dar de baja
              </CButton>
            </>
          )}
        </div>
      </div>

      {error && <Aviso color="danger" className="mb-4">{error}</Aviso>}

      <CRow className="g-4 mb-4">
        {/* Ficha principal */}
        <CCol lg={6}>
          <CCard className="h-100">
            <CCardHeader className="fw-semibold">Información del Plan</CCardHeader>
            <CCardBody>
              <Dato etiqueta="Nombre">{plan.nombre}</Dato>
              <Dato etiqueta="Tipo de activo">{plan.tipoActivo?.nombre ?? '-'}</Dato>
              <Dato etiqueta="Tipo de mantenimiento">{plan.tipoMantenimiento}</Dato>
              <Dato etiqueta="Frecuencia">{plan.frecuencia}</Dato>
              <Dato etiqueta="Próxima fecha de generación">
                <span className={plan.activo ? 'fw-bold text-primary' : 'text-body-tertiary'}>
                  {soloFechaLegible(plan.fechaProximaGeneracion)}
                </span>
              </Dato>
              <Dato etiqueta="Estado">
                {plan.activo ? (
                  <CBadge color="success">Activo</CBadge>
                ) : (
                  <div>
                    <CBadge color="secondary" className="me-2">Dado de baja</CBadge>
                    <span className="text-body-secondary small">
                      {formatearFechaHora(plan.fechaBaja)}
                    </span>
                  </div>
                )}
              </Dato>
              <Dato etiqueta="Descripción">{plan.descripcion || '-'}</Dato>
            </CCardBody>
          </CCard>
        </CCol>

        {/* Tareas y Técnicos */}
        <CCol lg={6}>
          <CCard className="mb-4">
            <CCardHeader className="fw-semibold">
              Tareas que incluye ({plan.tareas.length})
            </CCardHeader>
            <CCardBody>
              {plan.tareas.length === 0 ? (
                <div className="text-body-tertiary fst-italic">Sin tareas asignadas.</div>
              ) : (
                <ul className="list-group list-group-flush">
                  {plan.tareas.map((tarea) => (
                    <li key={tarea.id} className="list-group-item px-0">
                      <div className="fw-medium">{tarea.nombre}</div>
                      {tarea.descripcion && (
                        <div className="text-body-secondary small">{tarea.descripcion}</div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CCardBody>
          </CCard>

          <CCard>
            <CCardHeader className="fw-semibold">
              Técnicos asignados ({plan.tecnicos.length})
            </CCardHeader>
            <CCardBody>
              {plan.tecnicos.length === 0 ? (
                <div className="alert alert-warning py-2 mb-0 small">
                  <strong>Sin técnicos asignados:</strong> El plan no generará órdenes de
                  trabajo automáticas al cumplirse el período mientras no cuente con un técnico
                  autorizado responsable.
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {plan.tecnicos.map((t) => (
                    <li
                      key={t.legajo}
                      className="list-group-item px-0 d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <strong>{t.nombre}</strong> (Legajo {t.legajo})
                      </div>
                      {t.telefono && (
                        <span className="text-body-secondary small">{t.telefono}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </CCardBody>
          </CCard>
        </CCol>

        {/* Órdenes de trabajo generadas por este plan */}
        <CCol xs={12}>
          <CCard>
            <CCardHeader className="fw-semibold">
              Órdenes de Trabajo Generadas por este Plan ({plan.ordenes.length})
            </CCardHeader>
            <CCardBody>
              {plan.ordenes.length === 0 ? (
                <div className="text-body-secondary fst-italic">
                  Todavía no se generaron órdenes de trabajo a partir de este plan.
                </div>
              ) : (
                <CTable responsive hover className="align-middle mb-0">
                  <CTableHead>
                    <CTableRow>
                      <CTableHeaderCell>#</CTableHeaderCell>
                      <CTableHeaderCell>Activo</CTableHeaderCell>
                      <CTableHeaderCell>Estado</CTableHeaderCell>
                      <CTableHeaderCell>Fecha de alta</CTableHeaderCell>
                      <CTableHeaderCell className="text-end">Acción</CTableHeaderCell>
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {plan.ordenes.map((ot) => (
                      <CTableRow key={ot.id}>
                        <CTableDataCell className="fw-semibold">#{ot.id}</CTableDataCell>
                        <CTableDataCell>{ot.codigoActivo ?? '-'}</CTableDataCell>
                        <CTableDataCell>
                          <EtiquetaEstadoOT estado={ot.estado} />
                        </CTableDataCell>
                        <CTableDataCell className="text-body-secondary">
                          {formatearFechaHora(ot.fechaAlta)}
                        </CTableDataCell>
                        <CTableDataCell className="text-end">
                          <BotonEnlace
                            href={`/ordenes-trabajo/${ot.id}`}
                            variante="ghost"
                            className="btn-icono"
                            title="Ver orden de trabajo"
                          >
                            <CIcon icon={cilDescription} />
                          </BotonEnlace>
                        </CTableDataCell>
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              )}
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <DialogoEliminar
        visible={modalBaja}
        titulo="Dar de baja plan de mantenimiento"
        texto="Dar de baja"
        textoProcesando="Dando de baja..."
        eliminando={dandoDeBaja}
        onConfirmar={confirmarBaja}
        onCancelar={() => setModalBaja(false)}
      >
        <p>
          ¿Estás seguro de que querés dar de baja el plan <strong>{plan.nombre}</strong>?
        </p>
        <p className="text-body-secondary small mb-0">
          El plan dejará de generar nuevas órdenes de trabajo automáticas. Las órdenes de
          trabajo ya generadas previamente no se verán afectadas.
        </p>
      </DialogoEliminar>
    </>
  );
}
