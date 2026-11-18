'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CIcon from '@coreui/icons-react';
import { cilLockLocked, cilUser, cilWarning } from '@coreui/icons';
import { CSpinner } from '@coreui/react';
import { login } from '@/servicios/auth.js';
import { normalizarRol, inicioPorRol, rutaPermitidaParaRol } from '@/utils/roles.js';
import estilos from './login.module.css';

/*
  El fondo: columnas de comprobantes que suben despacio (mundo «Talonario»).
  Los numeros son de adorno, no son OT reales. Va aria-hidden: no aporta
  nada a quien usa lector de pantalla.
*/
const COLUMNAS = [
  { numeros: [112, 87, 140, 63, 129, 98], duracion: '95s', retraso: '-12s' },
  { numeros: [54, 131, 76, 118, 45, 102], duracion: '120s', retraso: '-40s' },
  { numeros: [143, 69, 121, 38, 107, 84], duracion: '105s', retraso: '-70s' },
  { numeros: [91, 26, 137, 72, 115, 59], duracion: '130s', retraso: '-25s' },
  { numeros: [125, 48, 99, 133, 66, 110], duracion: '100s', retraso: '-55s' },
];

/** Cada cuantos comprobantes uno lleva su sello de terminado. */
const CADA_SELLO = 3;

function ComprobanteDeFondo({ numero, conSello }) {
  return (
    <div className={estilos.comprobante}>
      <div className={estilos.talon}>
        <span className={estilos.talonRotulo}>OT N°</span>
        <span className={estilos.talonNumero}>{numero}</span>
      </div>
      <div className={estilos.cuerpo}>
        <div className={estilos.renglon} style={{ width: '80%' }} />
        <div className={estilos.renglon} style={{ width: '55%' }} />
        <div className={estilos.renglon} style={{ width: '68%' }} />
        {conSello && <span className={estilos.selloFondo}>FINALIZADA</span>}
      </div>
    </div>
  );
}

function FondoTalonario() {
  return (
    <div className={estilos.fondo} aria-hidden="true">
      {COLUMNAS.map((columna, indiceColumna) => (
        <div key={indiceColumna} className={estilos.columna}>
          <div
            className={estilos.tira}
            style={{ '--duracion': columna.duracion, '--retraso': columna.retraso }}
          >
            {/* Dos veces la misma tira: asi la vuelta del movimiento no se ve. */}
            {[...columna.numeros, ...columna.numeros].map((numero, indice) => (
              <ComprobanteDeFondo
                key={indice}
                numero={numero}
                conSello={(indice + indiceColumna) % CADA_SELLO === 0}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [identificador, setIdentificador] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  /*
    El aviso de sesion vencida sale de la direccion (?expirada=true): no hace
    falta guardarlo en un estado. Se oculta cuando la persona intenta entrar.
  */
  const [avisoDescartado, setAvisoDescartado] = useState(false);
  const avisoExpirada = searchParams.get('expirada') === 'true' && !avisoDescartado;
  // Credenciales correctas: cae el sello mientras se abre el sistema.
  const [autorizado, setAutorizado] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!identificador.trim() || !password) {
      setErrorMsg('Completá el usuario y la contraseña.');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setAvisoDescartado(true);

    try {
      const response = await login(identificador.trim(), password);

      if (!response.ok) {
        throw new Error(response.mensaje || 'Credenciales incorrectas');
      }

      const user = response.datos;
      const rol = normalizarRol(user?.rol);
      setAutorizado(true);

      if (user.requirePasswordChange) {
        router.push('/configuracion/cambiar-password');
      } else {
        const rutaRedireccion = searchParams.get('redireccion');
        if (
          rutaRedireccion &&
          rutaRedireccion.startsWith('/') &&
          !rutaRedireccion.startsWith('//') &&
          rutaRedireccion !== '/' &&
          rutaPermitidaParaRol(rol, rutaRedireccion)
        ) {
          router.push(rutaRedireccion);
        } else {
          router.push(inicioPorRol(rol));
        }
      }
    } catch (error) {
      // Regla de seguridad y aceptación: mensaje genérico para evitar enumeración
      setErrorMsg('El usuario o la contraseña no son correctos. Revisalos y volvé a intentar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={estilos.tarjeta}>
      {autorizado && (
        <span className={estilos.selloIngreso} role="status">
          Autorizado
        </span>
      )}
      <div className="p-4 p-sm-5">
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
            UTN - FRRe
          </div>
          {/* Linea de troquel: la tarjeta es un comprobante recien arrancado. */}
          <div className={estilos.troquel} />
        </div>

        {/* Aviso de sesión expirada */}
        {avisoExpirada && !errorMsg && (
          <div
            className={`alert alert-warning py-2 px-3 small d-flex align-items-center gap-2 mb-4 ${estilos.aviso}`}
            role="alert"
            style={{ borderRadius: 'var(--sigma-radio-sm)' }}
          >
            <CIcon icon={cilWarning} className="flex-shrink-0" />
            <span>Tu sesión venció. Volvé a iniciar sesión.</span>
          </div>
        )}

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
                placeholder="Tu contraseña"
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
              className={`alert alert-danger py-2 px-3 small d-flex align-items-center gap-2 mb-4 ${estilos.aviso}`}
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
  );
}

export default function LoginPage() {
  return (
    <div className={estilos.pagina}>
      <FondoTalonario />
      <Suspense fallback={<div className="spinner-border text-primary" role="status" />}>
        <FormularioLogin />
      </Suspense>
    </div>
  );
}
