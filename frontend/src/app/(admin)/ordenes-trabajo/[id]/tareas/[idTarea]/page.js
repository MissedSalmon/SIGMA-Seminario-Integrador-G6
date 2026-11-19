'use client';

/**
 * Detalle de una tarea de la OT para el administrador (19/11/2026).
 *
 * Es sólo de consulta: lo planificado y lo que hizo el técnico (falla,
 * materiales, herramientas y observaciones). La tarea se cambia desde
 * "Editar" en el detalle de la OT, y lo ejecutado lo carga el técnico.
 */
import { use, useEffect, useState } from 'react';
import {
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
import { cilArrowLeft } from '@coreui/icons';
import Link from 'next/link';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import ObservacionesTarea from '@/componentes/tareas/ObservacionesTarea.js';
import { obtenerTareaDeOrden } from '@/servicios/ordenesTrabajo.js';
import { formatearFecha, formatearFechaHora, soloFechaLegible } from '@/utils/fechas.js';
import { comoHoraMinuto } from '@/utils/duracion.js';

function Dato({ etiqueta, children }) {
  return (
    <div className="mb-3">
      <div className="text-body-secondary small">{etiqueta}</div>
      <div>{children ?? '-'}</div>
    </div>
  );
}

/** Texto en gris e itálica para decir que algo no está. */
function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaDetalleTareaOT({ params }) {
  const { id, idTarea } = use(params);

  const [tarea, setTarea] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;

    obtenerTareaDeOrden(id, idTarea)
      .then((datos) => vigente && setTarea(datos))
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [id, idTarea]);

  const sinEmpezar = tarea && ['Creada', 'Asignada', 'Pendiente'].includes(tarea.estado);

  return (
    <>
      <EncabezadoPagina titulo={`Tarea ${idTarea} de la OT #${id}`} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando la tarea..." />
      ) : (
        tarea && (
          <>
            <CRow className="g-4 mb-4">
              <CCol lg={7}>
                <CCard className="h-100">
                  <CCardHeader className="fw-semibold">Qué hay que hacer</CCardHeader>
                  <CCardBody>
                    <Dato etiqueta="Descripción">
                      <span style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>{tarea.descripcion}</span>
                    </Dato>
                    <CRow>
                      <CCol sm={6}>
                        <Dato etiqueta="Tarea estándar">
                          {tarea.nombrePlantilla || <SinDato>-</SinDato>}
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Responsable">
                          {tarea.responsable ? (
                            <>
                              {tarea.responsable.nombre}
                              <span className="text-body-secondary"> ({tarea.responsable.tipo})</span>
                            </>
                          ) : (
                            <SinDato>Sin asignar</SinDato>
                          )}
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Prioridad">
                          <EtiquetaPrioridad prioridad={tarea.prioridad} />
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Estado">{tarea.estado}</Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Fecha prevista">
                          {tarea.fechaInicio ? (
                            <>
                              {soloFechaLegible(tarea.fechaInicio)}
                              {tarea.fechaFin && ` → ${soloFechaLegible(tarea.fechaFin)}`}
                            </>
                          ) : (
                            <SinDato>Sin fecha</SinDato>
                          )}
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Duración estimada">
                          {comoHoraMinuto(tarea.horasEstimadas) || <SinDato>-</SinDato>}
                        </Dato>
                      </CCol>
                    </CRow>

                    <ObservacionesTarea
                      idOt={id}
                      idTarea={idTarea}
                      observaciones={tarea.observaciones ?? []}
                    />
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={5}>
                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Activo y ubicación</CCardHeader>
                  <CCardBody>
                    {tarea.activo ? (
                      <>
                        <Dato etiqueta="Activo">
                          <span className="fw-semibold">{tarea.activo.codigo}</span>
                          {tarea.activo.nombreTipo && (
                            <span className="text-body-secondary"> — {tarea.activo.nombreTipo}</span>
                          )}
                        </Dato>
                        <CRow>
                          <CCol sm={6}>
                            <Dato etiqueta="Edificio">
                              {tarea.activo.nombreEdificio || <SinDato>-</SinDato>}
                            </Dato>
                          </CCol>
                          <CCol sm={6}>
                            <Dato etiqueta="Espacio">{tarea.activo.espacio_num || <SinDato>-</SinDato>}</Dato>
                          </CCol>
                        </CRow>
                        <Dato etiqueta="Área">{tarea.nombreArea || <SinDato>Sin área</SinDato>}</Dato>
                      </>
                    ) : (
                      <SinDato>La orden de trabajo no tiene un activo asociado.</SinDato>
                    )}
                  </CCardBody>
                </CCard>

                <CCard>
                  <CCardHeader className="fw-semibold">Orden de trabajo</CCardHeader>
                  <CCardBody>
                    <Dato etiqueta="Número">
                      <Link href={`/ordenes-trabajo/${tarea.ot.id}`}>#{tarea.ot.id}</Link>
                    </Dato>
                    <Dato etiqueta="Descripción">
                      <span style={{ whiteSpace: 'pre-line', overflowWrap: 'anywhere' }}>
                        {tarea.ot.descripcion}
                      </span>
                    </Dato>
                    <CRow>
                      <CCol sm={6}>
                        <Dato etiqueta="Estado">
                          <EtiquetaEstadoOT estado={tarea.ot.estado} />
                        </Dato>
                      </CCol>
                      <CCol sm={6}>
                        <Dato etiqueta="Origen">
                          {tarea.ot.idTicket ? (
                            <Link href={`/tickets/${tarea.ot.idTicket}`}>Ticket #{tarea.ot.idTicket}</Link>
                          ) : (
                            tarea.ot.nombrePlan || tarea.ot.origen
                          )}
                        </Dato>
                      </CCol>
                    </CRow>
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            <CRow className="g-4 mb-4">
              <CCol lg={7}>
                <CCard className="h-100">
                  <CCardHeader className="fw-semibold">Materiales utilizados</CCardHeader>
                  <CCardBody>
                    {tarea.materiales.length === 0 ? (
                      <SinDato>
                        {sinEmpezar ? 'La tarea todavía no empezó.' : 'En esta tarea no se registraron materiales.'}
                      </SinDato>
                    ) : (
                      <div className="table-responsive">
                        <CTable small align="middle" className="mb-0">
                          <CTableHead>
                            <CTableRow>
                              <CTableHeaderCell>Material</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Cantidad</CTableHeaderCell>
                              <CTableHeaderCell>Registrado</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {tarea.materiales.map((material) => (
                              <CTableRow key={`${material.codigo}-${material.fecha}`}>
                                <CTableDataCell>
                                  <span className="fw-semibold">{material.codigo}</span>
                                  <span className="text-body-secondary"> — {material.nombre}</span>
                                </CTableDataCell>
                                <CTableDataCell className="text-end">{material.cantidad}</CTableDataCell>
                                <CTableDataCell className="text-body-secondary text-nowrap">
                                  {formatearFechaHora(material.fecha)}
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={5}>
                <CCard className="h-100">
                  <CCardHeader className="fw-semibold">Herramientas utilizadas</CCardHeader>
                  <CCardBody>
                    {tarea.herramientas.length === 0 ? (
                      <SinDato>
                        {sinEmpezar
                          ? 'La tarea todavía no empezó.'
                          : 'En esta tarea no se tomaron herramientas.'}
                      </SinDato>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {tarea.herramientas.map((herramienta) => (
                          <li
                            key={`${herramienta.codigo}-${herramienta.desde}`}
                            className="py-2 border-bottom"
                          >
                            <span className="fw-semibold">{herramienta.codigo}</span>
                            <span className="text-body-secondary"> — {herramienta.nombre}</span>
                            <div className="text-body-secondary small">
                              {herramienta.tecnico && `${herramienta.tecnico} · `}
                              {herramienta.hasta
                                ? `Del ${formatearFecha(herramienta.desde)} al ${formatearFecha(herramienta.hasta)}`
                                : `Desde el ${formatearFecha(herramienta.desde)}, todavía en uso`}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            <CRow className="g-4 mb-4">
              <CCol lg={7}>
                <CCard>
                  <CCardHeader className="fw-semibold">Falla encontrada</CCardHeader>
                  <CCardBody>
                    {tarea.falla ? (
                      <>
                        <Dato etiqueta="Tipo de falla">{tarea.falla.tipo}</Dato>
                        <Dato etiqueta="Descripción">
                          <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                            {tarea.falla.descripcion}
                          </span>
                        </Dato>
                        {tarea.falla.fecha && (
                          <Dato etiqueta="Registrada">{formatearFechaHora(tarea.falla.fecha)}</Dato>
                        )}
                      </>
                    ) : (
                      <SinDato>
                        {sinEmpezar ? 'La tarea todavía no empezó.' : 'En esta tarea no se registró ninguna falla.'}
                      </SinDato>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href={`/ordenes-trabajo/${id}`} color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver a la orden de trabajo
        </BotonEnlace>
      </div>
    </>
  );
}
