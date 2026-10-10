'use client';

/**
 * /ordenes-trabajo/5 - la orden y su planificación. El diagnóstico de cada tarea
 * (la falla) se ve, pero ya no se carga desde acá (09/10/2026).
 *
 * Es la pantalla donde el administrador arma la OT: le carga las tareas, les
 * pone prioridad y define quién hace cada una (un técnico de la facultad o un
 * prestador externo).
 *
 * La prioridad de la OT se sugiere sola (la más alta de sus tareas), pero el
 * administrador puede poner otra a mano, o volver a la sugerida (09/10/2026).
 *
 * El estado de la OT no se toca a mano, lo calcula el sistema:
 *
 *   sin tareas, o con alguna sin responsable  ->  Creada
 *   todas con responsable                     ->  Asignada
 *
 * Y el ticket que le dio origen acompaña: cuando la OT queda asignada, el
 * ticket pasa a "Asignado".
 */
import { use, useEffect, useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormTextarea,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilDescription, cilPencil, cilPlus, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import Campo from '@/componentes/formulario/Campo.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  obtenerOrden,
  actualizarOrden,
  eliminarTarea,
  listarPrioridades,
} from '@/servicios/ordenesTrabajo.js';
import { formatearFechaHora } from '@/utils/fechas.js';
import { comoHoraMinuto } from '@/utils/duracion.js';

/** Una OT en estos estados ya no se planifica. */
const ESTADOS_CERRADOS = ['Finalizada', 'Cancelada'];

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

/** De "2026-09-21T00:00:00+00:00" saca "21/09/2026". */
function soloFechaLegible(iso) {
  if (!iso) return null;
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : null;
}

export default function PantallaDetalleOrdenTrabajo({ params }) {
  const { id } = use(params);
  const { mostrarToast } = useToast();

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [guardando, setGuardando] = useState(false);

  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [modalDescripcion, setModalDescripcion] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');

  const [prioridades, setPrioridades] = useState(['Alta', 'Media', 'Baja']);
  const [modalPrioridad, setModalPrioridad] = useState(false);
  // "" quiere decir "usar la sugerida".
  const [prioridadElegida, setPrioridadElegida] = useState('');
  const [errorPrioridad, setErrorPrioridad] = useState('');

  useEffect(() => {
    obtenerOrden(id)
      .then(setOrden)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    listarPrioridades()
      .then(setPrioridades)
      .catch(() => {});
  }, []);

  const cerrada = orden ? ESTADOS_CERRADOS.includes(orden.estado) : false;

  async function confirmarEliminar() {
    setEliminando(true);

    try {
      const actualizada = await eliminarTarea(orden.id, tareaAEliminar.idTarea);
      setOrden(actualizada);
      setTareaAEliminar(null);
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó la tarea ${tareaAEliminar.idTarea}.` });
    } catch (fallo) {
      setError(fallo.message);
      setTareaAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  function abrirDescripcion() {
    setDescripcion(orden.descripcion ?? '');
    setErrorDescripcion('');
    setModalDescripcion(true);
  }

  async function guardarDescripcion() {
    if (!descripcion.trim()) {
      setErrorDescripcion('La descripción es obligatoria.');
      return;
    }

    setGuardando(true);

    try {
      const actualizada = await actualizarOrden(orden.id, { descripcion: descripcion.trim() });
      setOrden(actualizada);
      setModalDescripcion(false);
      mostrarToast({ tipo: 'exito', mensaje: 'Se guardó la descripción.' });
    } catch (fallo) {
      setErrorDescripcion(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  function abrirPrioridad() {
    setPrioridadElegida(orden.prioridadManual ?? '');
    setErrorPrioridad('');
    setModalPrioridad(true);
  }

  async function guardarPrioridad() {
    setGuardando(true);

    try {
      const actualizada = await actualizarOrden(orden.id, { prioridad: prioridadElegida || null });
      setOrden(actualizada);
      setModalPrioridad(false);
      mostrarToast({
        tipo: 'exito',
        mensaje: prioridadElegida
          ? 'Se guardó la prioridad de la orden.'
          : 'La orden vuelve a usar la prioridad sugerida.',
      });
    } catch (fallo) {
      setErrorPrioridad(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <EncabezadoPagina titulo={orden ? `Orden de trabajo #${orden.id}` : 'Orden de trabajo'} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando la orden de trabajo..." />
      ) : (
        orden && (
          <>
            <CRow className="g-4">
              <CCol lg={7}>
                <CCard className="mb-4">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Datos generales</span>
                    {!cerrada && (
                      <CButton color="secondary" variant="outline" size="sm" onClick={abrirDescripcion}>
                        <CIcon icon={cilPencil} size="sm" className="me-1" />
                        Editar descripción
                      </CButton>
                    )}
                  </CCardHeader>
                  <CCardBody>
                    <CRow>
                      <CCol sm={4}>
                        <Dato etiqueta="Estado">
                          <EtiquetaEstadoOT estado={orden.estado} />
                        </Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Prioridad">
                          <div className="d-flex align-items-center gap-2">
                            <EtiquetaPrioridad prioridad={orden.prioridad} />
                            {!cerrada && (
                              <CButton
                                color="primary"
                                variant="ghost"
                                size="sm"
                                className="btn-icono"
                                onClick={abrirPrioridad}
                                title="Cambiar la prioridad de la orden"
                                aria-label="Cambiar la prioridad de la orden"
                              >
                                <CIcon icon={cilPencil} />
                              </CButton>
                            )}
                          </div>
                          <div className="text-body-secondary small mt-1">
                            {orden.prioridadManual
                              ? `Puesta a mano. Sugerida: ${orden.prioridadSugerida ?? 'ninguna'}.`
                              : 'Sugerida según sus tareas.'}
                          </div>
                        </Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Fecha de alta">{formatearFechaHora(orden.fechaAlta)}</Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Origen">
                          {orden.idTicket ? (
                            <BotonEnlace
                              href={`/tickets/${orden.idTicket}`}
                              color="secondary"
                              variante="ghost"
                              tamano="sm"
                              className="px-0"
                              title="Ver el ticket que originó esta orden"
                            >
                              <CIcon icon={cilDescription} size="sm" className="me-1" />
                              Ticket #{orden.idTicket}
                            </BotonEnlace>
                          ) : (
                            'Mantenimiento preventivo'
                          )}
                        </Dato>
                      </CCol>
                      <CCol sm={4}>
                        <Dato etiqueta="Fecha de cierre">
                          {orden.fechaCierre ? (
                            formatearFechaHora(orden.fechaCierre)
                          ) : (
                            <SinDato>Todavía abierta</SinDato>
                          )}
                        </Dato>
                      </CCol>
                    </CRow>

                    <Dato etiqueta="Descripción">
                      <span style={{ whiteSpace: 'pre-wrap' }}>{orden.descripcion}</span>
                    </Dato>
                  </CCardBody>
                </CCard>
              </CCol>

              <CCol lg={5}>
                <CCard className="mb-4">
                  <CCardHeader className="fw-semibold">Activo afectado</CCardHeader>
                  <CCardBody>
                    {orden.activo ? (
                      <CRow>
                        <CCol sm={6}>
                          <Dato etiqueta="Código">
                            <span className="fw-semibold">{orden.activo.codigo}</span>
                          </Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Tipo">{orden.activo.nombreTipo || '-'}</Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Ubicación">
                            {orden.activo.nombreEdificio || orden.activo.espacio_num
                              ? `${orden.activo.nombreEdificio} — Espacio ${orden.activo.espacio_num}`
                              : '-'}
                          </Dato>
                        </CCol>
                        <CCol sm={6}>
                          <Dato etiqueta="Área">
                            {orden.nombreArea || <SinDato>El espacio no tiene área asignada.</SinDato>}
                          </Dato>
                        </CCol>
                        <CCol sm={12}>
                          <Dato etiqueta="Reportado por">
                            {orden.registradoPor?.nombre || <SinDato>Sin datos.</SinDato>}
                          </Dato>
                        </CCol>
                      </CRow>
                    ) : (
                      <SinDato>Esta orden no tiene un activo asociado.</SinDato>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

            <CCard className="mb-4">
              <CCardHeader className="d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span className="fw-semibold">Tareas</span>
                {!cerrada && (
                  <BotonEnlace href={`/ordenes-trabajo/${orden.id}/tareas/agregar`} tamano="sm">
                    <CIcon icon={cilPlus} size="sm" className="me-1" />
                    Agregar
                  </BotonEnlace>
                )}
              </CCardHeader>
              <CCardBody>
                {orden.tareas.length === 0 ? (
                  <p className="text-body-secondary mb-0">
                    Esta orden todavía no tiene tareas. Agregá las que hay que hacer y asignales un
                    responsable: cuando todas tengan uno, la orden pasa a &quot;Asignada&quot;.
                  </p>
                ) : (
                  <>
                    {orden.tareasSinResponsable > 0 && (
                      <p className="text-body-secondary small">
                        {orden.tareasSinResponsable === 1
                          ? 'Queda 1 tarea sin responsable.'
                          : `Quedan ${orden.tareasSinResponsable} tareas sin responsable.`}{' '}
                        La orden pasa a &quot;Asignada&quot; cuando todas tengan uno.
                      </p>
                    )}

                    <CTable hover responsive align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>#</CTableHeaderCell>
                          <CTableHeaderCell>Tarea</CTableHeaderCell>
                          <CTableHeaderCell>Prioridad</CTableHeaderCell>
                          <CTableHeaderCell>Responsable</CTableHeaderCell>
                          <CTableHeaderCell>Previsto</CTableHeaderCell>
                          <CTableHeaderCell>Duración</CTableHeaderCell>
                          <CTableHeaderCell>Estado</CTableHeaderCell>
                          <CTableHeaderCell>Falla</CTableHeaderCell>
                          {!cerrada && <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>}
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {orden.tareas.map((tarea) => (
                          <CTableRow key={tarea.idTarea}>
                            <CTableDataCell className="fw-semibold">{tarea.idTarea}</CTableDataCell>

                            <CTableDataCell style={{ minWidth: '14rem' }}>
                              <span style={{ whiteSpace: 'pre-wrap' }}>{tarea.descripcion}</span>
                            </CTableDataCell>

                            <CTableDataCell>
                              <EtiquetaPrioridad prioridad={tarea.prioridad} />
                            </CTableDataCell>

                            <CTableDataCell>
                              {tarea.responsable ? (
                                <>
                                  <div>{tarea.responsable.nombre}</div>
                                  <div className="text-body-secondary small">{tarea.responsable.tipo}</div>
                                </>
                              ) : (
                                <SinDato>Sin asignar</SinDato>
                              )}
                            </CTableDataCell>

                            <CTableDataCell className="text-nowrap text-body-secondary">
                              {soloFechaLegible(tarea.fechaInicio) || '-'}
                              {tarea.fechaFin && ` → ${soloFechaLegible(tarea.fechaFin)}`}
                            </CTableDataCell>

                            <CTableDataCell className="text-nowrap text-body-secondary">
                              {comoHoraMinuto(tarea.horasEstimadas) || '-'}
                            </CTableDataCell>

                            <CTableDataCell className="text-body-secondary">{tarea.estado}</CTableDataCell>

                            <CTableDataCell style={{ minWidth: '12rem' }}>
                              {tarea.falla ? (
                                <>
                                  <div className="fw-semibold">{tarea.falla.tipo}</div>
                                  <div style={{ whiteSpace: 'pre-wrap' }}>{tarea.falla.descripcion}</div>
                                </>
                              ) : (
                                <SinDato>Sin diagnóstico</SinDato>
                              )}
                            </CTableDataCell>

                            {!cerrada && (
                              <CTableDataCell className="text-end text-nowrap">
                                <BotonEnlace
                                  href={`/ordenes-trabajo/${orden.id}/tareas/${tarea.idTarea}/editar`}
                                  color="secondary"
                                  variante="outline"
                                  tamano="sm"
                                  className="me-2"
                                  title="Editar la tarea"
                                  aria-label={`Editar la tarea ${tarea.idTarea}`}
                                >
                                  <CIcon icon={cilPencil} size="sm" />
                                </BotonEnlace>
                                <CButton
                                  color="danger"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setTareaAEliminar(tarea)}
                                  title="Eliminar la tarea"
                                  aria-label={`Eliminar la tarea ${tarea.idTarea}`}
                                >
                                  <CIcon icon={cilTrash} size="sm" />
                                </CButton>
                              </CTableDataCell>
                            )}
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </>
                )}
              </CCardBody>
            </CCard>

            <DialogoEliminar
              visible={Boolean(tareaAEliminar)}
              titulo="Eliminar la tarea"
              eliminando={eliminando}
              onConfirmar={confirmarEliminar}
              onCancelar={() => setTareaAEliminar(null)}
            >
              {tareaAEliminar && (
                <p className="mb-0">
                  Se va a eliminar la tarea <strong>{tareaAEliminar.idTarea}</strong> de esta orden:
                  &quot;{tareaAEliminar.descripcion}&quot;.
                </p>
              )}
            </DialogoEliminar>

            <CModal visible={modalPrioridad} onClose={() => !guardando && setModalPrioridad(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Prioridad de la orden</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <Aviso mensaje={errorPrioridad} />
                <Campo
                  id="prioridadOrden"
                  etiqueta="Prioridad"
                  tipo="lista"
                  valor={prioridadElegida}
                  alCambiar={setPrioridadElegida}
                  opciones={prioridades.map((una) => ({ valor: una, texto: una }))}
                  placeholder={`Usar la sugerida (${orden.prioridadSugerida ?? 'sin tareas'})`}
                  ancho={24}
                />
              </CModalBody>
              <CModalFooter>
                <BotonesAccion
                  procesando={guardando}
                  alAceptar={guardarPrioridad}
                  alCancelar={() => setModalPrioridad(false)}
                />
              </CModalFooter>
            </CModal>

            <CModal visible={modalDescripcion} onClose={() => setModalDescripcion(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Descripción de la orden</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <Aviso mensaje={errorDescripcion} />
                <CFormLabel htmlFor="descripcionOrden" className="sigma-obligatorio">
                  Qué hay que resolver
                </CFormLabel>
                <CFormTextarea
                  id="descripcionOrden"
                  rows={4}
                  value={descripcion}
                  onChange={(evento) => setDescripcion(evento.target.value)}
                />
              </CModalBody>
              <CModalFooter>
                <BotonesAccion
                  procesando={guardando}
                  alAceptar={guardarDescripcion}
                  alCancelar={() => setModalDescripcion(false)}
                />
              </CModalFooter>
            </CModal>
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/ordenes-trabajo" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
