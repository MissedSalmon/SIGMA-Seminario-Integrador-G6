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
import { cilActionUndo, cilArrowLeft, cilCheckCircle, cilPencil, cilTrash, cilUserFollow } from '@coreui/icons';

import Dato from '@/componentes/Dato.js';
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
              <CDropdown placement="bottom-end">
                <CDropdownToggle color="secondary" variant="outline">
                  Opciones
                </CDropdownToggle>
                <CDropdownMenu className="shadow-sm border" style={{ minWidth: '14rem' }}>
                  {/* Fuera de servicio no se asigna: lo que se puede hacer es volver a ponerla en servicio. */}
                  {item.estado === 'Fuera de servicio' ? (
                    <CDropdownItem
                      as="button"
                      className="d-flex align-items-center gap-2 py-2"
                      onClick={() => setCambioEstado('servicio')}
                    >
                      <CIcon icon={cilCheckCircle} />
                      Poner en servicio
                    </CDropdownItem>
                  ) : (
                    <CDropdownItem
                      as="button"
                      className="d-flex align-items-center gap-2 py-2"
                      onClick={() => setAsignando(true)}
                    >
                      <CIcon icon={item.legajoTecnico ? cilActionUndo : cilUserFollow} />
                      {item.legajoTecnico ? 'Registrar la devolución' : 'Asignar a un técnico'}
                    </CDropdownItem>
                  )}
                  {/* Sólo una disponible: si la tiene un técnico, primero se devuelve. */}
                  {item.estado === 'Disponible' && (
                    <>
                      <CDropdownDivider className="my-1" />
                      <CDropdownItem
                        as="button"
                        className="d-flex align-items-center gap-2 py-2 text-danger"
                        onClick={() => setCambioEstado('fuera')}
                      >
                        <CIcon icon={cilTrash} />
                        Dar de baja
                      </CDropdownItem>
                    </>
                  )}
                </CDropdownMenu>
              </CDropdown>
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
      </div>

      <CModal
        visible={Boolean(cambioEstado)}
        onClose={() => !cambiandoEstado && setCambioEstado(null)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>
            {cambioEstado === 'fuera' ? 'Dar de baja' : 'Poner en servicio'}
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
            texto={cambioEstado === 'fuera' ? 'Dar de baja' : 'Poner en servicio'}
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
