'use client';

/**
 * /activos/AC-014 - la ficha de un activo, con su historial de intervenciones (HU-29).
 *
 * Una intervencion es una OT del activo En ejecución o Finalizada (decision del
 * 25/10/2026, ver .claude/contexto/dominio.md). Cada una es un renglon con lo
 * esencial; "Ver más" abre el detalle tarea por tarea: falla, quien la hizo,
 * materiales y observaciones.
 */
import { Fragment, use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
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
import { cilArrowLeft, cilPencil } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import { obtenerActivo, obtenerHistorialActivo } from '@/servicios/activos.js';
import { formatearFechaHora, soloFechaLegible } from '@/utils/fechas.js';

/** Un renglón "etiqueta: valor" de la ficha. */
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

/** "18/09/2026" en la hora de quien mira, sin la hora. */
function fechaCorta(iso) {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** Los textos distintos de la lista, separados por coma. */
function sinRepetir(textos) {
  return [...new Set(textos.filter(Boolean))].join(', ');
}

/** Un renglón "Etiqueta: valor" del detalle. */
function Renglon({ etiqueta, children }) {
  return (
    <div className="mb-1" style={{ overflowWrap: 'anywhere' }}>
      <span className="text-body-secondary">{etiqueta}:</span> {children}
    </div>
  );
}

function Tarea({ tarea }) {
  const { responsable, falla, materiales, observaciones } = tarea;

  return (
    <div className="border-top pt-3 mt-3">
      <div className="fw-semibold mb-2">
        Tarea {tarea.idTarea}: {tarea.descripcion}
        <span className="text-body-secondary fw-normal"> — {tarea.estado}</span>
      </div>

      {/* gx-2: el margen de la fila coincide con el de la celda y la tabla no se ensancha. */}
      <CRow className="gx-2">
        <CCol md={6} lg={4}>
          {/* Si la tarea no terminó, todavía no la ejecutó nadie: es su responsable. */}
          <Dato etiqueta={tarea.estado === 'Finalizada' ? 'Ejecutó' : 'Responsable'}>
            {responsable ? (
              <>
                {responsable.nombre}
                <span className="text-body-secondary"> ({responsable.tipo.toLowerCase()})</span>
              </>
            ) : (
              <SinDato>Sin responsable</SinDato>
            )}
          </Dato>
        </CCol>
        <CCol md={6} lg={4}>
          <Dato etiqueta="Falla">
            {falla ? (
              <>
                <span className="fw-semibold">{falla.tipo}</span>: {falla.descripcion}
              </>
            ) : (
              <SinDato>Sin falla registrada</SinDato>
            )}
          </Dato>
        </CCol>
        <CCol md={12} lg={4}>
          <Dato etiqueta="Materiales consumidos">
            {materiales.length === 0 ? (
              <SinDato>Ninguno</SinDato>
            ) : (
              <ul className="list-unstyled mb-0">
                {materiales.map((material) => (
                  <li key={material.codigo}>
                    {material.nombre}
                    <span className="text-body-secondary"> × {material.cantidad}</span>
                  </li>
                ))}
              </ul>
            )}
          </Dato>
        </CCol>
      </CRow>

      <Dato etiqueta="Observaciones">
        {observaciones.length === 0 ? (
          <SinDato>Sin observaciones</SinDato>
        ) : (
          <ul className="list-unstyled mb-0">
            {observaciones.map((observacion) => (
              <li key={observacion.id} className="mb-1">
                <span className="text-body-secondary small">
                  {formatearFechaHora(observacion.fecha)} — {observacion.autor}:
                </span>{' '}
                <span style={{ whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{observacion.texto}</span>
              </li>
            ))}
          </ul>
        )}
      </Dato>
    </div>
  );
}

function Intervencion({ intervencion }) {
  const [abierta, setAbierta] = useState(false);
  const { tareas } = intervencion;

  const fallas = sinRepetir(tareas.map((tarea) => tarea.falla?.tipo));
  // Ejecutó quien terminó su tarea o la está haciendo; el que no empezó, todavía no.
  const responsables = sinRepetir(
    tareas
      .filter((tarea) => ['Finalizada', 'En ejecución'].includes(tarea.estado))
      .map((tarea) => tarea.responsable?.nombre)
  );

  return (
    <Fragment>
      <CTableRow>
        <CTableDataCell className="text-nowrap">
          <span className="fw-semibold">{fechaCorta(intervencion.fecha)}</span>
          {/* En el celular el tipo y el estado van debajo de la fecha, no en columnas. */}
          <div className="d-sm-none">
            {intervencion.tipo}
            <div>
              <EtiquetaEstadoOT estado={intervencion.estado} />
            </div>
          </div>
        </CTableDataCell>
        <CTableDataCell className="d-none d-sm-table-cell">{intervencion.tipo}</CTableDataCell>
        <CTableDataCell className="d-none d-md-table-cell">
          {fallas || <SinDato>Sin falla</SinDato>}
        </CTableDataCell>
        <CTableDataCell className="d-none d-xl-table-cell">
          {responsables || <SinDato>Sin responsable</SinDato>}
        </CTableDataCell>
        <CTableDataCell className="d-none d-sm-table-cell">
          <EtiquetaEstadoOT estado={intervencion.estado} />
        </CTableDataCell>
        <CTableDataCell className="text-end">
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            className="text-nowrap px-2"
            aria-expanded={abierta}
            onClick={() => setAbierta(!abierta)}
          >
            {abierta ? 'Ver menos' : 'Ver más'}
          </CButton>
        </CTableDataCell>
      </CTableRow>

      {abierta && (
        <CTableRow>
          <CTableDataCell colSpan={6} className="bg-body-tertiary">
            <div>
              {intervencion.tipo === 'Correctiva' ? (
                <Renglon etiqueta="Ticket">
                  <Link href={`/tickets/${intervencion.idTicket}`} className="fw-semibold">
                    #{intervencion.idTicket}
                  </Link>{' '}
                  — {intervencion.problemaReportado}
                </Renglon>
              ) : (
                <Renglon etiqueta="Plan preventivo">{intervencion.planPreventivo}</Renglon>
              )}
              <Renglon etiqueta="Orden de trabajo">
                <Link href={`/ordenes-trabajo/${intervencion.idOt}`} className="fw-semibold">
                  #{intervencion.idOt}
                </Link>
                {intervencion.fechaCierre && (
                  <span className="text-body-secondary">
                    {' '}
                    (del {fechaCorta(intervencion.fechaAlta)} al {fechaCorta(intervencion.fechaCierre)})
                  </span>
                )}
              </Renglon>
            </div>

            {tareas.map((tarea) => (
              <Tarea key={tarea.idTarea} tarea={tarea} />
            ))}
          </CTableDataCell>
        </CTableRow>
      )}
    </Fragment>
  );
}

export default function PantallaFichaActivo({ params }) {
  const { codigo } = use(params);

  // El codigo viaja en la direccion, asi que puede venir escapado ("AC%2D014").
  const codigoActivo = decodeURIComponent(codigo);

  const [activo, setActivo] = useState(null);
  const [historial, setHistorial] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerActivo(codigoActivo), obtenerHistorialActivo(codigoActivo)])
      .then(([ficha, intervenciones]) => {
        setActivo(ficha);
        setHistorial(intervenciones);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoActivo]);

  return (
    <>
      <EncabezadoPagina
        titulo={`Activo ${codigoActivo}`}
        accionesExtra={
          activo &&
          activo.estado !== 'Retirado' && (
            <BotonEnlace
              href={`/activos/${encodeURIComponent(activo.codigo)}/editar`}
              color="secondary"
              variante="outline"
            >
              <CIcon icon={cilPencil} className="me-2" />
              Editar
            </BotonEnlace>
          )
        }
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el activo..." />
      ) : (
        activo &&
        historial && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Resumen</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Tipo">{activo.nombreTipo}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Ubicación">
                      {activo.nombreEdificio} — {activo.nombreEspacio}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Estado">{activo.estado}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Fecha de alta">{soloFechaLegible(activo.fechaAlta)}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Intervenciones">
                      <span className="fw-semibold">{historial.resumen.cantidadIntervenciones}</span>
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Último mantenimiento">
                      {historial.resumen.fechaUltimoMantenimiento ? (
                        fechaCorta(historial.resumen.fechaUltimoMantenimiento)
                      ) : (
                        <SinDato>Ninguno finalizado</SinDato>
                      )}
                    </Dato>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Historial de intervenciones</CCardHeader>
              <CCardBody>
                {historial.intervenciones.length === 0 ? (
                  <SinDatos texto="Todavía no se le hizo ninguna intervención." />
                ) : (
                  <div className="table-responsive">
                    <CTable align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          {/* La de una finalizada es su cierre; la de una en ejecución, su alta. */}
                          <CTableHeaderCell>Fecha</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-sm-table-cell">Mantenimiento</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-md-table-cell">Falla</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-xl-table-cell">Ejecutó</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-sm-table-cell">Estado</CTableHeaderCell>
                          <CTableHeaderCell />
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {historial.intervenciones.map((intervencion) => (
                          <Intervencion key={intervencion.idOt} intervencion={intervencion} />
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </CCardBody>
            </CCard>
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/activos" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
