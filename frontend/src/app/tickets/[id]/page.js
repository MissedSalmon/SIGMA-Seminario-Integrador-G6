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
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilExternalLink } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { obtenerTicket } from '@/servicios/tickets.js';
import { formatearFechaHora } from '@/utils/fechas.js';

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

  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTicket(id)
      .then(setTicket)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

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
          <CRow className="g-4">
            <CCol lg={7}>
              <CCard className="mb-4">
                <CCardHeader className="fw-semibold">Datos generales</CCardHeader>
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
                        La orden de trabajo se genera automáticamente cuando el administrador valida el ticket.
                      </p>
                    </>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
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
