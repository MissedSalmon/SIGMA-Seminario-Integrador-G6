'use client';

/**
 * Cartel de error o de exito arriba de un formulario o de una tabla.
 * Si no hay mensaje, no muestra nada.
 */
import { CAlert } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckCircle, cilWarning, cilXCircle } from '@coreui/icons';

const ICONOS = {
  danger: cilXCircle,
  warning: cilWarning,
  success: cilCheckCircle,
  info: cilWarning,
};

export default function Aviso({ mensaje, color = 'danger', onCerrar }) {
  if (!mensaje) return null;

  return (
    <CAlert color={color} dismissible={Boolean(onCerrar)} onClose={onCerrar} className="d-flex align-items-center gap-2">
      <CIcon icon={ICONOS[color] ?? cilWarning} className="flex-shrink-0" />
      <span>{mensaje}</span>
    </CAlert>
  );
}
