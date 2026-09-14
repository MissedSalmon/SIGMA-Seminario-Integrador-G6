'use client';

/**
 * /tickets/5 - detalle completo de un ticket (HU-10).
 *
 * Muestra todo lo que se sabe del ticket: sus datos, el activo afectado y
 * donde esta, el area, quien lo registro, la foto si la hay y la orden de
 * trabajo si ya se genero. Cuando algo no existe (sin foto, sin OT) se dice
 * con todas las letras, para que no quede la duda de si no cargo.
 */
import { use, useEffect, useState } from 'react';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormTextarea, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilExternalLink, cilCheckAlt, cilX } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { obtenerTicket, validarTicket, rechazarTicket } from '@/servicios/tickets.js';
import { formatearFechaHora } from '@/utils/fechas.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

/** Un renglon "etiqueta: valor" de la ficha. */
function Dato({ etiqueta, children }) {
  return (
    <div className="mb-3">
      <div className="text-body-secondary small">{etiqueta}</div>
      <div>{children ?? '-'}</div>
    </div>
  );
}

/** Texto en gris e italica para decir que algo no esta. */
function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaDetalleTicket({ params }) {
  const { id } = use(params);
  const { mostrarToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const [procesando, setProcesando] = useState(false);
  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');

  const cargarTicket = () => {
    obtenerTicket(id)
      .then(setTicket)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleValidar() {
    setProcesando(true);
    setError('');
    try {
      await validarTicket(id);
      mostrarToast({ tipo: 'exito', mensaje: 'El ticket ha sido validado correctamente.' });
      cargarTicket();
    } catch (err) {
      setError(err.message);
      setProcesando(false);
    }
  }

  async function handleRechazar() {
    if (!motivoRechazo.trim()) {
      setErrorRechazo('Debes indicar un motivo de rechazo.');
      return;
    }
    setProcesando(true);
    setErrorRechazo('');
    try {
      await rechazarTicket(id, motivoRechazo);
      mostrarToast({ tipo: 'exito', mensaje: 'El ticket ha sido rechazado.' });
      setModalRechazoVisible(false);
      cargarTicket();
    } catch (err) {
      setErrorRechazo(err.message);
    } finally {
      setProcesando(false);
    }
  }

  function abrirModalRechazo() {
    setMotivoRechazo('');
    setErrorRechazo('');
    setModalRechazoVisible(true);
  }

  return (
    <>
      <EncabezadoPagina
        titulo={ticket ? `Ticket #${ticket.id}` : 'Detalle del ticket'}
        descripcion={ticket ? ticket.descripcion : undefined}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el ticket..." />
      ) : (
        ticket && (
          <>
            <CRow className="g-4">
              <CCol lg={7}>
                <CCard className="mb-4">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Datos generales</span>
                    {ticket.estado === 'Creado' && (
                      <div className="d-flex gap-2">
                        <CButton color="danger" variant="outline" size="sm" onClick={abrirModalRechazo} disabled={procesando}>
                          <CIcon icon={cilX} className="me-1" />
                          Rechazar
                        </CButton>
                        <CButton color="success" className="text-white" size="sm" onClick={handleValidar} disabled={procesando}>
                          <CIcon icon={cilCheckAlt} className="me-1" />
                          {procesando ? 'Procesando...' : 'Validar'}
                        </CButton>
                      </div>
                    )}
                  </CCardHeader>
                  <CCardBody>
                    <CRow>
                      <CCol sm={4}>
                        <Dato etiqueta="Identificador">#{ticket.id}</Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Estado">
                          <EtiquetaEstadoTicket estado={ticket.estado} />
                        </Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Fecha de alta">{formatearFechaHora(ticket.fechaAlta)}</Dato>
                      </CCol>
                    </CRow>
                    <Dato etiqueta="Descripción / motivo de la solicitud">
                      <span style={{ whiteSpace: 'pre-wrap' }}>{ticket.descripcion}</span>
                    </Dato>
                    {ticket.estado === 'Rechazado' && ticket.motivoRechazo && (
                      <div className="mt-3 p-3 bg-danger bg-opacity-10 border border-danger rounded">
                        <div className="text-danger fw-semibold small mb-1">Motivo del rechazo</div>
                        <div className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{ticket.motivoRechazo}</div>
                      </div>
                    )}
                  </CCardBody>
                </CCard>

                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Activo afectado</CCardHeader>
                  <CCardBody>
                    {ticket.activo ? (
                      <CRow>
                        <CCol sm={4}>
                          <Dato etiqueta="Código">
                            <span className="fw-semibold">{ticket.activo.codigo}</span>
                          </Dato>
                        </CCol>
                        <CCol sm={4}>
                          <Dato etiqueta="Tipo">{ticket.activo.nombreTipo || '-'}</Dato>
                        </CCol>
                        <CCol sm={4}>
                          <Dato etiqueta="Estado del activo">{ticket.activo.estado || '-'}</Dato>
                        </CCol>
                        <CCol sm={12}>
                          <Dato etiqueta="Ubicación">
                            {ticket.activo.nombreEdificio || ticket.activo.espacio_num
                              ? `${ticket.activo.nombreEdificio} — Espacio ${ticket.activo.espacio_num}`
                              : '-'}
                          </Dato>
                        </CCol>
                      </CRow>
                    ) : (
                      <Dato etiqueta="Código">{ticket.codigoActivo}</Dato>
                    )}
                  </CCardBody>
                </CCard>

                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Área y usuario</CCardHeader>
                  <CCardBody>
                    <CRow>
                      <CCol sm={6}>
                        <Dato etiqueta="Área">
                          {ticket.nombreArea || <SinDato>El espacio del activo no tiene un área asignada.</SinDato>}
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Registrado por">
                          {ticket.registradoPor?.nombre || '-'}
                          {ticket.registradoPor?.legajo && (
                            <span className="text-body-secondary"> (legajo {ticket.registradoPor.legajo})</span>
                          )}
                        </Dato>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={5}>
                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Evidencia</CCardHeader>
                  <CCardBody>
                    {ticket.evidencia ? (
                      <>
                        <a href={ticket.evidencia} target="_blank" rel="noreferrer" title="Abrir la foto en tamaño completo">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={ticket.evidencia}
                            alt={`Evidencia del ticket #${ticket.id}`}
                            className="rounded border"
                            style={{ maxWidth: '100%', maxHeight: '20rem', objectFit: 'contain' }}
                          />
                        </a>
                        <div className="mt-2">
                          <a href={ticket.evidencia} target="_blank" rel="noreferrer" className="small">
                            <CIcon icon={cilExternalLink} size="sm" className="me-1" />
                            Ver en tamaño completo
                          </a>
                        </div>
                      </>
                    ) : (
                      <SinDato>Este ticket no tiene evidencia adjunta.</SinDato>
                    )}
                  </CCardBody>
                </CCard>

                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Orden de trabajo</CCardHeader>
                  <CCardBody>
                    {ticket.ot ? (
                      <CRow>
                        <CCol sm={6}>
                          <Dato etiqueta="Número de OT">
                            <span className="fw-semibold">#{ticket.ot.id}</span>
                          </Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Estado">{ticket.ot.estado || '-'}</Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Fecha de alta">{formatearFechaHora(ticket.ot.fechaAlta)}</Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Fecha de cierre">
                            {ticket.ot.fechaCierre ? formatearFechaHora(ticket.ot.fechaCierre) : <SinDato>Todavía abierta</SinDato>}
                          </Dato>
                        </CCol>
                        {ticket.ot.descripcion && (
                          <CCol sm={12}>
                            <Dato etiqueta="Descripción">{ticket.ot.descripcion}</Dato>
                          </CCol>
                        )}
                      </CRow>
                    ) : (
                      <>
                        <p className="mb-1 fw-semibold">Este ticket todavía no tiene una OT generada.</p>
                        <p className="text-body-secondary small mb-0">
                          {ticket.estado === 'Rechazado' 
                            ? 'Este ticket fue rechazado, por lo que no se generará una orden de trabajo.'
                            : 'La orden de trabajo se genera automáticamente cuando el administrador valida el ticket.'}
                        </p>
                      </>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            <CModal visible={modalRechazoVisible} onClose={() => setModalRechazoVisible(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Rechazar Ticket</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <Aviso mensaje={errorRechazo} color="danger" />
                <div className="mb-3">
                  <CFormLabel htmlFor="motivoRechazo" className="sigma-obligatorio">Motivo del rechazo</CFormLabel>
                  <CFormTextarea
                    id="motivoRechazo"
                    rows={4}
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Escribe aquí el motivo por el cual se rechaza el ticket..."
                  />
                </div>
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={() => setModalRechazoVisible(false)} disabled={procesando}>
                  Cancelar
                </CButton>
                <CButton color="danger" onClick={handleRechazar} disabled={procesando}>
                  {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
                </CButton>
              </CModalFooter>
            </CModal>
          </>
        )
      )}

      <div className="mt-2">
        <BotonEnlace href="/tickets" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
