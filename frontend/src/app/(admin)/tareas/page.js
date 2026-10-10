'use client';

/**
 * /tareas — Panel del técnico (HU-30).
 *
 * Muestra las tareas asignadas al técnico que tiene la sesión activa.
 * Por ahora es un panel informativo con el estado de las OTs que le
 * corresponden. Cuando se implemente el módulo de tareas del técnico
 * (HU futura), esta pantalla se completará con la lista real.
 */
import { useEffect, useState } from 'react';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilWrench, cilUser } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';

export default function PantallaAreaTecnico() {
  const { usuario, cargando } = useSesion();

  const nombre =
    usuario?.tecnico_nom_ape ||
    usuario?.identificador ||
    'Técnico';

  if (cargando) {
    return (
      <div>
        <EncabezadoPagina titulo="Mis tareas" />
        <div className="d-flex align-items-center gap-2 text-secondary p-4">
          <CSpinner size="sm" />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <EncabezadoPagina
        titulo="Mis tareas"
        descripcion="Panel del técnico — aquí verás las tareas que te fueron asignadas."
      />

      <CCard
        className="shadow-sm border mb-4"
        style={{
          maxWidth: '44rem',
          borderRadius: 'var(--sigma-radio-md)',
          borderColor: 'var(--sigma-borde)',
        }}
      >
        <CCardHeader className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
          <CIcon icon={cilUser} className="text-primary" />
          <strong style={{ color: 'var(--sigma-ink)' }}>Bienvenido, {nombre}</strong>
        </CCardHeader>

        <CCardBody className="p-4">
          <div className="d-flex align-items-start gap-3 mb-3">
            <CIcon icon={cilWrench} size="xl" className="text-secondary flex-shrink-0 mt-1" />
            <div>
              <p className="mb-1 fw-semibold" style={{ color: 'var(--sigma-ink)' }}>
                Panel de tareas
              </p>
              <p className="text-secondary small mb-0">
                Acá aparecerán las tareas de las órdenes de trabajo que te fueron asignadas.
                Esta sección se completará cuando se implemente el módulo de ejecución de tareas.
              </p>
            </div>
          </div>

          <hr style={{ borderColor: 'var(--sigma-borde)' }} />

          <div className="text-secondary small">
            <strong>Legajo:</strong> {usuario?.identificador}
            <br />
            <strong>Rol:</strong> Técnico
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
}
