'use client';

/**
 * /inventario/remitos/5 - el detalle de un ingreso por remito (HU-16).
 *
 * Muestra de donde vino la mercaderia y que trajo, renglon por renglon, con el
 * stock en el que quedo cada item. Es de solo lectura: el remito ya movio el
 * stock y no se modifica.
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
import { cilArrowLeft } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { obtenerRemito } from '@/servicios/remitos.js';
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

export default function PantallaDetalleRemito({ params }) {
  const { id } = use(params);

  const [remito, setRemito] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerRemito(id)
      .then(setRemito)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina
        titulo={remito ? `Remito #${remito.id}` : 'Detalle del remito'}
        descripcion={remito ? `Recibido de ${remito.proveedor}.` : undefined}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el remito..." />
      ) : (
        remito && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">¿De dónde vino?</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Proveedor">{remito.proveedor}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="N.º de remito">
                      {remito.numero ?? <SinDato>Sin número</SinDato>}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Fecha de recepción">
                      {soloFechaLegible(remito.fechaRecepcion)}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Cargado en SIGMA">
                      {formatearFechaHora(remito.creadoEn)}
                    </Dato>
                  </CCol>
                  <CCol sm={12}>
                    <Dato etiqueta="Observaciones">
                      {remito.observaciones ?? <SinDato>Sin observaciones.</SinDato>}
                    </Dato>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">¿Qué trajo?</CCardHeader>
              <CCardBody>
                <div className="table-responsive">
                  <CTable hover align="middle" className="mb-0">
                    <CTableHead>
                      <CTableRow>
                        <CTableHeaderCell>Código</CTableHeaderCell>
                        <CTableHeaderCell>Ítem</CTableHeaderCell>
                        <CTableHeaderCell>Clase</CTableHeaderCell>
                        <CTableHeaderCell>Cantidad ingresada</CTableHeaderCell>
                        <CTableHeaderCell>Stock actual</CTableHeaderCell>
                      </CTableRow>
                    </CTableHead>

                    <CTableBody>
                      {remito.items.map((renglon) => (
                        <CTableRow key={renglon.codigo}>
                          <CTableDataCell>
                            <span className="fw-semibold">{renglon.codigo}</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="text-body-secondary">{renglon.nombre}</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="text-body-secondary">{renglon.clase}</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="text-body-secondary">{renglon.cantidad}</span>
                          </CTableDataCell>
                          <CTableDataCell>
                            <span className="text-body-secondary">{renglon.stockActual ?? '-'}</span>
                          </CTableDataCell>
                        </CTableRow>
                      ))}
                    </CTableBody>
                  </CTable>
                </div>

                <p className="text-body-secondary mt-3 mb-0">
                  Ingresaron <strong>{remito.totalUnidades}</strong>{' '}
                  {remito.totalUnidades === 1 ? 'unidad' : 'unidades'} en{' '}
                  <strong>{remito.cantidadItems}</strong>{' '}
                  {remito.cantidadItems === 1 ? 'ítem' : 'ítems'}. El stock que se muestra es
                  el de hoy, que puede haber cambiado por consumos posteriores.
                </p>
              </CCardBody>
            </CCard>
          </>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/inventario/remitos" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
