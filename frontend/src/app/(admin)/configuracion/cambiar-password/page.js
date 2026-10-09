'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody, CCardHeader } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilWarning, cilCheckCircle } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { cambiarPassword } from '@/servicios/auth.js';

export default function CambiarPasswordPage() {
  const router = useRouter();
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordRepetir, setPasswordRepetir] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [procesando, setProcesando] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!passwordActual || !passwordNueva || !passwordRepetir) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    if (passwordNueva.length < 6) {
      setErrorMsg('La nueva contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva !== passwordRepetir) {
      setErrorMsg('Las contraseñas nuevas no coinciden.');
      return;
    }

    setProcesando(true);

    try {
      const response = await cambiarPassword(passwordActual, passwordNueva);

      if (!response.ok) {
        throw new Error(response.mensaje || 'Error al cambiar la contraseña');
      }

      setSuccessMsg('Contraseña actualizada con éxito. Redirigiendo...');
      setTimeout(() => {
        router.push('/');
      }, 1500);
    } catch (error) {
      setErrorMsg(error.message || 'Error al intentar cambiar la contraseña.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div>
      <EncabezadoPagina titulo="Cambiar contraseña" />

      <CCard
        className="shadow-sm border mb-4"
        style={{
          maxWidth: '34rem',
          borderRadius: 'var(--sigma-radio-md)',
          borderColor: 'var(--sigma-borde)',
        }}
      >
        <CCardHeader className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
          <CIcon icon={cilLockLocked} className="text-primary" />
          <strong style={{ color: 'var(--sigma-ink)' }}>Actualización de clave</strong>
        </CCardHeader>

        <CCardBody className="p-4">
          <p className="text-secondary small mb-4">
            Ingrese su contraseña actual y defina una nueva contraseña de al menos 6 caracteres.
          </p>

          <form onSubmit={onSubmit} noValidate>
            <div className="mb-3">
              <label
                htmlFor="passwordActual"
                className="form-label"
                style={{ color: 'var(--sigma-ink)' }}
              >
                Contraseña actual
              </label>
              <input
                id="passwordActual"
                name="passwordActual"
                type="password"
                className="form-control"
                placeholder="Ingrese su contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                disabled={procesando}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="mb-3">
              <label
                htmlFor="passwordNueva"
                className="form-label"
                style={{ color: 'var(--sigma-ink)' }}
              >
                Nueva contraseña
              </label>
              <input
                id="passwordNueva"
                name="passwordNueva"
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                disabled={procesando}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="passwordRepetir"
                className="form-label"
                style={{ color: 'var(--sigma-ink)' }}
              >
                Repetir nueva contraseña
              </label>
              <input
                id="passwordRepetir"
                name="passwordRepetir"
                type="password"
                className="form-control"
                placeholder="Vuelva a escribir la nueva contraseña"
                value={passwordRepetir}
                onChange={(e) => setPasswordRepetir(e.target.value)}
                disabled={procesando}
                autoComplete="new-password"
                required
              />
            </div>

            {errorMsg && (
              <div
                className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                role="alert"
                style={{ borderRadius: 'var(--sigma-radio-sm)' }}
              >
                <CIcon icon={cilWarning} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div
                className="alert alert-success py-2 px-3 small d-flex align-items-center gap-2 mb-3"
                role="alert"
                style={{ borderRadius: 'var(--sigma-radio-sm)' }}
              >
                <CIcon icon={cilCheckCircle} className="flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            <BotonesAccion
              texto="Guardar"
              textoProcesando="Guardando..."
              procesando={procesando}
              hrefCancelar="/perfil"
              className="mt-2"
            />
          </form>
        </CCardBody>
      </CCard>
    </div>
  );
}
