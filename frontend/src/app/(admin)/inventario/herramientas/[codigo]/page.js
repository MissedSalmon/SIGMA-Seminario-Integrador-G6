'use client';

import { use, useEffect, useState } from 'react';
import {
  CButton,
  CButtonGroup,
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

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Dato from '@/componentes/Dato.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import DialogoAsignacion from '@/componentes/inventario/DialogoAsignacion.js';
import DialogoIngresoHerramienta from '@/componentes/inventario/DialogoIngresoHerramienta.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  eliminarItem,
  listarAsignaciones,
  listarMovimientos,
  obtenerItem,
  ponerEnServicio,
} from '@/servicios/inventario.js';
import { formatearFechaHora, soloFechaLegible } from '@/utils/fechas.js';

function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaFichaHerramienta({ params }) {
  const { codigo } = use(params);
  const codigoModelo = decodeURIComponent(codigo);
  const { mostrarToast } = useToast();
  const [modelo, setModelo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [historialActivo, setHistorialActivo] = useState({ codigo: null, asignaciones: [] });
  const [historialSeleccionado, setHistorialSeleccionado] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [asignando, setAsignando] = useState(null);
  const [ingresoManual, setIngresoManual] = useState(false);
  const [unidadParaCambiar, setUnidadParaCambiar] = useState(null);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    async function cargar() {
      try {
        const [ficha, historialIngresos] = await Promise.all([obtenerItem(codigoModelo), listarMovimientos(codigoModelo)]);
        setModelo(ficha);
        setMovimientos(historialIngresos);
      } catch (fallo) {
        setError(fallo.message);
      } finally {
        setCargando(false);
      }
    }
    cargar();
  }, [codigoModelo, recarga]);

  useEffect(() => {
    if (!historialSeleccionado) return;
    listarAsignaciones(historialSeleccionado)
      .then((asignaciones) => setHistorialActivo({ codigo: historialSeleccionado, asignaciones }))
      .catch((fallo) => setError(fallo.message))
  }, [historialSeleccionado, recarga]);

  async function cambiarEstado(unidad) {
    setCambiandoEstado(true);
    try {
      if (unidad.estado === 'Disponible') {
        await eliminarItem(unidad.codigo);
        mostrarToast({ tipo: 'exito', mensaje: `La unidad ${unidad.codigo} quedó fuera de servicio.` });
      } else {
        await ponerEnServicio(unidad.codigo);
        mostrarToast({ tipo: 'exito', mensaje: `La unidad ${unidad.codigo} volvió a estar disponible.` });
      }
      setRecarga((valor) => valor + 1);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setUnidadParaCambiar(null);
      setCambiandoEstado(false);
    }
  }

  function unidadGuardada() {
    setAsignando(null);
    setRecarga((valor) => valor + 1);
  }

  function ingresoGuardado() {
    setIngresoManual(false);
    setRecarga((valor) => valor + 1);
  }

  const unidades = modelo?.unidades ?? [];
  const historialCargando = historialActivo.codigo !== historialSeleccionado;
  return (
    <>
      <EncabezadoPagina
        titulo={modelo?.nombre ?? 'Detalle de herramienta'}
        descripcion={modelo ? `${modelo.codigo} — ${modelo.nombreTipo || 'Sin categoría'}` : undefined}
        accionesExtra={
          modelo && (
            <div className="d-flex flex-wrap gap-2">
              <BotonEnlace
                href={`/inventario/herramientas/${encodeURIComponent(modelo.codigo)}/editar`}
                color="secondary"
                variante="outline"
              >
                Editar modelo
              </BotonEnlace>
              <CButton
                color="primary"
                onClick={() => setIngresoManual(true)}
                title="Agregar unidades mediante un ingreso manual"
              >
                Agregar
              </CButton>
            </div>
          )
        }
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando el modelo..." />
      ) : (
        modelo && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Existencias del modelo</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}><Dato etiqueta="Disponibles">{modelo.stockActual}</Dato></CCol>
                  <CCol sm={6} lg={3}><Dato etiqueta="En uso">{modelo.cantidadEnUso}</Dato></CCol>
                  <CCol sm={6} lg={3}><Dato etiqueta="Fuera de servicio">{modelo.cantidadFueraDeServicio}</Dato></CCol>
                  <CCol sm={6} lg={3}><Dato etiqueta="Unidades registradas">{modelo.cantidadTotal}</Dato></CCol>
                  <CCol sm={12}><Dato etiqueta="Descripción">{modelo.descripcion || <SinDato>Sin descripción.</SinDato>}</Dato></CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Unidades</CCardHeader>
              <CCardBody>
                {unidades.length === 0 ? (
                  <SinDatos texto="Todavía no hay unidades de este modelo. Registrá un ingreso manual o cargá un remito." />
                ) : (
                  <div className="table-responsive">
                    <CTable hover align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Número de serie o inventario</CTableHeaderCell>
                          <CTableHeaderCell>Estado</CTableHeaderCell>
                          <CTableHeaderCell>Técnico</CTableHeaderCell>
                          <CTableHeaderCell>Fecha de alta</CTableHeaderCell>
                          <CTableHeaderCell>Origen</CTableHeaderCell>
                          <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {unidades.map((unidad) => (
                          <CTableRow key={unidad.codigo}>
                            <CTableDataCell className="fw-semibold">{unidad.codigo}</CTableDataCell>
                            <CTableDataCell>{unidad.estado}</CTableDataCell>
                            <CTableDataCell>{unidad.tecnico || '-'}</CTableDataCell>
                            <CTableDataCell>
                              {unidad.fechaAlta ? soloFechaLegible(unidad.fechaAlta) : <SinDato>Sin registrar</SinDato>}
                            </CTableDataCell>
                            <CTableDataCell>
                              {unidad.idRemito ? (
                                <BotonEnlace href={`/inventario/remitos/${unidad.idRemito}`} color="secondary" variante="ghost" tamano="sm">
                                  Remito #{unidad.idRemito}
                                </BotonEnlace>
                              ) : unidad.fechaAlta ? (
                                <span>Ingreso manual</span>
                              ) : (
                                <SinDato>Sin registrar</SinDato>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-end">
                              <CButtonGroup size="sm">
                                <CButton
                                  color="secondary"
                                  variant="outline"
                                  onClick={() => {
                                    setHistorialSeleccionado((actual) => actual === unidad.codigo ? '' : unidad.codigo);
                                  }}
                                >
                                  Historial
                                </CButton>
                                {unidad.estado !== 'Fuera de servicio' && (
                                  <CButton color="secondary" variant="outline" onClick={() => setAsignando(unidad)}>
                                    {unidad.legajoTecnico ? 'Devolver' : 'Asignar'}
                                  </CButton>
                                )}
                                {unidad.estado === 'Disponible' && (
                                  <CButton color="secondary" variant="outline" onClick={() => setUnidadParaCambiar(unidad)}>
                                    Dar de baja
                                  </CButton>
                                )}
                                {unidad.estado === 'Fuera de servicio' && (
                                  <CButton color="secondary" variant="outline" onClick={() => setUnidadParaCambiar(unidad)}>
                                    Poner en servicio
                                  </CButton>
                                )}
                              </CButtonGroup>
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </CCardBody>
            </CCard>

            {historialSeleccionado && (
              <CCard className="mb-4">
                <CCardHeader className="d-flex justify-content-between align-items-center fw-semibold">
                  Historial de asignaciones — {historialSeleccionado}
                  <CButton size="sm" color="secondary" variant="ghost" onClick={() => setHistorialSeleccionado('')}>
                    Cerrar
                  </CButton>
                </CCardHeader>
                <CCardBody>
                  {historialCargando ? (
                    <Cargando texto="Cargando el historial..." />
                  ) : historialActivo.asignaciones.length === 0 ? (
                    <SinDatos texto="Esta unidad todavía no fue asignada." />
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
                          {historialActivo.asignaciones.map((fila) => (
                            <CTableRow key={`${fila.legajo}-${fila.desde}`}>
                              <CTableDataCell>{fila.tecnico ?? fila.legajo} — legajo {fila.legajo}</CTableDataCell>
                              <CTableDataCell>{formatearFechaHora(fila.desde)}</CTableDataCell>
                              <CTableDataCell>{fila.hasta ? formatearFechaHora(fila.hasta) : 'En uso'}</CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    </div>
                  )}
                </CCardBody>
              </CCard>
            )}

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Historial de ingresos</CCardHeader>
              <CCardBody>
                {movimientos.length === 0 ? (
                  <SinDatos texto="Todavía no hay ingresos registrados para este modelo." />
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
                            <CTableDataCell>{soloFechaLegible(movimiento.fecha)}</CTableDataCell>
                            <CTableDataCell>{movimiento.tipo}</CTableDataCell>
                            <CTableDataCell>+{movimiento.cantidad}</CTableDataCell>
                            <CTableDataCell>
                              {movimiento.idRemito ? (
                                <BotonEnlace href={`/inventario/remitos/${movimiento.idRemito}`} color="secondary" variante="ghost" tamano="sm">
                                  Remito #{movimiento.idRemito} — {movimiento.proveedor}
                                </BotonEnlace>
                              ) : <SinDato>Sin comprobante</SinDato>}
                            </CTableDataCell>
                            <CTableDataCell>{movimiento.usuario ?? <SinDato>Sin registrar</SinDato>}</CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                )}
              </CCardBody>
            </CCard>

            <BotonEnlace href="/inventario/herramientas" color="secondary" variante="outline">
              Volver al listado
            </BotonEnlace>
          </>
        )
      )}

      {asignando && (
        <DialogoAsignacion herramienta={asignando} onCerrar={() => setAsignando(null)} onGuardado={unidadGuardada} />
      )}
      {ingresoManual && (
        <DialogoIngresoHerramienta modelo={modelo} onCerrar={() => setIngresoManual(false)} onGuardado={ingresoGuardado} />
      )}

      <CModal
        visible={Boolean(unidadParaCambiar)}
        onClose={() => !cambiandoEstado && setUnidadParaCambiar(null)}
        alignment="center"
      >
        <CModalHeader>
          <CModalTitle>{unidadParaCambiar?.estado === 'Disponible' ? 'Dar de baja' : 'Poner en servicio'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">
            La unidad <strong>{unidadParaCambiar?.codigo}</strong> {unidadParaCambiar?.estado === 'Disponible'
              ? 'quedará fuera de servicio.'
              : 'volverá a estar disponible.'}
          </p>
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto={unidadParaCambiar?.estado === 'Disponible' ? 'Dar de baja' : 'Poner en servicio'}
            textoProcesando={unidadParaCambiar?.estado === 'Disponible' ? 'Dando de baja...' : 'Actualizando...'}
            procesando={cambiandoEstado}
            alAceptar={() => cambiarEstado(unidadParaCambiar)}
            alCancelar={() => setUnidadParaCambiar(null)}
          />
        </CModalFooter>
      </CModal>
    </>
  );
}
