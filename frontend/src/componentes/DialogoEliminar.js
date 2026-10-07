'use client';

/**
 * Ventana de confirmacion antes de dar de baja algo.
 *
 * Se abre pasandole el registro a eliminar; se cierra pasandole null.
 * El texto del cuerpo lo arma la pantalla que lo usa, porque cada entidad
 * avisa cosas distintas.
 */
import {
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';

import BotonesAccion from '@/componentes/BotonesAccion.js';

export default function DialogoEliminar({
  visible,
  titulo = 'Confirmar la baja',
  children,
  // El verbo del boton. Cambia cuando la baja no borra el registro (un activo "se da de baja").
  texto = 'Eliminar',
  textoProcesando = 'Eliminando...',
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
        <BotonesAccion
          texto={texto}
          textoProcesando={textoProcesando}
          color="danger"
          procesando={eliminando}
          alAceptar={onConfirmar}
          alCancelar={onCancelar}
        />
      </CModalFooter>
    </CModal>
  );
}
