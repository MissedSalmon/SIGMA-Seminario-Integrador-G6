'use client';

/**
 * /perfil - los datos de la cuenta de quien inicio sesion.
 *
 * Es igual para los tres roles (administrador, tecnico y solicitante): legajo,
 * nombre y apellido, DNI, CUIL, fecha de nacimiento, email, telefono y el rol
 * que ocupa. El legajo y el rol se muestran pero no se pueden cambiar; el resto
 * lo corrige la misma persona.
 *
 * Arriba va la credencial del mundo «Talonario» (ver frontend/DESIGN.md): el
 * talon con el legajo, el nombre y el rol. Debajo, el formulario con los datos
 * personales, y al final la seguridad de la cuenta (cambiar la contraseña).
 */
import { useEffect, useMemo, useState } from 'react';
import { CButton, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import CampoDni from '@/componentes/formulario/CampoDni.js';
import CampoCuil from '@/componentes/formulario/CampoCuil.js';
import CampoTelefono from '@/componentes/formulario/CampoTelefono.js';
import DialogoCambiarContrasena from '@/componentes/usuarios/CambioContrasena.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { actualizarPerfil, obtenerPerfil } from '@/servicios/auth.js';
import { normalizarRol } from '@/utils/roles.js';
import { fechaMinimaParaEdad, hoyTexto } from '@/utils/fechas.js';
import {
  formatearCuil,
  formatearTelefono,
  validarCuil,
  validarDni,
  validarEmail,
  validarTelefono,
} from '@/utils/validaciones.js';

/** Como se nombra cada rol en pantalla. */
const NOMBRE_ROL = {
  administrador: 'Administrador',
  tecnico: 'Técnico',
  autorizado: 'Solicitante',
};

/** Los anios cumplidos que pide el sistema, igual que el alta de un solicitante. */
const EDAD_MINIMA = 18;

/** Los datos que se pueden editar, como los manda la API. */
function datosEditables(perfil) {
  return {
    nombre: perfil?.nombre ?? '',
    dni: perfil?.dni ?? '',
    cuil: formatearCuil(perfil?.cuil ?? ''),
    fechaNacimiento: perfil?.fechaNacimiento ?? '',
    email: perfil?.email ?? '',
    telefono: formatearTelefono(perfil?.telefono ?? ''),
  };
}

export default function PerfilPage() {
  const { verificarSesion } = useSesion();
  const { mostrarToast } = useToast();

  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  const [datos, setDatos] = useState(datosEditables(null));
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPerfil()
      .then((res) => {
        if (res.ok) {
          setPerfil(res.datos);
          setDatos(datosEditables(res.datos));
        }
      })
      .catch((fallo) => console.error('Error al obtener perfil:', fallo))
      .finally(() => setCargando(false));
  }, []);

  const rol = normalizarRol(perfil?.rol);
  const esSolicitante = rol === 'autorizado';
  const fechaMaximaNacimiento = useMemo(() => fechaMinimaParaEdad(EDAD_MINIMA), []);

  const errores = useMemo(() => {
    const encontrados = {};

    if (!datos.nombre.trim()) encontrados.nombre = 'El nombre y apellido es obligatorio.';

    // Al solicitante se le piden el DNI y la fecha desde su alta: no se pueden borrar.
    if (esSolicitante && !datos.dni.trim()) encontrados.dni = 'El DNI es obligatorio.';

    const problemaDni = validarDni(datos.dni);
    if (problemaDni) encontrados.dni = problemaDni;

    const problemaCuil = validarCuil(datos.cuil, datos.dni);
    if (problemaCuil) encontrados.cuil = problemaCuil;

    const problemaEmail = validarEmail(datos.email);
    if (problemaEmail) encontrados.email = problemaEmail;

    const problemaTelefono = validarTelefono(datos.telefono);
    if (problemaTelefono) encontrados.telefono = problemaTelefono;

    if (!datos.fechaNacimiento) {
      if (esSolicitante) encontrados.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
    } else if (datos.fechaNacimiento > hoyTexto()) {
      encontrados.fechaNacimiento = 'La fecha no puede ser posterior a hoy.';
    } else if (datos.fechaNacimiento > fechaMaximaNacimiento) {
      encontrados.fechaNacimiento = `Tenés que tener ${EDAD_MINIMA} años cumplidos.`;
    }

    return encontrados;
  }, [datos, esSolicitante, fechaMaximaNacimiento]);

  const hayErrores = Object.keys(errores).length > 0;

  function cambiar(campo) {
    return (valor) => setDatos((anteriores) => ({ ...anteriores, [campo]: valor }));
  }

  /** «Cancelar» deja los datos como estaban guardados. */
  function descartarCambios() {
    setDatos(datosEditables(perfil));
    setRevisado(false);
    setError('');
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');

    if (hayErrores) return;

    setGuardando(true);
    try {
      const res = await actualizarPerfil({ ...datos, nombre: datos.nombre.trim(), email: datos.email.trim() });
      setPerfil(res.datos);
      setDatos(datosEditables(res.datos));
      setRevisado(false);
      mostrarToast({ tipo: 'exito', mensaje: 'Se guardaron tus datos.' });
      // El resto de la pantalla (encabezado, menú) lee la sesión: se vuelve a pedir.
      verificarSesion();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <>
        <EncabezadoPagina titulo="Mi perfil" />
        <div className="sigma-credencial" aria-busy="true">
          <div className="sigma-credencial-talon" />
          <div className="sigma-credencial-cuerpo">
            <div className="sigma-esqueleto-linea w-50 mb-3" />
            <div className="sigma-esqueleto-linea w-75" />
          </div>
        </div>
      </>
    );
  }

  if (!perfil) {
    return (
      <>
        <EncabezadoPagina titulo="Mi perfil" />
        <Aviso mensaje="No se pudo cargar la información del perfil. Recargá la página para volver a intentar." />
      </>
    );
  }

  const legajo = perfil.legajo || perfil.identificador;
  const nombreRol = NOMBRE_ROL[rol] ?? perfil.rol;

  return (
    <>
      <EncabezadoPagina titulo="Mi perfil" />

      <section className="sigma-credencial" aria-label="Datos de la cuenta">
        <div className="sigma-credencial-talon">
          <span className="sigma-talon-rotulo">Legajo</span>
          <span className="sigma-talon-numero">{legajo ?? '-'}</span>
        </div>

        <div className="sigma-credencial-cuerpo justify-content-center">
          <div className="sigma-credencial-titular">
            <h2 className="sigma-credencial-nombre">{perfil.nombre || legajo}</h2>
            {/* El rol es una categoria, no un estado: va en la etiqueta neutra. */}
            <span className="sigma-etiqueta">{nombreRol}</span>
          </div>
        </div>
      </section>

      <CCard className="mb-3">
        <CCardBody>
          <Aviso mensaje={error} onCerrar={() => setError('')} />

          <form noValidate onSubmit={manejarEnvio}>
            <h2 className="sigma-seccion-titulo">Datos personales</h2>

            <div className="sigma-campos mb-4">
              <Campo id="legajo" etiqueta="Legajo" valor={legajo ?? ''} alCambiar={() => {}} deshabilitado ancho={8} />
              <Campo id="rol" etiqueta="Rol" valor={nombreRol} alCambiar={() => {}} deshabilitado ancho={13} />
            </div>

            <div className="sigma-campos mb-4">
              <Campo
                id="nombre"
                etiqueta="Nombre y apellido"
                valor={datos.nombre}
                alCambiar={cambiar('nombre')}
                placeholder="Juan Pérez"
                obligatorio
                maxLength={150}
                ancho={18}
                revisado={revisado}
                error={errores.nombre}
              />

              <CampoDni
                valor={datos.dni}
                alCambiar={cambiar('dni')}
                obligatorio={esSolicitante}
                ancho={8}
                revisado={revisado}
                error={errores.dni}
              />

              <CampoCuil valor={datos.cuil} alCambiar={cambiar('cuil')} ancho={13} revisado={revisado} error={errores.cuil} />

              <Campo
                id="fechaNacimiento"
                etiqueta="Fecha de nacimiento"
                tipoHtml="date"
                valor={datos.fechaNacimiento}
                alCambiar={cambiar('fechaNacimiento')}
                obligatorio={esSolicitante}
                max={fechaMaximaNacimiento}
                revisado={revisado}
                error={errores.fechaNacimiento}
              />

              <Campo
                id="email"
                etiqueta="Email"
                tipoHtml="email"
                valor={datos.email}
                alCambiar={cambiar('email')}
                placeholder="jperez@frre.utn.edu.ar"
                maxLength={150}
                ancho={21}
                revisado={revisado}
                error={errores.email}
              />

              <CampoTelefono
                valor={datos.telefono}
                alCambiar={cambiar('telefono')}
                ancho={11}
                revisado={revisado}
                error={errores.telefono}
              />
            </div>

            {revisado && hayErrores && (
              <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
                Revisá los campos marcados y volvé a guardar.
              </p>
            )}

            <BotonesAccion procesando={guardando} alCancelar={descartarCambios} />
          </form>
        </CCardBody>
      </CCard>

      <section className="sigma-credencial-seguridad" aria-labelledby="titulo-seguridad">
        <div>
          <h2 id="titulo-seguridad" className="sigma-seccion-titulo border-0 p-0 mb-1">
            Seguridad
          </h2>
          <p className="text-body-secondary mb-0">La contraseña con la que entrás a SIGMA.</p>
        </div>
        <CButton type="button" color="primary" variant="outline" onClick={() => setCambiandoContrasena(true)}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Cambiar contraseña
        </CButton>
      </section>

      {cambiandoContrasena && <DialogoCambiarContrasena onCerrar={() => setCambiandoContrasena(false)} />}
    </>
  );
}
