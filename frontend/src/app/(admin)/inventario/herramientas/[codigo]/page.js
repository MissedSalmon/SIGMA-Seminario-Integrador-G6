'use client';

import { use, useEffect, useState } from 'react';
import {
  CButton,
  CButtonGroup,
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
import { cilArrowLeft, cilDescription, cilPencil, cilPlus, cilTrash } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Dato from '@/componentes/Dato.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import DialogoIngresoHerramienta from '@/componentes/inventario/DialogoIngresoHerramienta.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarItem, listarMovimientos, obtenerItem } from '@/servicios/inventario.js';
import { soloFechaLegible } from '@/utils/fechas.js';

function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaFichaHerramienta({ params }) {
  const { codigo } = use(params);
  const codigoModelo = decodeURIComponent(codigo);
  const { mostrarToast } = useToast();
  const [modelo, setModelo] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [ingresoManual, setIngresoManual] = useState(false);
  const [unidadADarDeBaja, setUnidadADarDeBaja] = useState(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
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

  async function darDeBaja() {
    setDandoDeBaja(true);
    try {
      await eliminarItem(unidadADarDeBaja.codigo);
      mostrarToast({ tipo: 'exito', mensaje: `La herramienta ${unidadADarDeBaja.codigo} quedó fuera de servicio.` });
      setRecarga((valor) => valor + 1);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setUnidadADarDeBaja(null);
      setDandoDeBaja(false);
    }
  }

  function ingresoGuardado() {
    setIngresoManual(false);
    setRecarga((valor) => valor + 1);
  }

  const unidades = modelo?.unidades ?? [];
  return (
    <>
      <EncabezadoPagina
        titulo={modelo?.nombre ?? 'Detalle de herramienta'}
        accionesExtra={
          modelo && (
            <>
              <BotonEnlace
                href={`/inventario/herramientas/${encodeURIComponent(modelo.codigo)}/editar`}
                color="secondary"
                variante="outline"
              >
                <CIcon icon={cilPencil} className="me-2" />
                Editar
              </BotonEnlace>
              <CButton color="primary" onClick={() => setIngresoManual(true)}>
                <CIcon icon={cilPlus} className="me-2" />
                Agregar
              </CButton>
            </>
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
              <CCardHeader className="fw-semibold">Datos del modelo</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Código del modelo">
                      <span className="fw-semibold text-nowrap">{modelo.codigo}</span>
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Categoría">{modelo.nombreTipo || <SinDato>Sin categoría</SinDato>}</Dato>
                  </CCol>
                  <CCol sm={12} lg={6}>
                    <Dato etiqueta="Descripción">{modelo.descripcion || <SinDato>Sin descripción.</SinDato>}</Dato>
                  </CCol>
                  <CCol xs={6} lg={3}><Dato etiqueta="Disponibles">{modelo.stockActual}</Dato></CCol>
                  <CCol xs={6} lg={3}><Dato etiqueta="En uso">{modelo.cantidadEnUso}</Dato></CCol>
                  <CCol xs={6} lg={3}><Dato etiqueta="Fuera de servicio">{modelo.cantidadFueraDeServicio}</Dato></CCol>
                  <CCol xs={6} lg={3}><Dato etiqueta="Unidades registradas">{modelo.cantidadTotal}</Dato></CCol>
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
                          <CTableHeaderCell>Código</CTableHeaderCell>
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
                            <CTableDataCell className="fw-semibold text-nowrap">{unidad.codigo}</CTableDataCell>
                            <CTableDataCell className="text-nowrap">{unidad.estado}</CTableDataCell>
                            <CTableDataCell>{unidad.tecnico || '-'}</CTableDataCell>
                            <CTableDataCell className="text-nowrap">
                              {unidad.fechaAlta ? soloFechaLegible(unidad.fechaAlta) : <SinDato>Sin registrar</SinDato>}
                            </CTableDataCell>
                            <CTableDataCell>
                              {unidad.idRemito ? (
                                <BotonEnlace
                                  href={`/inventario/remitos/${unidad.idRemito}`}
                                  color="secondary"
                                  variante="ghost"
                                  className="p-0 text-nowrap"
                                >
                                  Remito #{unidad.idRemito}
                                </BotonEnlace>
                              ) : unidad.fechaAlta ? (
                                <span className="text-nowrap">Ingreso manual</span>
                              ) : (
                                <SinDato>Sin registrar</SinDato>
                              )}
                            </CTableDataCell>
                            <CTableDataCell className="text-end text-nowrap">
                              <CButtonGroup size="sm">
                                <BotonEnlace
                                  href={`/inventario/herramientas/${encodeURIComponent(modelo.codigo)}/${encodeURIComponent(unidad.codigo)}`}
                                  variante="ghost"
                                  className="btn-icono"
                                  title={`Ver detalle de ${unidad.codigo}`}
                                >
                                  <CIcon icon={cilDescription} />
                                </BotonEnlace>
                                {/* Sólo se da de baja una disponible; el hueco mantiene alineada la columna. */}
                                {unidad.estado === 'Disponible' ? (
                                  <CButton
                                    variant="ghost"
                                    color="danger"
                                    className="btn-icono"
                                    onClick={() => setUnidadADarDeBaja(unidad)}
                                    title={`Dar de baja ${unidad.codigo}`}
                                    aria-label={`Dar de baja ${unidad.codigo}`}
                                  >
                                    <CIcon icon={cilTrash} />
                                  </CButton>
                                ) : (
                                  <span className="btn-icono" aria-hidden="true" />
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
                            <CTableDataCell className="text-nowrap">{soloFechaLegible(movimiento.fecha)}</CTableDataCell>
                            <CTableDataCell>{movimiento.tipo}</CTableDataCell>
                            <CTableDataCell>+{movimiento.cantidad}</CTableDataCell>
                            <CTableDataCell>
                              {movimiento.idRemito ? (
                                <BotonEnlace
                                  href={`/inventario/remitos/${movimiento.idRemito}`}
                                  color="secondary"
                                  variante="ghost"
                                  className="p-0 text-nowrap"
                                >
                                  Remito #{movimiento.idRemito} ({movimiento.proveedor})
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
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/inventario/herramientas" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>

      {ingresoManual && (
        <DialogoIngresoHerramienta modelo={modelo} onCerrar={() => setIngresoManual(false)} onGuardado={ingresoGuardado} />
      )}

      <DialogoEliminar
        visible={Boolean(unidadADarDeBaja)}
        titulo="Dar de baja"
        texto="Dar de baja"
        textoProcesando="Dando de baja..."
        eliminando={dandoDeBaja}
        onConfirmar={darDeBaja}
        onCancelar={() => !dandoDeBaja && setUnidadADarDeBaja(null)}
      >
        <p className="mb-0">
          La herramienta <strong>{unidadADarDeBaja?.codigo}</strong> quedará fuera de servicio.
        </p>
      </DialogoEliminar>
    </>
  );
}
