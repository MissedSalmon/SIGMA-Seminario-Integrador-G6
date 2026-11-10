'use client';

/**
 * Lo que comparten las listas y las fichas de técnicos y de usuarios
 * autorizados, para que las dos se manejen igual (07/11/2026):
 *
 *   - En la lista, cada fila tiene «Ver detalle» y «Editar» (AccionesFila),
 *     como los planes de mantenimiento.
 *   - En la ficha están todas las acciones (AccionesFicha): «Editar» a la
 *     vista, como en las demás fichas, y en el desplegable «Opciones»:
 *     Restablecer contraseña · Desactivar/Activar · Eliminar (10/11/2026).
 *
 * Desactivar es la baja normal: la persona no puede entrar, pero queda todo lo
 * que registró. Eliminar es para alguien cargado por error y la API lo frena si
 * ya tiene historial.
 *
 * Cada persona llega con { legajo, nombre, idUsuario, activo } (ver la API).
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButtonGroup,
  CDropdown,
  CDropdownDivider,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBan, cilCheckCircle, cilDescription, cilLockLocked, cilPencil, cilTrash } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import EtiquetaEstadoUsuario from '@/componentes/usuarios/EtiquetaEstadoUsuario.js';
import DialogoRestablecerContrasena from '@/componentes/usuarios/RestablecerContrasena.js';
import { activarUsuario, desactivarUsuario } from '@/servicios/usuarios.js';

export const OPCIONES_ESTADO = [
  { valor: 'activo', texto: 'Activo' },
  { valor: 'inactivo', texto: 'Inactivo' },
];

export function filtrarPorEstado(personas, filtro) {
  if (!filtro) return personas;
  return personas.filter((persona) => persona.activo === (filtro === 'activo'));
}

/** La columna "Estado" de la tabla, igual en las dos listas. */
export const COLUMNA_ESTADO = {
  clave: 'estado',
  encabezado: 'Estado',
  render: (persona) => <EtiquetaEstadoUsuario activo={persona.activo} />,
};

/** Un renglón "etiqueta: valor" de la ficha. */
export function Dato({ etiqueta, children }) {
  return (
    <div className="mb-3">
      <div className="text-body-secondary small">{etiqueta}</div>
      <div>{children || '-'}</div>
    </div>
  );
}

/** Las acciones de una fila de la lista: ver la ficha y editar. */
export function AccionesFila({ nombre, hrefDetalle, hrefEditar }) {
  return (
    <CButtonGroup size="sm">
      <BotonEnlace href={hrefDetalle} variante="ghost" className="btn-icono" title={`Ver detalle de ${nombre}`}>
        <CIcon icon={cilDescription} />
      </BotonEnlace>
      <BotonEnlace href={hrefEditar} variante="ghost" className="btn-icono" title={`Editar a ${nombre}`}>
        <CIcon icon={cilPencil} />
      </BotonEnlace>
    </CButtonGroup>
  );
}

function DialogoEstado({ persona, onCerrar, onCambiado }) {
  const { mostrarToast } = useToast();
  const [cambiando, setCambiando] = useState(false);
  const [error, setError] = useState('');
  const desactivando = persona.activo;

  async function confirmar() {
    setCambiando(true);
    setError('');
    try {
      if (desactivando) await desactivarUsuario(persona.idUsuario);
      else await activarUsuario(persona.idUsuario);
      mostrarToast({
        tipo: 'exito',
        mensaje: desactivando ? `Se desactivó a "${persona.nombre}".` : `Se activó a "${persona.nombre}".`,
      });
      onCambiado();
    } catch (fallo) {
      setError(fallo.message);
      setCambiando(false);
    }
  }

  return (
    <CModal visible onClose={() => !cambiando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>{desactivando ? 'Desactivar usuario' : 'Activar usuario'}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />
        {desactivando ? (
          <p className="mb-0">
            <strong>{persona.nombre}</strong> no va a poder iniciar sesión. No se borra nada de lo que
            registró, y se puede volver a activar.
          </p>
        ) : (
          <p className="mb-0">
            <strong>{persona.nombre}</strong> vuelve a poder iniciar sesión.
          </p>
        )}
      </CModalBody>

      <CModalFooter>
        <BotonesAccion
          texto={desactivando ? 'Desactivar' : 'Activar'}
          textoProcesando={desactivando ? 'Desactivando...' : 'Activando...'}
          color={desactivando ? 'danger' : 'primary'}
          procesando={cambiando}
          alAceptar={confirmar}
          alCancelar={onCerrar}
        />
      </CModalFooter>
    </CModal>
  );
}

/**
 * Las acciones de la ficha, para el encabezado de la pantalla.
 *
 * @param {object}   persona     - { legajo, nombre, idUsuario, activo }
 * @param {string}   hrefEditar  - la pantalla de edición
 * @param {string}   volverA     - la lista, a la que se vuelve después de eliminar
 * @param {Function} eliminar    - llama a la API para borrar a la persona
 * @param {*}        avisoEliminar - el texto de la confirmación
 * @param {Function} alCambiar   - para volver a pedir la persona después de activar o desactivar
 * @param {Function} alFallar    - recibe el mensaje si la API no deja eliminar
 */
export default function AccionesFicha({ persona, hrefEditar, volverA, eliminar, avisoEliminar, alCambiar, alFallar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [restableciendo, setRestableciendo] = useState(false);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [aEliminar, setAEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const conUsuario = Boolean(persona.idUsuario);

  async function confirmarEliminar() {
    setEliminando(true);
    try {
      await eliminar();
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó a "${persona.nombre}".` });
      router.push(volverA);
      router.refresh();
    } catch (fallo) {
      alFallar(fallo.message);
      setAEliminar(false);
      setEliminando(false);
    }
  }

  return (
    <>
      <BotonEnlace href={hrefEditar} color="secondary" variante="outline">
        <CIcon icon={cilPencil} className="me-2" />
        Editar
      </BotonEnlace>

      {/* El resto va en un desplegable, como «Opciones» del listado de activos. */}
      <CDropdown placement="bottom-end">
        <CDropdownToggle color="secondary" variant="outline">
          Opciones
        </CDropdownToggle>
        <CDropdownMenu className="shadow-sm border" style={{ minWidth: '14rem' }}>
          {conUsuario && (
            <>
              <CDropdownItem
                as="button"
                className="d-flex align-items-center gap-2 py-2"
                onClick={() => setRestableciendo(true)}
              >
                <CIcon icon={cilLockLocked} />
                Restablecer contraseña
              </CDropdownItem>
              <CDropdownItem
                as="button"
                className="d-flex align-items-center gap-2 py-2"
                onClick={() => setCambiandoEstado(true)}
              >
                <CIcon icon={persona.activo ? cilBan : cilCheckCircle} />
                {persona.activo ? 'Desactivar' : 'Activar'}
              </CDropdownItem>
              <CDropdownDivider className="my-1" />
            </>
          )}
          {/* En rojo y separado, como «Cerrar sesión»: rojo = no se puede deshacer. */}
          <CDropdownItem
            as="button"
            className="d-flex align-items-center gap-2 py-2 text-danger"
            onClick={() => setAEliminar(true)}
          >
            <CIcon icon={cilTrash} />
            Eliminar
          </CDropdownItem>
        </CDropdownMenu>
      </CDropdown>

      {restableciendo && (
        <DialogoRestablecerContrasena
          usuario={{ identificador: String(persona.legajo), nombre: persona.nombre }}
          onCerrar={() => setRestableciendo(false)}
        />
      )}

      {cambiandoEstado && (
        <DialogoEstado
          persona={persona}
          onCerrar={() => setCambiandoEstado(false)}
          onCambiado={() => {
            setCambiandoEstado(false);
            alCambiar();
          }}
        />
      )}

      <DialogoEliminar
        visible={aEliminar}
        eliminando={eliminando}
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(false)}
      >
        {avisoEliminar}
      </DialogoEliminar>
    </>
  );
}
