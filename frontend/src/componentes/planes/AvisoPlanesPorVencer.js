'use client';

/**
 * Componente que muestra los planes de mantenimiento preventivo por vencer
 * en los próximos 7 días (CA5, Sprint 5).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CAlert,
  CBadge,
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilWarning, cilArrowRight, cilSync } from '@coreui/icons';

import {
  obtenerPlanesPorVencer,
  procesarGeneracionAutomatica,
} from '@/servicios/planesMantenimiento.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

function soloFechaLegible(iso) {
  if (!iso) return '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '-';
}

export default function AvisoPlanesPorVencer() {
  const { mostrarToast } = useToast();
  const [planes, setPlanes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [error, setError] = useState('');

  async function cargarPlanes() {
    try {
      const data = await obtenerPlanesPorVencer(7);
      setPlanes(data);
      setError('');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargarPlanes();
  }, []);

  async function ejecutarGeneracion() {
    setProcesando(true);
    try {
      const res = await procesarGeneracionAutomatica();
      mostrarToast({
        tipo: 'exito',
        mensaje: `Generación completada: ${res.otsGeneradas} OT(s) generadas. Planes postergados: ${res.planesPostergadosSinTecnico}.`,
      });
      await cargarPlanes();
    } catch (fallo) {
      mostrarToast({ tipo: 'error', mensaje: fallo.message });
    } finally {
      setProcesando(false);
    }
  }

  if (cargando) return null;
  if (error) return null;
  if (planes.length === 0) return null;

  return (
    <CCard className="mb-4 border-warning shadow-sm">
      <CCardHeader className="bg-warning-subtle text-warning-emphasis d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <CIcon icon={cilCalendar} />
          <span>Planes de Mantenimiento Preventivo por Vencer (Próximos 7 días)</span>
          <CBadge color="warning" className="text-dark">
            {planes.length}
          </CBadge>
        </div>
        <CButton
          color="warning"
          variant="outline"
          size="sm"
          disabled={procesando}
          onClick={ejecutarGeneracion}
          title="Ejecutar el proceso de generación automática ahora"
        >
          <CIcon icon={cilSync} className={`me-1 ${procesando ? 'rotate' : ''}`} />
          {procesando ? 'Procesando...' : 'Procesar generación'}
        </CButton>
      </CCardHeader>
      <CCardBody className="p-0">
        <ul className="list-group list-group-flush">
          {planes.map((plan) => (
            <li
              key={plan.id}
              className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 p-3"
            >
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    href={`/planes-mantenimiento/${plan.id}`}
                    className="fw-semibold text-decoration-none text-body"
                  >
                    {plan.nombre}
                  </Link>
                  {plan.tipoActivo?.nombre && (
                    <CBadge color="info" className="text-dark">
                      {plan.tipoActivo.nombre}
                    </CBadge>
                  )}
                  {plan.diasRestantes === 0 ? (
                    <CBadge color="danger">Vence hoy</CBadge>
                  ) : (
                    <CBadge color="primary">En {plan.diasRestantes} días</CBadge>
                  )}
                </div>

                <div className="text-body-secondary small mt-1">
                  Fecha programada: <strong>{soloFechaLegible(plan.fechaProximaGeneracion)}</strong>
                </div>

                {/* Advertencia destacada si falta técnico (C7 / CA5) */}
                {!plan.tieneTecnico && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <CIcon icon={cilWarning} size="sm" />
                    <strong>Advertencia:</strong> No tiene técnicos asignados. El sistema no
                    generará las órdenes de trabajo automáticas hasta que se le asigne uno.
                  </div>
                )}
              </div>

              <div className="text-end">
                <Link
                  href={`/planes-mantenimiento/${plan.id}`}
                  className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1"
                >
                  <span>Ver plan</span>
                  <CIcon icon={cilArrowRight} size="sm" />
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </CCardBody>
    </CCard>
  );
}
