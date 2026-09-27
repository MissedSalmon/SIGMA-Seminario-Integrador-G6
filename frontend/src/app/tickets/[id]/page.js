'use client';

/**
 * /tickets/5 - detalle completo de un ticket (HU-10).
 *
 * Muestra todo lo que se sabe del ticket: sus datos, el activo afectado y
 * donde esta, el area, quien lo registro, la foto si la hay y la orden de
 * trabajo si ya se genero. Cuando algo no existe (por ejemplo, si no tiene
 * foto) se dice con todas las letras, para que no quede la duda de si no
 * cargo.
 *
 * La excepcion es la orden de trabajo: ver ESTADOS_SIN_OT mas abajo.
 */
import { use, useEffect, useState } from 'react';
import { CButton, CCard, CCardBody, CCardHeader, CCol, CRow, CModal, CModalHeader, CModalTitle, CModalBody, CModalFooter, CFormTextarea, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilExternalLink, cilCheckAlt, cilX, cilPlus, cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import CampoLista from '@/componentes/formulario/CampoLista.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { obtenerTicket, validarTicket, rechazarTicket } from '@/servicios/tickets.js';
import { crearOrdenDesdeTicket } from '@/servicios/ordenesTrabajo.js';
import { obtenerActivo, actualizarActivo } from '@/servicios/activos.js';
import { formatearFechaHora } from '@/utils/fechas.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

/*
 * Los estados en los que no corresponde hablar todavia de la orden de trabajo.
 *
 *   Creado     el administrador todavia no decidio nada: no es que "falte" la
 *              OT, es que primero hay que validar el ticket.
 *   Rechazado  no va a haber ninguna OT, ni ahora ni nunca.
 *
 * En esos dos casos la tarjeta de la OT no se muestra. Decir "todavia no tiene
 * una OT generada" confundia mas de lo que informaba: daba a entender que
 * falta algo por cargar, cuando en realidad no corresponde que exista.
 */
const ESTADOS_SIN_OT = ['Creado', 'Rechazado'];

/*
 * Los estados de activo que el administrador puede poner a mano al validar.
 *
 * Son los mismos que ofrece la pantalla de activos, y los unicos que acepta la
 * API: en backend/src/servicios/activos.servicio.js, ESTADOS_MANUALES deja
 * pasar Operativo, Fuera de servicio y Retirado. "Retirado" no se ofrece aca
 * porque dar de baja un activo es otra cosa y tiene su propio boton en el
 * listado. "En mantenimiento" tampoco: hoy la API lo rechaza.
 *
 * No hay una opcion de "dejarlo como esta": al validar hay que decir en que
 * estado queda el activo, y se elige una de las dos. Arranca marcado el estado
 * que el activo ya tiene, asi que dejarlo igual es no tocar el desplegable.
 */
const ESTADOS_DE_ACTIVO = ['Operativo', 'Fuera de servicio'];

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
  const { mostrarToast } = useToast();

  const [ticket, setTicket] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  const [procesando, setProcesando] = useState(false);
  const [modalRechazoVisible, setModalRechazoVisible] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [errorRechazo, setErrorRechazo] = useState('');

  const [modalValidarVisible, setModalValidarVisible] = useState(false);
  const [estadoNuevoDelActivo, setEstadoNuevoDelActivo] = useState('');
  const [errorValidar, setErrorValidar] = useState('');

  const [creandoOT, setCreandoOT] = useState(false);

  const cargarTicket = () => {
    obtenerTicket(id)
      .then(setTicket)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarTicket();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function abrirModalValidar() {
    /*
     * Arranca marcado el estado que el activo tiene ahora, para que validar sin
     * tocar el desplegable no lo cambie por accidente. Si hoy esta en un estado
     * que no es ninguno de los dos ("En mantenimiento", por ejemplo), queda
     * marcado el primero y hay que elegir igual.
     */
    const estadoActual = ticket?.activo?.estado;
    setEstadoNuevoDelActivo(
      ESTADOS_DE_ACTIVO.includes(estadoActual) ? estadoActual : ESTADOS_DE_ACTIVO[0]
    );
    setErrorValidar('');
    setModalValidarVisible(true);
  }

  /*
   * Validar el ticket y, si se pidio, cambiar el estado del activo.
   *
   * El orden importa: primero se valida el ticket, que es lo que se vino a
   * hacer. Si despues falla el cambio de estado del activo, el ticket igual
   * quedo validado y se avisa aparte que el activo no se pudo actualizar. Al
   * reves seria peor: dejaria el activo tocado y el ticket sin validar.
   */
  async function handleValidar() {
    setProcesando(true);
    setError('');
    setErrorValidar('');

    try {
      await validarTicket(id);
    } catch (err) {
      setErrorValidar(err.message);
      setProcesando(false);
      return;
    }

    let avisoDelActivo = '';

    // Si se deja el estado que ya tenia, no se molesta a la API al pedo.
    if (estadoNuevoDelActivo && estadoNuevoDelActivo !== ticket.activo?.estado) {
      try {
        await cambiarEstadoDelActivo(ticket.codigoActivo, estadoNuevoDelActivo);
        avisoDelActivo = ` El activo ${ticket.codigoActivo} quedó como ${estadoNuevoDelActivo}.`;
      } catch (err) {
        avisoDelActivo = '';
        setError(
          `El ticket se validó, pero no se pudo cambiar el estado del activo ${ticket.codigoActivo}: ${err.message}`
        );
      }
    }

    mostrarToast({ tipo: 'exito', mensaje: `El ticket se validó correctamente.${avisoDelActivo}` });
    setModalValidarVisible(false);
    setProcesando(false);
    cargarTicket();
  }

  /*
   * La API de activos pide el tipo y el espacio aunque solo se cambie el
   * estado, asi que primero se lee el activo y se le devuelven esos dos datos
   * tal cual estaban. La fecha de alta no se manda: el backend deja la que ya
   * tenia, y asi no se arriesga nada al convertirla de ida y de vuelta.
   */
  async function cambiarEstadoDelActivo(codigo, estado) {
    const activo = await obtenerActivo(codigo);

    await actualizarActivo(codigo, {
      idTipoActivo: activo.idTipoActivo,
      espacio_id: activo.espacio_id,
      estado,
    });
  }

  async function handleRechazar() {
    if (!motivoRechazo.trim()) {
      setErrorRechazo('Debes indicar un motivo de rechazo.');
      return;
    }
    setProcesando(true);
    setErrorRechazo('');
    try {
      await rechazarTicket(id, motivoRechazo);
      mostrarToast({ tipo: 'exito', mensaje: 'El ticket ha sido rechazado.' });
      setModalRechazoVisible(false);
      cargarTicket();
    } catch (err) {
      setErrorRechazo(err.message);
    } finally {
      setProcesando(false);
    }
  }

  /*
   * Genera la OT a mano (HU-14).
   *
   * Normalmente no hace falta: la OT se crea sola al validar el ticket. Este
   * boton es el respaldo para el ticket que quedo validado sin OT, por ejemplo
   * si ese paso fallo.
   */
  async function handleCrearOT() {
    setCreandoOT(true);
    setError('');

    try {
      const orden = await crearOrdenDesdeTicket(ticket.id);
      mostrarToast({ tipo: 'exito', mensaje: `Se generó la orden de trabajo #${orden.id}.` });
      cargarTicket();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCreandoOT(false);
    }
  }

  function abrirModalRechazo() {
    setMotivoRechazo('');
    setErrorRechazo('');
    setModalRechazoVisible(true);
  }

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
          <>
            <CRow className="g-4">
              <CCol lg={7}>
                <CCard className="mb-4">
                  <CCardHeader className="d-flex justify-content-between align-items-center">
                    <span className="fw-semibold">Datos generales</span>
                    {ticket.estado === 'Creado' && (
                      <div className="d-flex gap-2">
                        <CButton color="danger" variant="outline" size="sm" onClick={abrirModalRechazo} disabled={procesando}>
                          <CIcon icon={cilX} className="me-1" />
                          Rechazar
                        </CButton>
                        <CButton color="success" className="text-white" size="sm" onClick={abrirModalValidar} disabled={procesando}>
                          <CIcon icon={cilCheckAlt} className="me-1" />
                          {procesando ? 'Procesando...' : 'Validar'}
                        </CButton>
                      </div>
                    )}
                  </CCardHeader>
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
                    {ticket.estado === 'Rechazado' && ticket.motivoRechazo && (
                      <div className="mt-3 p-3 bg-danger bg-opacity-10 border border-danger rounded">
                        <div className="text-danger fw-semibold small mb-1">Motivo del rechazo</div>
                        <div className="text-danger" style={{ whiteSpace: 'pre-wrap' }}>{ticket.motivoRechazo}</div>
                      </div>
                    )}
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

                {(ticket.ot || !ESTADOS_SIN_OT.includes(ticket.estado)) && (
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
                          <CCol sm={12}>
                            <BotonEnlace
                              href={`/ordenes-trabajo/${ticket.ot.id}`}
                              color="secondary"
                              variante="outline"
                              tamano="sm"
                              title="Ver la orden de trabajo y planificar sus tareas"
                            >
                              <CIcon icon={cilDescription} size="sm" className="me-1" />
                              Ver la orden de trabajo
                            </BotonEnlace>
                          </CCol>
                        </CRow>
                      ) : (
                        <>
                          <p className="mb-1 fw-semibold">Este ticket todavía no tiene una OT generada.</p>

                          {/*
                            La OT sale de un ticket validado y de ninguno mas. Si el
                            ticket ya avanzo (asignado, en ejecucion, cerrado) y no
                            tiene OT, es que algo quedo mal de antes: se arregla a
                            mano, no generando una OT nueva.
                          */}
                          {ticket.estado === 'Validado' ? (
                            <>
                              <p className="text-body-secondary small">
                                La orden de trabajo se genera automáticamente al validar el ticket. Si
                                este quedó validado sin OT, se puede generar ahora.
                              </p>
                              <CButton color="primary" size="sm" onClick={handleCrearOT} disabled={creandoOT}>
                                <CIcon icon={cilPlus} size="sm" className="me-1" />
                                {creandoOT ? 'Creando...' : 'Crear OT'}
                              </CButton>
                            </>
                          ) : (
                            <p className="text-body-secondary small mb-0">
                              La orden de trabajo sólo se puede generar cuando el ticket está validado.
                            </p>
                          )}
                        </>
                      )}
                    </CCardBody>
                  </CCard>
                )}
              </CCol>
            </CRow>

            <CModal visible={modalValidarVisible} onClose={() => setModalValidarVisible(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Validar ticket</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <Aviso mensaje={errorValidar} color="danger" />

                <p>
                  Se va a validar el ticket <strong>#{ticket.id}</strong> y se va a generar la orden
                  de trabajo.
                </p>

                <div className="mb-2">
                  <CampoLista
                    id="estadoNuevoDelActivo"
                    etiqueta={`Estado del activo ${ticket.codigoActivo}`}
                    valor={estadoNuevoDelActivo}
                    alCambiar={setEstadoNuevoDelActivo}
                    opciones={ESTADOS_DE_ACTIVO.map((estado) => ({ valor: estado, texto: estado }))}
                    obligatorio
                    ancho={18}
                  />
                </div>
              </CModalBody>
              <CModalFooter>
                <CButton
                  color="secondary"
                  variant="outline"
                  onClick={() => setModalValidarVisible(false)}
                  disabled={procesando}
                >
                  Cancelar
                </CButton>
                <CButton color="success" className="text-white" onClick={handleValidar} disabled={procesando}>
                  {procesando ? 'Validando...' : 'Validar ticket'}
                </CButton>
              </CModalFooter>
            </CModal>

            <CModal visible={modalRechazoVisible} onClose={() => setModalRechazoVisible(false)} alignment="center">
              <CModalHeader>
                <CModalTitle>Rechazar Ticket</CModalTitle>
              </CModalHeader>
              <CModalBody>
                <Aviso mensaje={errorRechazo} color="danger" />
                <div className="mb-3">
                  <CFormLabel htmlFor="motivoRechazo" className="sigma-obligatorio">Motivo del rechazo</CFormLabel>
                  <CFormTextarea
                    id="motivoRechazo"
                    rows={4}
                    value={motivoRechazo}
                    onChange={(e) => setMotivoRechazo(e.target.value)}
                    placeholder="Escribe aquí el motivo por el cual se rechaza el ticket..."
                  />
                </div>
              </CModalBody>
              <CModalFooter>
                <CButton color="secondary" variant="outline" onClick={() => setModalRechazoVisible(false)} disabled={procesando}>
                  Cancelar
                </CButton>
                <CButton color="danger" onClick={handleRechazar} disabled={procesando}>
                  {procesando ? 'Rechazando...' : 'Confirmar Rechazo'}
                </CButton>
              </CModalFooter>
            </CModal>
          </>
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
