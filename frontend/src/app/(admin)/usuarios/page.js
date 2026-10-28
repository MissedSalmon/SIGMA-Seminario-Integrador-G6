'use client';

/**
 * /usuarios - listado de usuarios del sistema (gestion de usuarios, Sprint 6).
 *
 * Muestra el rol de cada usuario y si esta activo. Un usuario no se borra: se
 * desactiva (pierde el acceso, pero se conserva todo lo que registro) y se
 * puede volver a activar.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  CButton,
  CCard,
  CCardBody,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';
import { NOMBRES_ROL, OPCIONES_ROL } from '@/componentes/usuarios/roles.js';
import DialogoRestablecerContrasena, {
  AccionRestablecerContrasena,
} from '@/componentes/usuarios/RestablecerContrasena.js';
import { soloFechaLegible } from '@/utils/fechas.js';
import { listarUsuarios, desactivarUsuario, activarUsuario } from '@/servicios/usuarios.js';

const OPCIONES_ESTADO = [
  { valor: 'activo', texto: 'Activo' },
  { valor: 'inactivo', texto: 'Inactivo' },
];

export default function PantallaUsuarios() {
  const { mostrarToast } = useToast();
  const { usuario: sesion } = useSesion();

  const [usuarios, setUsuarios] = useState([]);
  const [filtroRol, setFiltroRol] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // El usuario que se va a activar o desactivar (abre la ventana de confirmacion).
  const [aCambiar, setACambiar] = useState(null);
  const [cambiando, setCambiando] = useState(false);
  const [aRestablecer, setARestablecer] = useState(null);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de desactivar).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarUsuarios();
        if (!vigente) return;
        setUsuarios(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    pedir();

    return () => {
      vigente = false;
    };
  }, [recarga]);

  // Son pocos usuarios: los filtros se aplican aca, sin volver a pedir la lista.
  const filtrados = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          (!filtroRol || usuario.rol === filtroRol) &&
          (!filtroEstado || usuario.activo === (filtroEstado === 'activo'))
      ),
    [usuarios, filtroRol, filtroEstado]
  );

  async function confirmarCambio() {
    setCambiando(true);
    setError('');

    try {
      if (aCambiar.activo) {
        await desactivarUsuario(aCambiar.idUsuario);
        mostrarToast({ tipo: 'exito', mensaje: `Se desactivó el usuario "${aCambiar.nombreUsuario}".` });
      } else {
        await activarUsuario(aCambiar.idUsuario);
        mostrarToast({ tipo: 'exito', mensaje: `Se activó el usuario "${aCambiar.nombreUsuario}".` });
      }
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setACambiar(null);
      setCambiando(false);
    }
  }

  const columnas = [
    {
      clave: 'nombreUsuario',
      encabezado: 'Usuario',
      render: (usuario) => <span className="fw-semibold">{usuario.nombreUsuario}</span>,
    },
    {
      clave: 'persona',
      encabezado: 'Persona',
      render: (usuario) => (
        <span className="text-body-secondary">
          {usuario.persona || '-'}
          {usuario.legajo && <span className="text-nowrap"> · Legajo {usuario.legajo}</span>}
        </span>
      ),
    },
    {
      clave: 'rol',
      encabezado: 'Rol',
      render: (usuario) => <span className="text-nowrap">{NOMBRES_ROL[usuario.rol] ?? usuario.rol}</span>,
    },
    {
      clave: 'activo',
      encabezado: 'Estado',
      render: (usuario) => <span className="text-nowrap">{usuario.activo ? 'Activo' : 'Inactivo'}</span>,
    },
    {
      clave: 'fechaCreacion',
      encabezado: 'Creado',
      render: (usuario) => (
        <span className="text-body-secondary text-nowrap">{soloFechaLegible(usuario.fechaCreacion)}</span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      // El administrador no se puede desactivar a si mismo, asi que en su fila no hay botones.
      render: (usuario) =>
        usuario.nombreUsuario === sesion?.identificador ? null : (
          <div className="d-flex justify-content-end align-items-center gap-1">
            <AccionRestablecerContrasena
              nombre={usuario.persona || usuario.nombreUsuario}
              onClick={() =>
                setARestablecer({
                  identificador: usuario.nombreUsuario,
                  nombre: usuario.persona || usuario.nombreUsuario,
                })
              }
            />
            <CButton
              size="sm"
              variant="outline"
              color={usuario.activo ? 'danger' : 'primary'}
              className="text-nowrap"
              onClick={() => setACambiar(usuario)}
            >
              {usuario.activo ? 'Desactivar' : 'Activar'}
            </CButton>
          </div>
        ),
    },
  ];

  const hayFiltros = filtroRol || filtroEstado;

  return (
    <>
      <EncabezadoPagina titulo="Usuarios" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtrados}
            claveFila={(usuario) => usuario.idUsuario}
            columnas={columnas}
            buscarPor={['nombreUsuario', 'persona', 'legajo']}
            placeholderBusqueda="Buscar por usuario, persona o legajo"
            filtros={[
              {
                etiqueta: 'Rol',
                valor: filtroRol,
                alCambiar: setFiltroRol,
                opciones: OPCIONES_ROL,
              },
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: OPCIONES_ESTADO,
              },
            ]}
            cargando={cargando}
            textoVacio={hayFiltros ? 'No hay usuarios con esos filtros.' : 'Todavía no hay usuarios cargados.'}
          />
        </CCardBody>
      </CCard>

      <CModal visible={Boolean(aCambiar)} onClose={() => setACambiar(null)} alignment="center">
        <CModalHeader>
          <CModalTitle>{aCambiar?.activo ? 'Desactivar usuario' : 'Activar usuario'}</CModalTitle>
        </CModalHeader>

        <CModalBody>
          {aCambiar?.activo ? (
            <>
              <p className="mb-0">
                Se va a desactivar el usuario <strong>{aCambiar?.nombreUsuario}</strong>.
              </p>
              <p className="text-body-secondary mt-2 mb-0">
                No va a poder iniciar sesión. No se borra nada de lo que registró, y se puede volver a activar.
              </p>
            </>
          ) : (
            <p className="mb-0">
              Se va a activar el usuario <strong>{aCambiar?.nombreUsuario}</strong>: vuelve a poder iniciar sesión.
            </p>
          )}
        </CModalBody>

        <CModalFooter>
          <BotonesAccion
            texto={aCambiar?.activo ? 'Desactivar' : 'Activar'}
            textoProcesando={aCambiar?.activo ? 'Desactivando...' : 'Activando...'}
            color={aCambiar?.activo ? 'danger' : 'primary'}
            procesando={cambiando}
            alAceptar={confirmarCambio}
            alCancelar={() => setACambiar(null)}
          />
        </CModalFooter>
      </CModal>

      <DialogoRestablecerContrasena
        usuario={aRestablecer}
        onCerrar={() => setARestablecer(null)}
      />
    </>
  );
}
