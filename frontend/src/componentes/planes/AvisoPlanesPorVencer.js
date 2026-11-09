'use client';

/**
 * Los mantenimientos preventivos de los próximos 7 días (CA5). Cada renglón es
 * un plan para un activo. La OT la genera sola el job del backend el día
 * anterior a la fecha (04/11/2026), por eso el aviso no tiene botón para
 * generarla: sólo anticipa qué viene y cuándo aparece la OT.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CBadge,
  CCard,
  CCardBody,
  CCardHeader,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCalendar, cilArrowRight } from '@coreui/icons';

import { obtenerPlanesPorVencer } from '@/servicios/planesMantenimiento.js';

function soloFechaLegible(iso) {
  if (!iso) return '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '-';
}

export default function AvisoPlanesPorVencer() {
  const [planes, setPlanes] = useState([]);

  // Si la consulta falla el aviso no se muestra: el panel sigue andando sin él.
  useEffect(() => {
    obtenerPlanesPorVencer(7)
      .then(setPlanes)
      .catch(() => setPlanes([]));
  }, []);

  if (planes.length === 0) return null;

  return (
    <CCard className="mb-4 border-warning shadow-sm">
      <CCardHeader className="bg-warning-subtle text-warning-emphasis d-flex align-items-center">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <CIcon icon={cilCalendar} />
          <span>Próximos mantenimientos preventivos (7 días)</span>
          <CBadge color="warning" className="text-dark">
            {planes.length}
          </CBadge>
        </div>
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

                <div className="text-body-secondary small mt-1 d-flex flex-wrap column-gap-3">
                  <span>
                    Fecha programada: <strong>{soloFechaLegible(plan.fecha)}</strong>
                  </span>
                  <span>
                    Se genera la OT: <strong>{soloFechaLegible(plan.fechaGeneracion)}</strong>
                  </span>
                </div>

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
