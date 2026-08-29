'use client';

/**
 * Cartel de error o de exito arriba de un formulario o de una tabla.
 * Si no hay mensaje, no muestra nada.
 */
import { CAlert } from '@coreui/react';

export default function Aviso({ mensaje, color = 'danger', onCerrar }) {
  if (!mensaje) return null;

  return (
    <CAlert color={color} dismissible={Boolean(onCerrar)} onClose={onCerrar}>
      {mensaje}
    </CAlert>
  );
}
