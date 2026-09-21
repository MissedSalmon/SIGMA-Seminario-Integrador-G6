'use client';

/**
 * /ordenes-trabajo/5 - la orden de trabajo y su planificación (HU-14).
 *
 * Es la pantalla donde el administrador arma la OT: le carga las tareas, les
 * pone prioridad y define quién hace cada una (un técnico de la facultad o un
 * prestador externo).
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
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import FormularioTareaOT from '@/componentes/ordenes/FormularioTareaOT.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  obtenerOrden,
  actualizarOrden,
  agregarTarea,
  actualizarTarea,
  eliminarTarea,
  listarPrioridades,
} from '@/servicios/ordenesTrabajo.js';
import { listarPlantillas } from '@/servicios/plantillasTareas.js';
import { listarPrestadores } from '@/servicios/prestadores.js';
import { listarTecnicos } from '@/servicios/tecnicos.js';
import { formatearFechaHora } from '@/utils/fechas.js';
import { formatearDuracion } from '@/utils/duracion.js';

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

  // Lo que se puede elegir al cargar una tarea.
  const [prioridades, setPrioridades] = useState(['Alta', 'Media', 'Baja']);
  const [plantillas, setPlantillas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [prestadores, setPrestadores] = useState([]);

  const [formularioVisible, setFormularioVisible] = useState(false);
  const [tareaEnEdicion, setTareaEnEdicion] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState('');

  const [tareaAEliminar, setTareaAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const [modalDescripcion, setModalDescripcion] = useState(false);
  const [descripcion, setDescripcion] = useState('');
  const [errorDescripcion, setErrorDescripcion] = useState('');

  useEffect(() => {
    obtenerOrden(id)
      .then(setOrden)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  // Los técnicos, los prestadores y las prioridades no dependen de la OT.
  useEffect(() => {
    Promise.all([listarPrioridades(), listarTecnicos(), listarPrestadores()])
      .then(([listaPrioridades, listaTecnicos, listaPrestadores]) => {
        setPrioridades(listaPrioridades);
        setTecnicos(listaTecnicos);
        setPrestadores(listaPrestadores);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  /*
   * Las tareas estándar sí dependen de la OT: son las plantillas cargadas para
   * el tipo de activo del ticket (HU-12). Si la OT no tiene activo, no hay
   * plantillas que ofrecer y el desplegable no aparece.
   */
  useEffect(() => {
    const idTipoActivo = orden?.activo?.idTipoActivo;
    if (!idTipoActivo) return;

    listarPlantillas(idTipoActivo)
      .then(setPlantillas)
      .catch(() => setPlantillas([]));
  }, [orden?.activo?.idTipoActivo]);

  const cerrada = orden ? ESTADOS_CERRADOS.includes(orden.estado) : false;

  function abrirAlta() {
    setTareaEnEdicion(null);
    setErrorFormulario('');
    setFormularioVisible(true);
  }

  function abrirEdicion(tarea) {
    setTareaEnEdicion(tarea);
    setErrorFormulario('');
    setFormularioVisible(true);
  }

  async function guardarTarea(datos) {
    setGuardando(true);
    setErrorFormulario('');

    try {
      const actualizada = tareaEnEdicion
        ? await actualizarTarea(orden.id, tareaEnEdicion.idTarea, datos)
        : await agregarTarea(orden.id, datos);

      setOrden(actualizada);
      setFormularioVisible(false);
      mostrarToast({
        tipo: 'exito',
        mensaje: tareaEnEdicion ? 'Se guardaron los cambios de la tarea.' : 'Se agregó la tarea.',
      });
    } catch (fallo) {
      setErrorFormulario(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

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
                        <Dato etiqueta="Prioridad más alta de sus tareas">
                          <EtiquetaPrioridad prioridad={orden.prioridad} />
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
                  <CButton color="primary" size="sm" onClick={abrirAlta}>
                    <CIcon icon={cilPlus} size="sm" className="me-1" />
                    Agregar
                  </CButton>
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
                              {formatearDuracion(tarea.horasEstimadas) ?? '-'}
                            </CTableDataCell>

                            <CTableDataCell className="text-body-secondary">{tarea.estado}</CTableDataCell>

                            {!cerrada && (
                              <CTableDataCell className="text-end text-nowrap">
                                <CButton
                                  color="secondary"
                                  variant="outline"
                                  size="sm"
                                  className="me-2"
                                  onClick={() => abrirEdicion(tarea)}
                                  title="Editar la tarea"
                                  aria-label={`Editar la tarea ${tarea.idTarea}`}
                                >
                                  <CIcon icon={cilPencil} size="sm" />
                                </CButton>
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

            {/*
              La ventana de la tarea se monta recién al abrirla y se desmonta
              al cerrarla: así las cajas arrancan siempre con la tarea que se
              eligió, sin tener que vaciarlas a mano.
            */}
            {formularioVisible && (
            <FormularioTareaOT
              visible
              tarea={tareaEnEdicion}
              prioridades={prioridades}
              plantillas={plantillas}
              tecnicos={tecnicos}
              prestadores={prestadores}
              guardando={guardando}
              error={errorFormulario}
              onGuardar={guardarTarea}
              onCancelar={() => setFormularioVisible(false)}
            />
            )}

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
                <p className="sigma-campo-mensaje">
                  Arranca con el motivo que escribió quien reportó el problema.
                </p>
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setModalDescripcion(false)}
                  disabled={guardando}
                >
                  Cancelar
                </CButton>
                <CButton color="primary" onClick={guardarDescripcion} disabled={guardando}>
                  {guardando ? 'Guardando...' : 'Guardar'}
                </CButton>
              </CModalFooter>
            </CModal>
          </>
        )
      )}

      <div className="mt-2">
        <BotonEnlace href="/ordenes-trabajo" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
