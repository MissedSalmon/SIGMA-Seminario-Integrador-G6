'use client';

/**
 * Formulario de alta de un usuario (gestion de usuarios, Sprint 6).
 *
 * El usuario es para una persona que ya esta registrada como administrador,
 * tecnico o usuario autorizado. Primero se elige el rol y despues la persona:
 * la lista solo muestra a las de ese rol que todavia no tienen usuario.
 *
 * La contraseña inicial la tiene que cambiar el usuario la primera vez que entra.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { OPCIONES_ROL } from '@/componentes/usuarios/roles.js';
import { crearUsuario, listarPersonasSinUsuario } from '@/servicios/usuarios.js';

/** El mismo minimo que pide la API (y el cambio de contraseña de HU-30). */
const LARGO_MINIMO_PASSWORD = 6;

export default function FormularioUsuario() {
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [rol, setRol] = useState('');
  const [legajo, setLegajo] = useState('');
  const [nombreUsuario, setNombreUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [passwordRepetida, setPasswordRepetida] = useState('');

  const [personas, setPersonas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarPersonasSinUsuario()
      .then(setPersonas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const opcionesPersona = useMemo(
    () =>
      personas
        .filter((persona) => persona.rol === rol)
        .map((persona) => ({ valor: persona.legajo, texto: `${persona.nombre} · Legajo ${persona.legajo}` })),
    [personas, rol]
  );

  function elegirRol(nuevoRol) {
    setRol(nuevoRol);
    // La persona elegida era de otro rol.
    setLegajo('');
  }

  function elegirPersona(nuevoLegajo) {
    // Se propone el legajo como nombre de usuario, igual que en las altas de HU-30.
    if (!nombreUsuario.trim() || nombreUsuario === legajo) setNombreUsuario(nuevoLegajo);
    setLegajo(nuevoLegajo);
  }

  const errores = useMemo(() => {
    const encontrados = {};

    if (!rol) encontrados.rol = 'Elegí el rol.';
    if (!legajo) encontrados.legajo = 'Elegí la persona.';

    if (!nombreUsuario.trim()) encontrados.nombreUsuario = 'El nombre de usuario es obligatorio.';
    else if (/\s/.test(nombreUsuario.trim())) encontrados.nombreUsuario = 'No puede tener espacios.';

    if (password.length < LARGO_MINIMO_PASSWORD) {
      encontrados.password = `Tiene que tener al menos ${LARGO_MINIMO_PASSWORD} caracteres.`;
    }
    if (passwordRepetida !== password) encontrados.passwordRepetida = 'Las contraseñas no coinciden.';

    return encontrados;
  }, [rol, legajo, nombreUsuario, password, passwordRepetida]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      const nuevo = await crearUsuario({ rol, legajo, nombreUsuario: nombreUsuario.trim(), password });
      mostrarToast({ tipo: 'exito', mensaje: `Se agregó el usuario "${nuevo.nombreUsuario}".` });
      router.push('/usuarios');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <CCard>
        <CCardBody>
          <Cargando texto="Cargando el formulario..." />
        </CCardBody>
      </CCard>
    );
  }

  const sinPersonas = Boolean(rol) && opcionesPersona.length === 0;

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Persona</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="rol"
              etiqueta="Rol"
              tipo="lista"
              valor={rol}
              alCambiar={elegirRol}
              opciones={OPCIONES_ROL}
              obligatorio
              ancho={20}
              revisado={revisado}
              error={errores.rol}
            />

            <Campo
              id="legajo"
              etiqueta="Persona"
              tipo="buscador"
              valor={legajo}
              alCambiar={elegirPersona}
              opciones={opcionesPersona}
              placeholder={rol ? 'Buscar por nombre o legajo' : 'Primero elegí el rol'}
              deshabilitado={!rol || sinPersonas}
              obligatorio
              ancho={34}
              revisado={revisado}
              error={errores.legajo}
            />
          </div>

          {sinPersonas && (
            <Aviso
              color="warning"
              mensaje="Todas las personas registradas con ese rol ya tienen usuario."
            />
          )}

          <h2 className="sigma-seccion-titulo">Acceso</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="nombreUsuario"
              etiqueta="Nombre de usuario"
              valor={nombreUsuario}
              alCambiar={setNombreUsuario}
              placeholder="jperez"
              obligatorio
              maxLength={50}
              ancho={20}
              revisado={revisado}
              error={errores.nombreUsuario}
            />

            <Campo
              id="password"
              etiqueta="Contraseña inicial"
              tipoHtml="password"
              valor={password}
              alCambiar={setPassword}
              obligatorio
              maxLength={72}
              ancho={20}
              revisado={revisado}
              error={errores.password}
            />

            <Campo
              id="passwordRepetida"
              etiqueta="Repetir contraseña"
              tipoHtml="password"
              valor={passwordRepetida}
              alCambiar={setPasswordRepetida}
              obligatorio
              maxLength={72}
              ancho={20}
              revisado={revisado}
              error={errores.passwordRepetida}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <BotonesAccion procesando={guardando} hrefCancelar="/usuarios" className="mt-4" />
        </form>
      </CCardBody>
    </CCard>
  );
}
