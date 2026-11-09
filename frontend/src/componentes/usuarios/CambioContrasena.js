'use client';

/**
 * Cambio de la propia contraseña (HU-30). Lo usan la pantalla del cambio
 * obligatorio del primer ingreso y la ventana que se abre desde el perfil o
 * desde el menú de la cuenta, así las dos piden y controlan lo mismo.
 */
import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { cambiarPassword } from '@/servicios/auth.js';
import { LARGO_MAXIMO_PASSWORD, validarPasswordNueva } from '@/utils/contrasenas.js';

const ANCHO_CAMPO = 24;

/**
 * Los tres campos y el guardado. Devuelve `campos` para dibujar adentro de un
 * <form onSubmit={guardar}>, y llama a `alGuardado` cuando la API la cambió.
 */
export function useCambioContrasena({ alGuardado }) {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const errores = {};
  if (!actual) errores.actual = 'Escribí tu contraseña actual.';
  const problemaNueva = validarPasswordNueva(nueva);
  if (problemaNueva) errores.nueva = problemaNueva;
  else if (nueva === actual) errores.nueva = 'Tiene que ser distinta de la actual.';
  if (repetida !== nueva) errores.repetida = 'Las contraseñas no coinciden.';

  async function guardar(evento) {
    evento?.preventDefault();
    setRevisado(true);
    setError('');
    if (Object.keys(errores).length > 0) return;

    setGuardando(true);
    try {
      await cambiarPassword(actual, nueva);
      alGuardado();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const campos = (
    <>
      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <div className="d-flex flex-column gap-3">
        <Campo
          id="passwordActual"
          etiqueta="Contraseña actual"
          tipoHtml="password"
          valor={actual}
          alCambiar={setActual}
          obligatorio
          maxLength={LARGO_MAXIMO_PASSWORD}
          ancho={ANCHO_CAMPO}
          revisado={revisado}
          error={errores.actual}
        />
        <Campo
          id="passwordNueva"
          etiqueta="Contraseña nueva"
          tipoHtml="password"
          valor={nueva}
          alCambiar={setNueva}
          obligatorio
          maxLength={LARGO_MAXIMO_PASSWORD}
          ancho={ANCHO_CAMPO}
          revisado={revisado}
          error={errores.nueva}
        />
        <Campo
          id="passwordRepetida"
          etiqueta="Repetir contraseña nueva"
          tipoHtml="password"
          valor={repetida}
          alCambiar={setRepetida}
          obligatorio
          maxLength={LARGO_MAXIMO_PASSWORD}
          ancho={ANCHO_CAMPO}
          revisado={revisado}
          error={errores.repetida}
        />
      </div>
    </>
  );

  return { campos, guardar, guardando };
}

/** Se abre montándola y se cierra desmontándola, así cada vez arranca vacía. */
export default function DialogoCambiarContrasena({ onCerrar }) {
  const { mostrarToast } = useToast();
  const { campos, guardar, guardando } = useCambioContrasena({
    alGuardado: () => {
      mostrarToast({ tipo: 'exito', mensaje: 'Se cambió tu contraseña.' });
      onCerrar();
    },
  });

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center" aria-labelledby="titulo-cambiar-contrasena">
      <CModalHeader>
        <CModalTitle id="titulo-cambiar-contrasena">Cambiar contraseña</CModalTitle>
      </CModalHeader>

      <form noValidate onSubmit={guardar}>
        <CModalBody>{campos}</CModalBody>
        <CModalFooter>
          <BotonesAccion procesando={guardando} alCancelar={onCerrar} />
        </CModalFooter>
      </form>
    </CModal>
  );
}
