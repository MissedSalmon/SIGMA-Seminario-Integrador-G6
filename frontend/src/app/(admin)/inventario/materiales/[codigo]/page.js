'use client';

/**
 * /inventario/materiales/CA-111 - la ficha de un material (HU-16).
 *
 * Sus datos y, debajo, el historial de movimientos: como llego el stock al
 * numero que se ve hoy. Cada renglon es un Ingreso (viene de un remito) o un
 * Consumo (sale de una tarea de la OT).
 */
import { use, useEffect, useState } from 'react';
import {
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
import { cilArrowLeft, cilPencil } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import { listarMovimientos, obtenerItem } from '@/servicios/inventario.js';
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

export default function PantallaFichaItem({ params }) {
  const { codigo } = use(params);

  // El codigo viaja en la direccion, asi que puede venir escapado ("AC%2D014").
  const codigoItem = decodeURIComponent(codigo);

  const [item, setItem] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerItem(codigoItem), listarMovimientos(codigoItem)])
      .then(([ficha, historial]) => {
        setItem(ficha);
        setMovimientos(historial);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoItem]);

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
                href={`/inventario/materiales/${encodeURIComponent(item.codigo)}/editar`}
                color="secondary"
                variante="outline"
              >
                <CIcon icon={cilPencil} className="me-2" />
                Editar
              </BotonEnlace>
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
                    <Dato etiqueta="Stock mínimo">{item.stockMinimo}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Stock actual">
                      {/* El rojo se explica al lado: está por debajo del mínimo. */}
                      {item.bajoMinimo ? (
                        <>
                          <span className="sigma-stock-bajo">{item.stockActual}</span>
                          <span className="text-body-secondary small"> — por debajo del mínimo</span>
                        </>
                      ) : (
                        <span className="fw-semibold">{item.stockActual}</span>
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
              <CCardHeader className="fw-semibold">Historial de movimientos</CCardHeader>
              <CCardBody>
                {movimientos.length === 0 ? (
                  <SinDatos texto="Todavía no hay ingresos ni consumos registrados para este ítem." />
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

      <div className="d-flex flex-wrap gap-2 mt-2 mb-4">
        <BotonEnlace href="/inventario/materiales" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
