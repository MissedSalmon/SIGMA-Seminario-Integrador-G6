'use client';

/**
 * Los mantenimientos preventivos que se generan en los próximos 7 días (CA5).
 * Desde el 03/11/2026 la programación es por activo: cada renglón es un plan
 * para un activo, con su fecha.
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
        mensaje: `Generación completada: ${res.otsGeneradas} OT generadas.`,
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
          <span>Mantenimientos preventivos a generar (próximos 7 días)</span>
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
              key={`${plan.idPlan}-${plan.codigoActivo}`}
              className="list-group-item d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-2 p-3"
            >
              <div>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    href={`/planes-mantenimiento/${plan.idPlan}`}
                    className="fw-semibold text-decoration-none text-body"
                  >
                    {plan.nombre}
                  </Link>
                  <span className="text-body-secondary">· {plan.codigoActivo}</span>
                  {plan.diasRestantes < 0 ? (
                    <CBadge color="danger">Vencido</CBadge>
                  ) : plan.diasRestantes === 0 ? (
                    <CBadge color="danger">Vence hoy</CBadge>
                  ) : (
                    <CBadge color="primary">En {plan.diasRestantes} días</CBadge>
                  )}
                </div>

                <div className="text-body-secondary small mt-1">
                  Fecha programada: <strong>{soloFechaLegible(plan.fecha)}</strong>
                </div>

                {plan.advertencia && (
                  <div className="text-danger small mt-1 d-flex align-items-center gap-1">
                    <CIcon icon={cilWarning} size="sm" />
                    {plan.advertencia}
                  </div>
                )}
              </div>

              <div className="text-end">
                <Link
                  href={`/planes-mantenimiento/${plan.idPlan}`}
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
