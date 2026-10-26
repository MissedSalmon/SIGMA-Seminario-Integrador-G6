'use client';

/**
 * /tareas/[idOt]/[idTarea] - Detalle de una tarea del técnico.
 *
 * HU-21: lo que el técnico necesita para ir a hacerla: qué hay que hacer, sobre
 * qué activo, dónde está (edificio y espacio) y a qué OT pertenece.
 *
 * HU-22: desde acá también la ejecuta.
 *   - "Iniciar tarea": pasa a En ejecución y el activo a En mantenimiento.
 *   - Mientras está en ejecución registra en una ventana los materiales que usa
 *     (descuentan stock) y toma las herramientas que necesita (quedan a su nombre).
 *   - "Finalizar tarea": pasa a Finalizada. Si era la última de la OT, la OT
 *     se finaliza sola y el ticket se cierra (HU-26).
 *
 * La OT y el activo no llevan enlace: sus pantallas son del administrador y el
 * técnico no tiene acceso.
 */
import { use, useEffect, useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
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
import { cilArrowLeft, cilCheckCircle, cilMediaPlay, cilPlus } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import DialogoHerramienta from '@/componentes/tareas/DialogoHerramienta.js';
import DialogoMaterial from '@/componentes/tareas/DialogoMaterial.js';
import ObservacionesTarea from '@/componentes/tareas/ObservacionesTarea.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { finalizarTarea, iniciarTarea, listarMisHerramientas, obtenerMiTarea } from '@/servicios/tareas.js';
import { formatearFecha, formatearFechaHora, soloFechaLegible } from '@/utils/fechas.js';

/** Una tarea en estos estados todavía no empezó: se puede iniciar. */
const ESTADOS_SIN_EMPEZAR = ['Creada', 'Asignada', 'Pendiente'];

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
  const { mostrarToast } = useToast();

  const [tarea, setTarea] = useState(null);
  const [herramientas, setHerramientas] = useState({ mias: [], disponibles: [] });
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // Qué ventana está abierta: 'iniciar', 'finalizar', 'material', 'tomar', o la herramienta a devolver.
  const [ventana, setVentana] = useState(null);
  const [procesando, setProcesando] = useState(false);
  const [errorVentana, setErrorVentana] = useState('');

  useEffect(() => {
    let vigente = true;

    Promise.all([obtenerMiTarea(idOt, idTarea), listarMisHerramientas()])
      .then(([datosTarea, datosHerramientas]) => {
        if (!vigente) return;
        setTarea(datosTarea);
        setHerramientas(datosHerramientas);
      })
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [idOt, idTarea]);

  function abrir(nombre) {
    setErrorVentana('');
    setVentana(nombre);
  }

  function cerrar() {
    if (!procesando) setVentana(null);
  }

  async function confirmarInicio() {
    setProcesando(true);
    setErrorVentana('');
    try {
      setTarea(await iniciarTarea(idOt, idTarea));
      setVentana(null);
      mostrarToast({ tipo: 'exito', mensaje: 'La tarea quedó en ejecución.' });
    } catch (fallo) {
      setErrorVentana(fallo.message);
    } finally {
      setProcesando(false);
    }
  }

  async function confirmarFinalizacion() {
    setProcesando(true);
    setErrorVentana('');
    try {
      const respuesta = await finalizarTarea(idOt, idTarea);
      setTarea(respuesta.tarea);
      setVentana(null);
      mostrarToast({
        tipo: 'exito',
        mensaje: respuesta.ordenFinalizada
          ? `La tarea quedó finalizada. Era la última: la OT #${idOt} se finalizó y el ticket se cerró.`
          : 'La tarea quedó finalizada.',
      });
    } catch (fallo) {
      setErrorVentana(fallo.message);
    } finally {
      setProcesando(false);
    }
  }

  const sinEmpezar = tarea && ESTADOS_SIN_EMPEZAR.includes(tarea.estado);
  const enEjecucion = tarea?.estado === 'En ejecución';

  const acciones = tarea && (sinEmpezar || enEjecucion) && (
    <>
      {sinEmpezar && (
        <CButton color="primary" onClick={() => abrir('iniciar')}>
          <CIcon icon={cilMediaPlay} className="me-2" />
          Iniciar tarea
        </CButton>
      )}
      {enEjecucion && (
        <CButton color="primary" onClick={() => abrir('finalizar')}>
          <CIcon icon={cilCheckCircle} className="me-2" />
          Finalizar tarea
        </CButton>
      )}
    </>
  );

  return (
    <>
      <EncabezadoPagina titulo={`Tarea ${idTarea} de la OT #${idOt}`} accionesExtra={acciones} />

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

                    <ObservacionesTarea
                      key={`${idOt}-${idTarea}`}
                      idOt={idOt}
                      idTarea={idTarea}
                      observaciones={tarea.observaciones ?? []}
                      onGuardado={(observacion) => setTarea((actual) => ({
                        ...actual,
                        observaciones: [...(actual.observaciones ?? []), observacion]
                          .sort((a, b) => a.fecha.localeCompare(b.fecha) || Number(a.id) - Number(b.id)),
                      }))}
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

            <CRow className="g-4 mb-4">
              <CCol lg={7}>
                <CCard className="h-100">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Materiales utilizados</span>
                    {enEjecucion && (
                      <CButton color="primary" size="sm" onClick={() => abrir('material')}>
                        <CIcon icon={cilPlus} size="sm" className="me-1" />
                        Agregar
                      </CButton>
                    )}
                  </CCardHeader>
                  <CCardBody>
                    {tarea.materiales.length === 0 ? (
                      <SinDato>
                        {enEjecucion || sinEmpezar
                          ? 'Todavía no se registraron materiales.'
                          : 'En esta tarea no se usaron materiales.'}
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
                              <CTableRow key={material.codigo}>
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
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Herramientas a tu nombre</span>
                    {enEjecucion && (
                      <CButton color="primary" size="sm" onClick={() => abrir('tomar')}>
                        <CIcon icon={cilPlus} size="sm" className="me-1" />
                        Agregar
                      </CButton>
                    )}
                  </CCardHeader>
                  <CCardBody>
                    {herramientas.mias.length === 0 ? (
                      <SinDato>No tenés herramientas a tu nombre.</SinDato>
                    ) : (
                      <ul className="list-unstyled mb-0">
                        {herramientas.mias.map((herramienta) => (
                          <li
                            key={herramienta.codigo}
                            className="d-flex justify-content-between align-items-center gap-2 py-2 border-bottom"
                          >
                            <div>
                              <span className="fw-semibold">{herramienta.codigo}</span>
                              <span className="text-body-secondary"> — {herramienta.nombre}</span>
                              {herramienta.desde && (
                                <div className="text-body-secondary small">
                                  Desde el {formatearFecha(herramienta.desde)}
                                </div>
                              )}
                            </div>
                            <CButton
                              color="secondary"
                              variant="outline"
                              size="sm"
                              onClick={() => abrir(herramienta)}
                            >
                              Devolver
                            </CButton>
                          </li>
                        ))}
                      </ul>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>

          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/tareas" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>

      <CModal visible={ventana === 'iniciar'} onClose={cerrar} alignment="center">
        <CModalHeader>
          <CModalTitle>Iniciar la tarea</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <Aviso mensaje={errorVentana} />
          <p className="mb-0">
            La tarea pasa a <strong>En ejecución</strong>
            {tarea?.activo && (
              <>
                {' '}
                y el activo <strong>{tarea.activo.codigo}</strong> pasa a <strong>En mantenimiento</strong>
              </>
            )}
            .
          </p>
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto="Iniciar"
            textoProcesando="Iniciando..."
            procesando={procesando}
            alAceptar={confirmarInicio}
            alCancelar={cerrar}
          />
        </CModalFooter>
      </CModal>

      <CModal visible={ventana === 'finalizar'} onClose={cerrar} alignment="center">
        <CModalHeader>
          <CModalTitle>Finalizar la tarea</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <Aviso mensaje={errorVentana} />
          <p className="mb-0">
            La tarea pasa a <strong>Finalizada</strong>.
          </p>
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto="Finalizar"
            textoProcesando="Finalizando..."
            procesando={procesando}
            alAceptar={confirmarFinalizacion}
            alCancelar={cerrar}
          />
        </CModalFooter>
      </CModal>

      {ventana === 'material' && (
        <DialogoMaterial
          idOt={idOt}
          idTarea={idTarea}
          onCerrar={() => setVentana(null)}
          onGuardado={(datos) => {
            setTarea(datos);
            setVentana(null);
          }}
        />
      )}

      {(ventana === 'tomar' || (ventana && typeof ventana === 'object')) && (
        <DialogoHerramienta
          idOt={idOt}
          idTarea={idTarea}
          disponibles={herramientas.disponibles}
          aDevolver={typeof ventana === 'object' ? ventana : null}
          onCerrar={() => setVentana(null)}
          onGuardado={(datos) => {
            setHerramientas(datos);
            setVentana(null);
          }}
        />
      )}
    </>
  );
}
