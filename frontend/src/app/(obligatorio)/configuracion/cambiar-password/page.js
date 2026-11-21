'use client';

/**
 * /configuracion/cambiar-password - cambio obligatorio del primer ingreso (HU-30).
 * Esta ruta vive fuera del layout administrativo para mostrarse como una
 * pantalla aislada, igual que el inicio de sesión.
 */
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import BotonesAccion from '@/componentes/BotonesAccion.js';
import { olvidarAvisadas } from '@/componentes/layout/CampanaNotificaciones.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { useCambioContrasena } from '@/componentes/usuarios/CambioContrasena.js';
import { logout } from '@/servicios/auth.js';

export default function PantallaCambioObligatorio() {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const { campos, guardar, guardando } = useCambioContrasena({
    alGuardado: () => {
      mostrarToast({ tipo: 'exito', mensaje: 'Se cambió tu contraseña.' });
      router.push('/');
      router.refresh();
    },
  });

  async function cancelar() {
    try {
      await logout();
    } finally {
      olvidarAvisadas?.();
      window.location.replace('/login');
    }
  }

  return (
    <main
      className="min-vh-100 d-flex align-items-center justify-content-center p-3"
      style={{ background: 'var(--sigma-fondo, #f8f9fa)' }}
    >
      <CCard style={{ width: '100%', maxWidth: '34rem' }}>
        <CCardBody className="p-4 p-sm-5">
          <div className="text-center mb-4">
            <span
              className="sigma-marca"
              style={{
                color: 'var(--sigma-teal)',
                fontSize: '2rem',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              SIGMA
            </span>
            <h1 className="h5 mt-3 mb-1">Cambiar contraseña</h1>
            <p className="text-body-secondary small mb-0">
              Ingreso obligatorio antes de usar el sistema
            </p>
          </div>

          <form noValidate onSubmit={guardar}>
            {campos}
            <BotonesAccion procesando={guardando} alCancelar={cancelar} className="mt-4" />
          </form>
        </CCardBody>
      </CCard>
    </main>
  );
}
