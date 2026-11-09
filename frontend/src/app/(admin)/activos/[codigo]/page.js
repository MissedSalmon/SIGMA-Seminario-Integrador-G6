'use client';

/**
 * /activos/AC-014 - la ficha de un activo, con su historial de intervenciones (HU-29).
 *
 * Una intervencion es una OT del activo En ejecución o Finalizada (decision del
 * 25/10/2026, ver .claude/contexto/dominio.md). Cada una es un renglon con su
 * origen (ticket o plan) y su OT, que llevan a su detalle (03/11/2026). El orden
 * por defecto es de la mas reciente a la mas antigua; un clic en el
 * encabezado "Fecha" lo da vuelta.
 */
import { use, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
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
import { cilArrowBottom, cilArrowLeft, cilArrowTop, cilPencil } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoActivo from '@/componentes/activos/EtiquetaEstadoActivo.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import { obtenerActivo, obtenerHistorialActivo } from '@/servicios/activos.js';
import { soloFechaLegible } from '@/utils/fechas.js';

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

function Intervencion({ intervencion }) {
  const { tareas } = intervencion;

  const fallas = sinRepetir(tareas.map((tarea) => tarea.falla?.tipo));
  // Ejecutó quien terminó su tarea o la está haciendo; el que no empezó, todavía no.
  const responsables = sinRepetir(
    tareas
      .filter((tarea) => ['Finalizada', 'En ejecución'].includes(tarea.estado))
      .map((tarea) => tarea.responsable?.nombre)
  );

  const origen = intervencion.idTicket ? (
    <Link href={`/tickets/${intervencion.idTicket}`}>Ticket #{intervencion.idTicket}</Link>
  ) : intervencion.idPlan ? (
    <Link href={`/planes-mantenimiento/${intervencion.idPlan}`} title={intervencion.planPreventivo ?? undefined}>
      Plan #{intervencion.idPlan}
    </Link>
  ) : (
    <SinDato>-</SinDato>
  );

  return (
    <CTableRow>
      <CTableDataCell className="text-nowrap">{origen}</CTableDataCell>
      <CTableDataCell className="text-nowrap">
        <Link href={`/ordenes-trabajo/${intervencion.idOt}`} className="fw-semibold">
          #{intervencion.idOt}
        </Link>
      </CTableDataCell>
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
      <CTableDataCell className="d-none d-sm-table-cell">
        <EtiquetaEstadoOT estado={intervencion.estado} />
      </CTableDataCell>
      <CTableDataCell className="d-none d-xl-table-cell">
        {responsables || <SinDato>Sin responsable</SinDato>}
      </CTableDataCell>
    </CTableRow>
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
  const [recientesPrimero, setRecientesPrimero] = useState(true);

  // La API ya las manda de la más reciente a la más antigua.
  const intervenciones = useMemo(() => {
    const lista = historial?.intervenciones ?? [];
    return recientesPrimero ? lista : [...lista].reverse();
  }, [historial, recientesPrimero]);

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
                    <Dato etiqueta="Estado">
                      <EtiquetaEstadoActivo estado={activo.estado} />
                    </Dato>
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
                          <CTableHeaderCell>Origen</CTableHeaderCell>
                          <CTableHeaderCell>OT</CTableHeaderCell>
                          <CTableHeaderCell aria-sort={recientesPrimero ? 'descending' : 'ascending'}>
                            <button
                              type="button"
                              className="sigma-orden-columna"
                              onClick={() => setRecientesPrimero(!recientesPrimero)}
                              title={recientesPrimero ? 'Más recientes primero' : 'Más antiguas primero'}
                            >
                              Fecha
                              <CIcon icon={recientesPrimero ? cilArrowBottom : cilArrowTop} size="sm" className="ms-1" />
                            </button>
                          </CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-sm-table-cell">Mantenimiento</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-md-table-cell">Falla</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-sm-table-cell">Estado</CTableHeaderCell>
                          <CTableHeaderCell className="d-none d-xl-table-cell">Ejecutó</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {intervenciones.map((intervencion) => (
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
