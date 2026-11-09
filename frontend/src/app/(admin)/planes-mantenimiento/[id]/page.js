'use client';

/**
 * /planes-mantenimiento/5 - la ficha de un plan de mantenimiento preventivo.
 *
 * Sigue el armado de las otras fichas (la de activo, la de herramienta): las
 * acciones arriba a la derecha, un resumen con los datos del plan y, abajo, la
 * programación por activo y las OT que ya generó. El estado va con su
 * etiqueta (ver EtiquetaEstadoPlan.js).
 */
import { use, useEffect, useState } from 'react';
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
import { cilArrowLeft, cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaEstadoPlan from '@/componentes/planes/EtiquetaEstadoPlan.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { obtenerPlan, obtenerProgramacion, darDeBajaPlan } from '@/servicios/planesMantenimiento.js';
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

export default function PantallaDetallePlanMantenimiento({ params }) {
  const { id } = use(params);
  const { mostrarToast } = useToast();

  const [plan, setPlan] = useState(null);
  const [programacion, setProgramacion] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [modalBaja, setModalBaja] = useState(false);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);

  useEffect(() => {
    Promise.all([obtenerPlan(id), obtenerProgramacion(id)])
      .then(([datosPlan, datosProgramacion]) => {
        setPlan(datosPlan);
        setProgramacion(datosProgramacion);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  async function confirmarBaja() {
    setDandoDeBaja(true);
    try {
      await darDeBajaPlan(plan.id);
      mostrarToast({ tipo: 'exito', mensaje: `Se dio de baja el plan "${plan.nombre}".` });
      setModalBaja(false);
      setPlan(await obtenerPlan(id));
    } catch (fallo) {
      setError(fallo.message);
      setModalBaja(false);
    } finally {
      setDandoDeBaja(false);
    }
  }

  return (
    <>
      <EncabezadoPagina
        titulo={plan ? plan.nombre : 'Plan de mantenimiento'}
        accionesExtra={
          plan?.activo && (
            <>
              <BotonEnlace href={`/planes-mantenimiento/${plan.id}/editar`} color="secondary" variante="outline">
                <CIcon icon={cilPencil} className="me-2" />
                Editar
              </BotonEnlace>
              <CButton color="secondary" variant="outline" onClick={() => setModalBaja(true)}>
                <CIcon icon={cilTrash} className="me-2" />
                Dar de baja
              </CButton>
            </>
          )
        }
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando el plan..." />
      ) : (
        plan && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Resumen</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Tipo de activo">{plan.tipoActivo?.nombre}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Frecuencia">{plan.frecuencia}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Aplica desde">{soloFechaLegible(plan.fechaAlta)}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Estado">
                      <EtiquetaEstadoPlan activo={plan.activo} />
                      {!plan.activo && (
                        <span className="text-body-secondary small ms-2">
                          el {soloFechaLegible(plan.fechaBaja)}
                        </span>
                      )}
                    </Dato>
                  </CCol>
                  <CCol xs={12}>
                    <Dato etiqueta="Descripción">
                      {plan.descripcion || <SinDato>Sin descripción</SinDato>}
                    </Dato>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CRow className="g-4 mb-4">
              <CCol lg={6}>
                <CCard className="h-100">
                  <CCardHeader className="fw-semibold">Tareas ({plan.tareas.length})</CCardHeader>
                  <CCardBody>
                    {plan.tareas.length === 0 ? (
                      <SinDato>Sin tareas.</SinDato>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {plan.tareas.map((tarea) => (
                          <li key={tarea.id} className="mb-2">
                            {tarea.nombre}
                            <span className="text-body-secondary">
                              {' '}— {tarea.nombreEspecialidad ?? 'sin especialidad'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={6}>
                <CCard className="h-100">
                  <CCardHeader className="fw-semibold">Técnicos autorizados ({plan.tecnicos.length})</CCardHeader>
                  <CCardBody>
                    {plan.tecnicos.length === 0 ? (
                      <SinDato>Sin técnicos: las tareas de las OT quedan sin asignar.</SinDato>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {plan.tecnicos.map((tecnico) => (
                          <li key={tecnico.legajo} className="mb-2">
                            {tecnico.nombre}
                            <span className="text-body-secondary">
                              {' '}— {tecnico.especialidades?.join(', ') || 'sin especialidad'}
                              {!tecnico.disponible && ' (no disponible)'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            {/* Cada activo del tipo lleva su propio ciclo (03/11/2026). */}
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Programación por activo</CCardHeader>
              <CCardBody>
                {programacion.length === 0 ? (
                  <SinDatos texto="No hay activos de este tipo en servicio." />
                ) : (
                  <CTable responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Activo</CTableHeaderCell>
                        <CTableHeaderCell className="d-none d-sm-table-cell">Último mantenimiento</CTableHeaderCell>
                        <CTableHeaderCell>Próximo</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {programacion.map((fila) => (
                        <CTableRow key={fila.codigoActivo}>
                          <CTableDataCell>
                            <Link href={`/activos/${encodeURIComponent(fila.codigoActivo)}`} className="fw-semibold">
                              {fila.codigoActivo}
                            </Link>
                          </CTableDataCell>
                          <CTableDataCell className="d-none d-sm-table-cell">
                            {fila.ultimaRealizada ? soloFechaLegible(fila.ultimaRealizada) : <SinDato>Ninguno</SinDato>}
                          </CTableDataCell>
                          <CTableDataCell>
                            {fila.otAbierta ? (
                              <>
                                En curso:{' '}
                                <Link href={`/ordenes-trabajo/${fila.otAbierta.id}`}>OT #{fila.otAbierta.id}</Link>
                              </>
                            ) : (
                              soloFechaLegible(fila.proxima)
                            )}
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                )}
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Órdenes de trabajo generadas ({plan.ordenes.length})</CCardHeader>
              <CCardBody>
                {plan.ordenes.length === 0 ? (
                  <SinDatos texto="Todavía no se generó ninguna orden de trabajo con este plan." />
                ) : (
                  <CTable responsive align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Orden</CTableHeaderCell>
                        <CTableHeaderCell>Activo</CTableHeaderCell>
                        <CTableHeaderCell className="d-none d-md-table-cell">Ciclo</CTableHeaderCell>
                        <CTableHeaderCell className="d-none d-md-table-cell">Cierre</CTableHeaderCell>
                        <CTableHeaderCell>Estado</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>
                    <CTableBody>
                      {[...plan.ordenes]
                        .sort((a, b) => b.id - a.id)
                        .map((ot) => (
                          <CTableRow key={ot.id}>
                            <CTableDataCell>
                              <Link href={`/ordenes-trabajo/${ot.id}`} className="fw-semibold">
                                #{ot.id}
                              </Link>
                            </CTableDataCell>
                            <CTableDataCell>{ot.codigoActivo ?? '-'}</CTableDataCell>
                            <CTableDataCell className="d-none d-md-table-cell">
                              {soloFechaLegible(ot.fechaProgramada)}
                            </CTableDataCell>
                            <CTableDataCell className="d-none d-md-table-cell">
                              {ot.fechaCierre ? soloFechaLegible(ot.fechaCierre) : '-'}
                            </CTableDataCell>
                            <CTableDataCell>
                              <EtiquetaEstadoOT estado={ot.estado} />
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                    </CTableBody>
                  </CTable>
                )}
              </CCardBody>
            </CCard>
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/planes-mantenimiento" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>

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
          Se va a dar de baja el plan <strong>{plan?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mb-0">
          Deja de generar órdenes de trabajo. Las que ya generó no se tocan.
        </p>
      </DialogoEliminar>
    </>
  );
}
