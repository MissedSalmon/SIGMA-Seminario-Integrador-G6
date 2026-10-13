'use client';

import { CCard, CCardBody, CCardHeader } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilShieldAlt, cilLockLocked } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';

export default function ConfiguracionPage() {
  return (
    <div>
      <EncabezadoPagina titulo="Configuración" />

      <CCard
        className="shadow-sm border mb-4"
        style={{
          maxWidth: '44rem',
          borderRadius: 'var(--sigma-radio-md)',
          borderColor: 'var(--sigma-borde)',
        }}
      >
        <CCardHeader className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
          <CIcon icon={cilShieldAlt} className="text-primary" />
          <strong style={{ color: 'var(--sigma-ink)' }}>Seguridad y Acceso</strong>
        </CCardHeader>

        <CCardBody className="p-4">
          <p className="text-secondary mb-4">
            Administre sus credenciales de acceso al sistema y mantenga segura su cuenta.
          </p>

          <BotonEnlace href="/configuracion/cambiar-password" color="primary">
            <CIcon icon={cilLockLocked} className="me-2" />
            Cambiar contraseña
          </BotonEnlace>
        </CCardBody>
      </CCard>
    </div>
  );
}
