'use client';

/**
 * /inventario/herramientas/HER-EL01/HE-000: la ficha de una herramienta física.
 * Desde acá se asigna, se devuelve, se da de baja o se pone en servicio.
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
import { cilArrowLeft, cilCheckCircle, cilTrash, cilUserFollow, cilUserUnfollow } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Dato from '@/componentes/Dato.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import DialogoAsignacion from '@/componentes/inventario/DialogoAsignacion.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarItem, listarAsignaciones, obtenerItem, ponerEnServicio } from '@/servicios/inventario.js';
import { formatearFechaHora, soloFechaLegible } from '@/utils/fechas.js';

function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaFichaUnidadHerramienta({ params }) {
  const { codigo, unidad } = use(params);
  const codigoModelo = decodeURIComponent(codigo);
  const codigoUnidad = decodeURIComponent(unidad);
  const direccionModelo = `/inventario/herramientas/${encodeURIComponent(codigoModelo)}`;
  const { mostrarToast } = useToast();

  const [herramienta, setHerramienta] = useState(null);
  const [asignaciones, setAsignaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [asignando, setAsignando] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [confirmandoEstado, setConfirmandoEstado] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    Promise.all([obtenerItem(codigoUnidad), listarAsignaciones(codigoUnidad)])
      .then(([ficha, historial]) => {
        setHerramienta(ficha);
        setAsignaciones(historial);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoUnidad, recarga]);

  const disponible = herramienta?.estado === 'Disponible';
  const fueraDeServicio = herramienta?.estado === 'Fuera de servicio';
  const asignada = Boolean(herramienta?.legajoTecnico);

  async function cambiarEstado() {
    setCambiandoEstado(true);
    try {
      if (disponible) {
        await eliminarItem(codigoUnidad);
        mostrarToast({ tipo: 'exito', mensaje: `La herramienta ${codigoUnidad} quedó fuera de servicio.` });
      } else {
        await ponerEnServicio(codigoUnidad);
        mostrarToast({ tipo: 'exito', mensaje: `La herramienta ${codigoUnidad} volvió a estar disponible.` });
      }
      setRecarga((valor) => valor + 1);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setConfirmandoEstado(false);
      setCambiandoEstado(false);
    }
  }

  function asignacionGuardada() {
    setAsignando(false);
    setRecarga((valor) => valor + 1);
  }

  const acciones = herramienta && (
    <CDropdown placement="bottom-end">
      <CDropdownToggle color="secondary" variant="outline">
        Opciones
      </CDropdownToggle>
      <CDropdownMenu className="shadow-sm border" style={{ minWidth: '14rem' }}>
        {!fueraDeServicio && (
          <CDropdownItem as="button" className="d-flex align-items-center gap-2 py-2" onClick={() => setAsignando(true)}>
            <CIcon icon={asignada ? cilUserUnfollow : cilUserFollow} />
            {asignada ? 'Devolver' : 'Asignar'}
          </CDropdownItem>
        )}
        {fueraDeServicio && (
          <CDropdownItem as="button" className="d-flex align-items-center gap-2 py-2" onClick={() => setConfirmandoEstado(true)}>
            <CIcon icon={cilCheckCircle} />
            Poner en servicio
          </CDropdownItem>
        )}
        {disponible && (
          <>
            <CDropdownDivider className="my-1" />
            <CDropdownItem
              as="button"
              className="d-flex align-items-center gap-2 py-2 text-danger"
              onClick={() => setConfirmandoEstado(true)}
            >
              <CIcon icon={cilTrash} />
              Dar de baja
            </CDropdownItem>
          </>
        )}
      </CDropdownMenu>
    </CDropdown>
  );

  return (
    <>
      <EncabezadoPagina titulo={`Herramienta ${codigoUnidad}`} accionesExtra={acciones} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando la herramienta..." />
      ) : (
        herramienta && (
          <>
            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Datos de la herramienta</CCardHeader>
              <CCardBody>
                <CRow>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Código">
                      <span className="fw-semibold text-nowrap">{herramienta.codigo}</span>
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Modelo">
                      <BotonEnlace href={direccionModelo} color="secondary" variante="ghost" className="p-0 text-start">
                        {herramienta.nombre} ({herramienta.codigoModelo})
                      </BotonEnlace>
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Categoría">{herramienta.nombreTipo || <SinDato>Sin categoría</SinDato>}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Estado">{herramienta.estado}</Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Técnico">
                      {herramienta.tecnico ? (
                        <>
                          {herramienta.tecnico}
                          <span className="text-body-secondary"> desde el {formatearFechaHora(herramienta.asignadaDesde)}</span>
                        </>
                      ) : (
                        <SinDato>Sin asignar</SinDato>
                      )}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Fecha de alta">
                      {herramienta.fechaAlta ? soloFechaLegible(herramienta.fechaAlta) : <SinDato>Sin registrar</SinDato>}
                    </Dato>
                  </CCol>
                  <CCol sm={6} lg={3}>
                    <Dato etiqueta="Origen">
                      {herramienta.idRemito ? (
                        <BotonEnlace
                          href={`/inventario/remitos/${herramienta.idRemito}`}
                          color="secondary"
                          variante="ghost"
                          className="p-0 text-nowrap"
                        >
                          Remito #{herramienta.idRemito}
                        </BotonEnlace>
                      ) : herramienta.fechaAlta ? (
                        'Ingreso manual'
                      ) : (
                        <SinDato>Sin registrar</SinDato>
                      )}
                    </Dato>
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>

            <CCard className="mb-4">
              <CCardHeader className="fw-semibold">Historial de asignaciones</CCardHeader>
              <CCardBody>
                {asignaciones.length === 0 ? (
                  <SinDatos texto="Esta herramienta todavía no fue asignada." />
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
                        {asignaciones.map((fila) => (
                          <CTableRow key={`${fila.legajo}-${fila.desde}`}>
                            <CTableDataCell>{fila.tecnico ?? fila.legajo} (legajo {fila.legajo})</CTableDataCell>
                            <CTableDataCell className="text-nowrap">{formatearFechaHora(fila.desde)}</CTableDataCell>
                            <CTableDataCell className="text-nowrap">
                              {fila.hasta ? formatearFechaHora(fila.hasta) : 'En uso'}
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

      <div className="mt-2 mb-4">
        <BotonEnlace href={direccionModelo} color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al modelo
        </BotonEnlace>
      </div>

      {asignando && (
        <DialogoAsignacion herramienta={herramienta} onCerrar={() => setAsignando(false)} onGuardado={asignacionGuardada} />
      )}

      <CModal visible={confirmandoEstado} onClose={() => !cambiandoEstado && setConfirmandoEstado(false)} alignment="center">
        <CModalHeader>
          <CModalTitle>{disponible ? 'Dar de baja' : 'Poner en servicio'}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          <p className="mb-0">
            La herramienta <strong>{codigoUnidad}</strong>{' '}
            {disponible ? 'quedará fuera de servicio.' : 'volverá a estar disponible.'}
          </p>
        </CModalBody>
        <CModalFooter>
          <BotonesAccion
            texto={disponible ? 'Dar de baja' : 'Poner en servicio'}
            textoProcesando={disponible ? 'Dando de baja...' : 'Actualizando...'}
            color={disponible ? 'danger' : 'primary'}
            procesando={cambiandoEstado}
            alAceptar={cambiarEstado}
            alCancelar={() => setConfirmandoEstado(false)}
          />
        </CModalFooter>
      </CModal>
    </>
  );
}
