'use client';

import { useState } from 'react';
import {
  CButton,
  CButtonGroup,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { restablecerContrasenaUsuario } from '@/servicios/usuarios.js';

export function AccionRestablecerContrasena({ onClick, nombre }) {
  const { usuario } = useSesion();

  if (usuario?.rol !== 'administrador') return null;

  return (
    <CButton
      type="button"
      size="sm"
      variant="ghost"
      color="primary"
      className="btn-icono"
      onClick={onClick}
      title="Restablecer contraseña"
      aria-label={`Restablecer contraseña de ${nombre}`}
    >
      <CIcon icon={cilLockLocked} />
    </CButton>
  );
}

export default function DialogoRestablecerContrasena({ usuario, onCerrar }) {
  const { mostrarToast } = useToast();
  const [contrasenaProvisoria, setContrasenaProvisoria] = useState('');
  const [restableciendo, setRestableciendo] = useState(false);
  const [error, setError] = useState('');

  function cerrar() {
    if (restableciendo) return;
    setContrasenaProvisoria('');
    setError('');
    onCerrar();
  }

  async function confirmar() {
    setRestableciendo(true);
    setError('');

    try {
      const datos = await restablecerContrasenaUsuario(usuario.identificador);
      setContrasenaProvisoria(datos.contrasenaProvisoria);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setRestableciendo(false);
    }
  }

  async function copiarContrasena() {
    try {
      await navigator.clipboard.writeText(contrasenaProvisoria);
      mostrarToast({ tipo: 'exito', mensaje: 'Se copió la contraseña provisoria.' });
    } catch {
      setError('No se pudo copiar la contraseña. Seleccionala y copiala manualmente.');
    }
  }

  return (
    <CModal
      visible={Boolean(usuario)}
      onClose={cerrar}
      alignment="center"
      aria-labelledby="titulo-restablecer-contrasena"
    >
      <CModalHeader>
        <CModalTitle id="titulo-restablecer-contrasena">
          {contrasenaProvisoria ? 'Contraseña provisoria' : 'Restablecer contraseña'}
        </CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />
        {contrasenaProvisoria ? (
          <>
            <p>
              Comunicá esta contraseña provisoria a <strong>{usuario?.nombre}</strong>. Deberá
              cambiarla la próxima vez que ingrese.
            </p>
            <p className="mb-2">Contraseña provisoria:</p>
            <div className="border rounded p-3 mb-3" aria-live="polite">
              <code className="user-select-all">{contrasenaProvisoria}</code>
            </div>
            <CButton type="button" color="primary" onClick={copiarContrasena}>
              Copiar contraseña
            </CButton>
          </>
        ) : (
          <p className="mb-0">
            Se generará una contraseña provisoria para <strong>{usuario?.nombre}</strong>. La acción
            quedará registrada y deberá cambiarla al ingresar.
          </p>
        )}
      </CModalBody>

      <CModalFooter>
        {contrasenaProvisoria ? (
          <CButton type="button" color="secondary" variant="outline" onClick={cerrar}>
            Cerrar
          </CButton>
        ) : (
          <BotonesAccion
            texto="Restablecer contraseña"
            textoProcesando="Restableciendo..."
            procesando={restableciendo}
            alAceptar={confirmar}
            alCancelar={cerrar}
          />
        )}
      </CModalFooter>
    </CModal>
  );
}
