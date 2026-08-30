'use client';

/**
 * El contenedor que dibuja los toasts activos, arriba a la derecha.
 * Se monta una sola vez en LayoutAdmin.js; el contenido lo maneja
 * ContextoToast.js.
 */
import CIcon from '@coreui/icons-react';
import { cilCheckCircle, cilWarning, cilX } from '@coreui/icons';

import { useToast } from './ContextoToast.js';

export default function Toast() {
  const { toasts, cerrarToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="sigma-toast-contenedor">
      {toasts.map((toast) => (
        <div key={toast.id} className={`sigma-toast sigma-toast--${toast.tipo}`} role="status">
          <span className="sigma-toast-icono">
            <CIcon icon={toast.tipo === 'error' ? cilWarning : cilCheckCircle} size="sm" />
          </span>
          <span className="flex-grow-1">{toast.mensaje}</span>
          <button
            type="button"
            className="sigma-toast-cerrar"
            onClick={() => cerrarToast(toast.id)}
            aria-label="Cerrar aviso"
          >
            <CIcon icon={cilX} size="sm" />
          </button>
        </div>
      ))}
    </div>
  );
}
