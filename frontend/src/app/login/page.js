'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser, cilWarning } from '@coreui/icons';
import { CSpinner } from '@coreui/react';
import { login } from '@/servicios/auth.js';

export default function LoginPage() {
  const router = useRouter();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!identificador.trim() || !password) {
      setErrorMsg('Por favor complete todos los campos.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    try {
      const response = await login(identificador.trim(), password);

      if (!response.ok) {
        throw new Error(response.mensaje || 'Credenciales incorrectas');
      }

      const user = response.datos;
      if (user.requirePasswordChange) {
        router.push('/configuracion/cambiar-password');
      } else {
        // Redirigir según rol
        if (user.rol === 'administrador') {
          router.push('/');
        } else if (user.rol === 'tecnico') {
          router.push('/tareas');
        } else {
          router.push('/tickets');
        }
      }
    } catch (error) {
      // Regla de seguridad y aceptación: mensaje genérico para evitar enumeración
      setErrorMsg('Credenciales incorrectas. Verifique su usuario o contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-3"
      style={{ backgroundColor: 'var(--sigma-fondo)' }}
    >
      <div
        className="card border shadow-sm w-100"
        style={{
          maxWidth: '420px',
          borderRadius: 'var(--sigma-radio-md)',
          backgroundColor: 'var(--sigma-superficie)',
          borderColor: 'var(--sigma-borde)',
        }}
      >
        <div className="card-body p-4 p-sm-5">
          {/* Encabezado institucional minimalista */}
          <div className="text-center mb-4">
            <span
              className="sigma-marca"
              style={{
                color: 'var(--sigma-teal)',
                fontSize: '2rem',
                display: 'block',
                lineHeight: 1.2,
              }}
            >
              SIGMA
            </span>
            <div
              className="mt-1"
              style={{
                fontSize: '0.82rem',
                color: 'var(--sigma-texto-secundario)',
                lineHeight: 1.3,
              }}
            >
              Sistema Integral de Gestión de Mantenimiento de Activos
            </div>
            <div
              className="fw-semibold mt-1"
              style={{
                fontSize: '0.78rem',
                color: 'var(--sigma-ink)',
                letterSpacing: '0.02em',
              }}
            >
              UTN — FRRe
            </div>
          </div>

          <form onSubmit={onSubmit} noValidate className="mt-4">
            {/* Campo Identificador */}
            <div className="mb-3">
              <label
                htmlFor="identificador"
                className="form-label"
                style={{ color: 'var(--sigma-ink)' }}
              >
                Usuario o Legajo
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-white"
                  style={{
                    borderColor: 'var(--sigma-borde)',
                    color: 'var(--sigma-texto-secundario)',
                  }}
                >
                  <CIcon icon={cilUser} />
                </span>
                <input
                  id="identificador"
                  name="identificador"
                  type="text"
                  className="form-control"
                  placeholder="Ej: 12345 o usuario"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  disabled={isLoading}
                  autoFocus
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="mb-4">
              <label
                htmlFor="password"
                className="form-label"
                style={{ color: 'var(--sigma-ink)' }}
              >
                Contraseña
              </label>
              <div className="input-group">
                <span
                  className="input-group-text bg-white"
                  style={{
                    borderColor: 'var(--sigma-borde)',
                    color: 'var(--sigma-texto-secundario)',
                  }}
                >
                  <CIcon icon={cilLockLocked} />
                </span>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-control"
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {/* Mensaje de error */}
            {errorMsg && (
              <div
                className="alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4"
                role="alert"
                style={{ borderRadius: 'var(--sigma-radio-sm)' }}
              >
                <CIcon icon={cilWarning} className="flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Botón de ingreso */}
            <button
              type="submit"
              className="btn btn-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <CSpinner size="sm" />
                  <span>Iniciando sesión...</span>
                </>
              ) : (
                <span>Iniciar sesión</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
