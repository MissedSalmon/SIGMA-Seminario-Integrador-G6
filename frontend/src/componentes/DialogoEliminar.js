'use client';

/**
 * Ventana de confirmacion antes de dar de baja algo.
 *
 * Se abre pasandole el registro a eliminar; se cierra pasandole null.
 * El texto del cuerpo lo arma la pantalla que lo usa, porque cada entidad
 * avisa cosas distintas.
 */
import {
  CButton,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';

export default function DialogoEliminar({
  visible,
  titulo = 'Confirmar la baja',
  children,
  eliminando = false,
  onConfirmar,
  onCancelar,
}) {
  return (
    <CModal visible={visible} onClose={onCancelar} alignment="center">
      <CModalHeader>
        <CModalTitle>{titulo}</CModalTitle>
      </CModalHeader>

      <CModalBody>{children}</CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCancelar} disabled={eliminando}>
          Cancelar
        </CButton>
        <CButton color="danger" onClick={onConfirmar} disabled={eliminando}>
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </CButton>
      </CModalFooter>
    </CModal>
  );
}
