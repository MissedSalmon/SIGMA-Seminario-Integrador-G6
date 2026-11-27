'use client';

/**
 * Detalle de una tarea de la OT para el administrador (19/11/2026).
 *
 * Lo planificado y lo que hizo el técnico (falla, materiales, herramientas y
 * observaciones). Lo ejecutado lo carga el técnico.
 *
 * Las acciones van arriba, como en las fichas de técnicos y solicitantes:
 * «Editar» a la vista y el resto en «Opciones». La tarea de un prestador
 * externo la inicia y la finaliza el administrador desde acá, porque el
 * prestador no entra al sistema (21/11/2026).
 */
import { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
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
import { cilArrowLeft, cilCheckCircle, cilMediaPlay, cilPencil, cilTrash, cilUserFollow } from '@coreui/icons';
import Link from 'next/link';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import ReferenciaEtapas from '@/componentes/estados/ReferenciaEtapas.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import ObservacionesTarea from '@/componentes/tareas/ObservacionesTarea.js';
import PreguntaEstadoActivo from '@/componentes/tareas/PreguntaEstadoActivo.js';
import DialogoAsignarTarea from '@/componentes/ordenes/DialogoAsignarTarea.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  eliminarTarea,
  finalizarTareaDePrestador,
  iniciarTareaDePrestador,
  obtenerTareaDeOrden,
} from '@/servicios/ordenesTrabajo.js';
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

const ESTADOS_SIN_EMPEZAR = ['Creada', 'Asignada', 'Pendiente'];

export default function PantallaDetalleTareaOT({ params }) {
  const { id, idTarea } = use(params);
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [tarea, setTarea] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // La ventana abierta: 'iniciar', 'finalizar' o 'eliminar'.
  const [ventana, setVentana] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorVentana, setErrorVentana] = useState('');

  const pedir = useCallback(
    () =>
      obtenerTareaDeOrden(id, idTarea)
        .then(setTarea)
        .catch((fallo) => setError(fallo.message)),
    [id, idTarea]
  );

  useEffect(() => {
    pedir().finally(() => setCargando(false));
  }, [pedir]);

  const sinEmpezar = tarea && ESTADOS_SIN_EMPEZAR.includes(tarea.estado);
  const otAbierta = tarea && !['Finalizada', 'Cancelada'].includes(tarea.ot.estado);
  const dePrestador = tarea?.responsable?.tipo === 'Prestador';
  const puedeIniciar = otAbierta && dePrestador && sinEmpezar;
  const puedeFinalizar = otAbierta && dePrestador && (sinEmpezar || tarea.estado === 'En ejecución');
  // Sin responsable se asigna desde acá, sin pasar por «Editar» (22/11/2026).
  const puedeAsignar = otAbierta && !tarea?.responsable && sinEmpezar;

  // Si es la última tarea de la OT (al finalizar o al eliminar), se elige cómo queda el activo.
  const preguntarEstadoActivo = ventana === 'finalizar' && Boolean(tarea?.cierraLaOrden && tarea?.activo);
  const preguntarEstadoActivoAlEliminar =
    ventana === 'eliminar' && Boolean(tarea?.cierraAlEliminar && tarea?.activo);
  const [estadoActivo, setEstadoActivo] = useState('');
  const [revisadoFinal, setRevisadoFinal] = useState(false);

  function abrir(cual) {
    setErrorVentana('');
    setEstadoActivo('');
    setRevisadoFinal(false);
    setVentana(cual);
  }

  function cerrar() {
    if (!procesando) setVentana(null);
  }

  async function confirmarMovimiento() {
    setRevisadoFinal(true);
    if (preguntarEstadoActivo && !estadoActivo) return;

    setProcesando(true);
    setErrorVentana('');
    try {
      if (ventana === 'iniciar') {
        await iniciarTareaDePrestador(id, idTarea);
        mostrarToast({ tipo: 'exito', mensaje: 'La tarea quedó en ejecución.' });
      } else {
        const { ordenFinalizada } = await finalizarTareaDePrestador(
          id,
          idTarea,
          preguntarEstadoActivo ? estadoActivo : undefined
        );
        mostrarToast({
          tipo: 'exito',
          mensaje: ordenFinalizada
            ? `La tarea quedó finalizada. Era la última: la OT #${id} se finalizó, el ticket se cerró y el activo quedó ${estadoActivo || 'Operativo'}.`
            : 'La tarea quedó finalizada.',
        });
      }
      await pedir();
      setVentana(null);
    } catch (fallo) {
      setErrorVentana(fallo.message);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarEliminar() {
    setRevisadoFinal(true);
    if (preguntarEstadoActivoAlEliminar && !estadoActivo) return;

    setProcesando(true);
    try {
      const { ordenFinalizada } = await eliminarTarea(
        id,
        idTarea,
        preguntarEstadoActivoAlEliminar ? estadoActivo : undefined
      );
      mostrarToast({
        tipo: 'exito',
        mensaje: ordenFinalizada
          ? tarea?.ot?.idTicket
            ? `Se eliminó la tarea ${idTarea}. Como no quedan tareas pendientes, la OT #${id} se finalizó, el ticket se cerró y el activo quedó ${estadoActivo || 'Operativo'}.`
            : `Se eliminó la tarea ${idTarea}. Como no quedan tareas pendientes, la OT #${id} se finalizó y el activo quedó ${estadoActivo || 'Operativo'}.`
          : `Se eliminó la tarea ${idTarea}.`,
      });
      router.push(`/ordenes-trabajo/${id}`);
    } catch (fallo) {
      setError(fallo.message);
      setVentana(null);
      setProcesando(false);
    }
  }

  const acciones = otAbierta && (
    <>
      <BotonEnlace href={`/ordenes-trabajo/${id}/tareas/${idTarea}/editar`} color="secondary" variante="outline">
        <CIcon icon={cilPencil} className="me-2" />
        Editar
      </BotonEnlace>

      <CDropdown placement="bottom-end">
        <CDropdownToggle color="secondary" variant="outline">
          Opciones
        </CDropdownToggle>
        <CDropdownMenu className="shadow-sm border" style={{ minWidth: '14rem' }}>
          {puedeAsignar && (
            <CDropdownItem as="button" className="d-flex align-items-center gap-2 py-2" onClick={() => abrir('asignar')}>
              <CIcon icon={cilUserFollow} />
              Asignar
            </CDropdownItem>
          )}
          {puedeIniciar && (
            <CDropdownItem as="button" className="d-flex align-items-center gap-2 py-2" onClick={() => abrir('iniciar')}>
              <CIcon icon={cilMediaPlay} />
              Iniciar tarea
            </CDropdownItem>
          )}
          {puedeFinalizar && (
            <CDropdownItem as="button" className="d-flex align-items-center gap-2 py-2" onClick={() => abrir('finalizar')}>
              <CIcon icon={cilCheckCircle} />
              Finalizar tarea
            </CDropdownItem>
          )}
          {(puedeAsignar || puedeIniciar || puedeFinalizar) && <CDropdownDivider className="my-1" />}
          {/* En rojo y separado: rojo = no se puede deshacer. */}
          <CDropdownItem
            as="button"
            className="d-flex align-items-center gap-2 py-2 text-danger"
            onClick={() => abrir('eliminar')}
          >
            <CIcon icon={cilTrash} />
            Eliminar
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>
    </>
  );

  return (
    <>
      <EncabezadoPagina titulo={`Tarea ${idTarea} de la OT #${id}`} accionesExtra={acciones} />
      {/* Que significa el color de cada sello (regla 6). */}
      <ReferenciaEtapas className="mt-0 mb-3" de="tarea" estados={[tarea?.estado, tarea?.ot?.estado]} />

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
                        <Dato etiqueta="Estado">
                          <EtiquetaEstadoOT estado={tarea.estado} />
                        </Dato>
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
                            <Dato etiqueta="Espacio">{tarea.activo.nombreEspacio || <SinDato>-</SinDato>}</Dato>
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
                                <CTableDataCell className="text-end">
                                  {material.cantidad} {material.unidadMedida}
                                </CTableDataCell>
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

      <CModal visible={ventana === 'iniciar' || ventana === 'finalizar'} onClose={cerrar} alignment="center">
        <CModalHeader>
          <CModalTitle>{ventana === 'iniciar' ? 'Iniciar la tarea' : 'Finalizar la tarea'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <Aviso mensaje={errorVentana} />
          <p className={preguntarEstadoActivo ? undefined : 'mb-0'}>
            La tarea de <strong>{tarea?.responsable?.nombre}</strong> pasa a{' '}
            <strong>{ventana === 'iniciar' ? 'En ejecución' : 'Finalizada'}</strong>.
          </p>
          {preguntarEstadoActivo && (
            <PreguntaEstadoActivo
              idOt={id}
              codigoActivo={tarea.activo.codigo}
              valor={estadoActivo}
              alCambiar={setEstadoActivo}
              revisado={revisadoFinal}
            />
          )}
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto={ventana === 'iniciar' ? 'Iniciar' : 'Finalizar'}
            textoProcesando={ventana === 'iniciar' ? 'Iniciando...' : 'Finalizando...'}
            procesando={procesando}
            alAceptar={confirmarMovimiento}
            alCancelar={cerrar}
          />
        </CModalFooter>
      </CModal>

      {ventana === 'asignar' && tarea && (
        <DialogoAsignarTarea
          idOt={id}
          tarea={tarea}
          onCerrar={() => setVentana(null)}
          onGuardado={async () => {
            await pedir();
            setVentana(null);
          }}
        />
      )}

      <DialogoEliminar
        visible={ventana === 'eliminar'}
        titulo="Eliminar la tarea"
        eliminando={procesando}
        onConfirmar={confirmarEliminar}
        onCancelar={cerrar}
      >
        {tarea && (
          <>
            <p className={tarea.cierraAlEliminar ? undefined : 'mb-0'}>
              Se va a eliminar la tarea <strong>{idTarea}</strong> de esta orden: &quot;{tarea.descripcion}&quot;.
            </p>
            {preguntarEstadoActivoAlEliminar ? (
              <PreguntaEstadoActivo
                idOt={id}
                codigoActivo={tarea.activo.codigo}
                valor={estadoActivo}
                alCambiar={setEstadoActivo}
                revisado={revisadoFinal}
                mensaje={
                  <>
                    Al eliminarla no quedan tareas pendientes: la OT <strong>#{id}</strong> se finaliza
                    {tarea.ot?.idTicket ? ' y el ticket se cierra.' : '.'}
                  </>
                }
              />
            ) : (
              tarea.cierraAlEliminar && (
                <p className="mb-0">
                  Al eliminarla no quedan tareas pendientes: la OT <strong>#{id}</strong> se finaliza
                  {tarea.ot?.idTicket ? ' y el ticket se cierra.' : '.'}
                </p>
              )
            )}
          </>
        )}
      </DialogoEliminar>

      <div className="mt-2 mb-4">
        <BotonEnlace href={`/ordenes-trabajo/${id}`} color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver a la orden de trabajo
        </BotonEnlace>
      </div>
    </>
  );
}
