'use client';

/**
 * /tareas/[idOt]/[idTarea] - Detalle de una tarea del técnico (HU-21).
 *
 * Lo que el técnico necesita para ir a hacerla: qué hay que hacer, sobre qué
 * activo, dónde está (edificio y espacio) y a qué OT pertenece.
 *
 * Es sólo lectura. La OT y el activo no llevan enlace: sus pantallas son del
 * administrador y el técnico no tiene acceso.
 */
import { use, useEffect, useState } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import { obtenerMiTarea } from '@/servicios/tareas.js';
import { soloFechaLegible } from '@/utils/fechas.js';

/** Una etiqueta chica arriba y el dato abajo. */
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

export default function PantallaDetalleMiTarea({ params }) {
  const { idOt, idTarea } = use(params);

  const [tarea, setTarea] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;

    obtenerMiTarea(idOt, idTarea)
      .then((datos) => vigente && setTarea(datos))
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [idOt, idTarea]);

  return (
    <>
      <EncabezadoPagina titulo={`Tarea ${idTarea} de la OT #${idOt}`} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando la tarea..." />
      ) : (
        tarea && (
          <CRow className="g-4 mb-4">
            <CCol lg={7}>
              <CCard className="h-100">
                <CCardHeader className="fw-semibold">Qué hay que hacer</CCardHeader>
                <CCardBody>
                  <Dato etiqueta="Descripción">
                    <span style={{ whiteSpace: 'pre-line' }}>{tarea.descripcion}</span>
                  </Dato>
                  <CRow>
                    <CCol sm={6}>
                      <Dato etiqueta="Prioridad">
                        <EtiquetaPrioridad prioridad={tarea.prioridad} />
                      </Dato>
                    </CCol>
                    <CCol sm={6}>
                      <Dato etiqueta="Estado">{tarea.estado}</Dato>
                    </CCol>
                    <CCol sm={6}>
                      <Dato etiqueta="Fecha prevista de inicio">
                        {tarea.fechaPrevista ? soloFechaLegible(tarea.fechaPrevista) : <SinDato>Sin fecha</SinDato>}
                      </Dato>
                    </CCol>
                    <CCol sm={6}>
                      <Dato etiqueta="Fecha prevista de fin">
                        {tarea.fechaFinPrevista ? (
                          soloFechaLegible(tarea.fechaFinPrevista)
                        ) : (
                          <SinDato>Sin fecha</SinDato>
                        )}
                      </Dato>
                    </CCol>
                  </CRow>
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
                        {tarea.activo.descripcion && (
                          <div className="text-body-secondary small">{tarea.activo.descripcion}</div>
                        )}
                      </Dato>
                      <CRow>
                        <CCol sm={6}>
                          <Dato etiqueta="Edificio">{tarea.ubicacion?.edificio || <SinDato>-</SinDato>}</Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Espacio">
                            {tarea.ubicacion?.espacio || <SinDato>-</SinDato>}
                            {tarea.ubicacion?.piso && (
                              <span className="text-body-secondary"> (piso {tarea.ubicacion.piso})</span>
                            )}
                          </Dato>
                        </CCol>
                      </CRow>
                    </>
                  ) : (
                    <SinDato>La orden de trabajo no tiene un activo asociado.</SinDato>
                  )}
                </CCardBody>
              </CCard>

              <CCard>
                <CCardHeader className="fw-semibold">Orden de trabajo</CCardHeader>
                <CCardBody>
                  {tarea.ot ? (
                    <>
                      <Dato etiqueta="Número">#{tarea.ot.id}</Dato>
                      <Dato etiqueta="Descripción">{tarea.ot.descripcion}</Dato>
                      <CRow>
                        <CCol sm={6}>
                          <Dato etiqueta="Estado">
                            <EtiquetaEstadoOT estado={tarea.ot.estado} />
                          </Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Origen">{tarea.ot.origen}</Dato>
                        </CCol>
                      </CRow>
                    </>
                  ) : (
                    <SinDato>-</SinDato>
                  )}
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/tareas" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
