'use client';

/**
 * /configuracion/cambiar-password - cambio obligatorio del primer ingreso (HU-30).
 *
 * Sólo se llega acá cuando el usuario tiene que cambiar la contraseña: el
 * middleware lo trae y no lo deja salir hasta que la cambie. El cambio que
 * cualquiera hace cuando quiere es la ventana del perfil.
 */
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import BotonesAccion from '@/componentes/BotonesAccion.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
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
      // El inicio de cada rol lo decide el middleware, ya con el token nuevo.
      router.push('/');
      router.refresh();
    },
  });

  // Sin cambiarla no se puede usar el sistema: cancelar es salir.
  async function cancelar() {
    try {
      await logout();
    } finally {
      olvidarAvisadas?.();
      window.location.replace('/login');
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Cambiar contraseña" />

      <CCard style={{ maxWidth: '34rem' }}>
        <CCardBody>
          <form noValidate onSubmit={guardar}>
            {campos}
            <BotonesAccion procesando={guardando} alCancelar={cancelar} className="mt-4" />
          </form>
        </CCardBody>
      </CCard>
    </>
  );
}
