'use client';

/**
 * /inventario/herramientas/TO-201 - la ficha de una herramienta (HU-16).
 *
 * Sus datos (estado y a que tecnico esta asignada) y, debajo, dos historiales:
 *   - el de asignaciones: que tecnico la tuvo, desde cuando y hasta cuando;
 *   - el de ingresos: cada renglon viene de un remito.
 * Van separados porque cuentan cosas distintas: una asignacion o una
 * devolucion no cambian ningun numero del deposito.
 *
 * Desde aca tambien se asigna a un tecnico o se registra la devolucion
 * (devolucion del Sprint 3). Y se cambia su estado: una disponible se pone
 * fuera de servicio, y una fuera de servicio se vuelve a poner en servicio
 * (por ejemplo, despues de repararla).
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
import { cilActionUndo, cilArrowLeft, cilBan, cilCheckCircle, cilPencil, cilUserFollow } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import DialogoAsignacion from '@/componentes/inventario/DialogoAsignacion.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  eliminarItem,
  listarAsignaciones,
  listarMovimientos,
  obtenerItem,
  ponerEnServicio,
} from '@/servicios/inventario.js';
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

export default function PantallaFichaItem({ params }) {
  const { codigo } = use(params);

  // El codigo viaja en la direccion, asi que puede venir escapado ("AC%2D014").
  const codigoItem = decodeURIComponent(codigo);

  const [item, setItem] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [asignaciones, setAsignaciones] = useState([]);
  const [asignando, setAsignando] = useState(false);
  // El cambio de estado que se esta confirmando: 'fuera' (ponerla fuera de
  // servicio), 'servicio' (volver a ponerla en servicio) o null.
  const [cambioEstado, setCambioEstado] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [recarga, setRecarga] = useState(0);
  const { mostrarToast } = useToast();

  async function confirmarCambioEstado() {
    setCambiandoEstado(true);
    try {
      if (cambioEstado === 'fuera') {
        // La baja de una herramienta no la borra: la pasa a Fuera de servicio.
        await eliminarItem(item.codigo);
        mostrarToast({ tipo: 'exito', mensaje: `"${item.nombre}" quedó fuera de servicio.` });
      } else {
        await ponerEnServicio(item.codigo);
        mostrarToast({ tipo: 'exito', mensaje: `"${item.nombre}" volvió a estar en servicio.` });
      }
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCambioEstado(null);
      setCambiandoEstado(false);
    }
  }

  useEffect(() => {
    Promise.all([obtenerItem(codigoItem), listarMovimientos(codigoItem), listarAsignaciones(codigoItem)])
      .then(([ficha, historial, prestamos]) => {
        setItem(ficha);
        setMovimientos(historial);
        setAsignaciones(prestamos);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoItem, recarga]);

  return (
    <>
      {/* Las acciones de la ficha van arriba a la derecha, como en el resto de las pantallas. */}
      <EncabezadoPagina
        titulo={item ? item.nombre : 'Ficha del ítem'}
        descripcion={item ? `${item.codigo} — ${item.clase}` : undefined}
        accionesExtra={
          item && (
            <>
              <BotonEnlace
                href={`/inventario/herramientas/${encodeURIComponent(item.codigo)}/editar`}
                color="secondary"
                variante="outline"
              >
                <CIcon icon={cilPencil} className="me-2" />
                Editar
              </BotonEnlace>
              {/*
                Una herramienta fuera de servicio no se asigna: lo que se puede
                hacer es volver a ponerla en servicio.
              */}
              {item.estado === 'Fuera de servicio' ? (
                <CButton color="secondary" variant="outline" onClick={() => setCambioEstado('servicio')}>
                  <CIcon icon={cilCheckCircle} className="me-2" />
                  Poner en servicio
                </CButton>
              ) : (
                <CButton color="secondary" variant="outline" onClick={() => setAsignando(true)}>
                  <CIcon icon={item.legajoTecnico ? cilActionUndo : cilUserFollow} className="me-2" />
                  {item.legajoTecnico ? 'Registrar la devolución' : 'Asignar a un técnico'}
                </CButton>
              )}
            </>
          )
        }
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el ítem..." />
      ) : (
        item && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Datos del ítem</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Código">
                      <span className="fw-semibold">{item.codigo}</span>
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Clase">{item.clase}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Tipo">
                      {item.nombreTipo || <SinDato>Sin tipo</SinDato>}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Estado">{item.estado}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Asignada a">
                      {item.tecnico ? (
                        <>
                          {item.tecnico}
                          {item.asignadaDesde && (
                            <span className="text-body-secondary small">
                              {' '}
                              desde el {soloFechaLegible(item.asignadaDesde)}
                            </span>
                          )}
                        </>
                      ) : (
                        <SinDato>Nadie</SinDato>
                      )}
                    </Dato>
                  </CCol>

                  <CCol sm={12}>
                    <Dato etiqueta="Descripción">
                      {item.descripcion || <SinDato>Sin descripción.</SinDato>}
                    </Dato>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Historial de asignaciones</CCardHeader>
              <CCardBody>
                {asignaciones.length === 0 ? (
                  <SinDatos texto="Todavía no se le asignó a ningún técnico." />
                ) : (
                  <div className="table-responsive">
                    <CTable hover align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Técnico</CTableHeaderCell>
                          <CTableHeaderCell>Asignada</CTableHeaderCell>
                          <CTableHeaderCell>Devuelta</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {asignaciones.map((asignacion) => (
                          <CTableRow key={`${asignacion.legajo}-${asignacion.desde}`}>
                            <CTableDataCell>
                              <span className="fw-semibold">{asignacion.tecnico ?? asignacion.legajo}</span>
                              <span className="text-body-secondary"> — legajo {asignacion.legajo}</span>
                            </CTableDataCell>
                            <CTableDataCell>{formatearFechaHora(asignacion.desde)}</CTableDataCell>
                            <CTableDataCell>
                              {asignacion.hasta ? (
                                formatearFechaHora(asignacion.hasta)
                              ) : (
                                <SinDato>En uso</SinDato>
                              )}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Historial de ingresos</CCardHeader>
              <CCardBody>
                {movimientos.length === 0 ? (
                  <SinDatos texto="Todavía no hay ingresos registrados para esta herramienta." />
                ) : (
                  <div className="table-responsive">
                    <CTable hover align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Fecha</CTableHeaderCell>
                          <CTableHeaderCell>Tipo</CTableHeaderCell>
                          <CTableHeaderCell>Cantidad</CTableHeaderCell>
                          <CTableHeaderCell>Origen</CTableHeaderCell>
                          <CTableHeaderCell>Registrado por</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {movimientos.map((movimiento) => (
                          <CTableRow key={movimiento.id}>
                            <CTableDataCell>
                              <span className="fw-semibold">
                                {soloFechaLegible(movimiento.fecha)}
                              </span>
                            </CTableDataCell>
                            <CTableDataCell>
                              <span className="text-body-secondary">{movimiento.tipo}</span>
                            </CTableDataCell>
                            <CTableDataCell>
                              {/*
                                El signo dice para donde fue el stock. No es un
                                color: es el mismo texto gris que el resto.
                              */}
                              <span className="text-body-secondary">
                                {movimiento.tipo === 'Ingreso' ? '+' : '−'}
                                {movimiento.cantidad}
                              </span>
                            </CTableDataCell>
                            <CTableDataCell>
                              {movimiento.idRemito ? (
                                <BotonEnlace
                                  href={`/inventario/remitos/${movimiento.idRemito}`}
                                  color="secondary"
                                  variante="ghost"
                                  tamano="sm"
                                  className="p-0"
                                >
                                  Remito #{movimiento.idRemito}
                                  {movimiento.proveedor && ` — ${movimiento.proveedor}`}
                                </BotonEnlace>
                              ) : (
                                <SinDato>Consumo en una tarea</SinDato>
                              )}
                            </CTableDataCell>
                            <CTableDataCell>
                              {movimiento.usuario ?? <SinDato>Sin registrar</SinDato>}
                            </CTableDataCell>
                          </CTableRow>
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

      <div className="d-flex flex-wrap align-items-center gap-2 mt-2 mb-4">
        <BotonEnlace href="/inventario/herramientas" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>

        {/*
          Ponerla fuera de servicio es la accion delicada de la ficha: va abajo,
          contra el borde derecho y sin borde, lejos de las de todos los dias.
          Solo una disponible: si la tiene un tecnico, primero se devuelve.
        */}
        {item?.estado === 'Disponible' && (
          <CButton
            color="danger"
            variant="ghost"
            size="sm"
            className="ms-auto"
            onClick={() => setCambioEstado('fuera')}
          >
            <CIcon icon={cilBan} size="sm" className="me-1" />
            Poner fuera de servicio
          </CButton>
        )}
      </div>

      <CModal
        visible={Boolean(cambioEstado)}
        onClose={() => !cambiandoEstado && setCambioEstado(null)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            {cambioEstado === 'fuera' ? 'Poner fuera de servicio' : 'Poner en servicio'}
          </CModalTitle>
        </CModalHeader>
        <CModalBody>
          {cambioEstado === 'fuera' ? (
            <p className="mb-0">
              <strong>{item?.nombre}</strong> ({item?.codigo}) pasa a estado{' '}
              <strong>Fuera de servicio</strong> y ya no se puede asignar.
            </p>
          ) : (
            <p className="mb-0">
              <strong>{item?.nombre}</strong> ({item?.codigo}) vuelve a estar{' '}
              <strong>Disponible</strong> y se puede asignar otra vez a un técnico.
            </p>
          )}
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto={cambioEstado === 'fuera' ? 'Poner fuera de servicio' : 'Poner en servicio'}
            textoProcesando="Guardando..."
            color={cambioEstado === 'fuera' ? 'danger' : 'primary'}
            procesando={cambiandoEstado}
            alAceptar={confirmarCambioEstado}
            alCancelar={() => setCambioEstado(null)}
          />
        </CModalFooter>
      </CModal>

      {asignando && (
        <DialogoAsignacion
          herramienta={item}
          onCerrar={() => setAsignando(false)}
          onGuardado={() => {
            setAsignando(false);
            setRecarga((numero) => numero + 1);
          }}
        />
      )}
    </>
  );
}
