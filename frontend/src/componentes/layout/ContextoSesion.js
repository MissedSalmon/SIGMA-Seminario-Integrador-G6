'use client';

/**
 * Contexto de sesion: expone el usuario actual (rol, identificador) a cualquier
 * componente dentro del layout autenticado.
 *
 * El perfil se pide al montar el layout y se revalida si la página se recupera
 * de la caché del navegador (Back/Forward Cache). Si la sesión venció o no existe,
 * bloquea el renderizado de datos y redirige a /login con aviso de sesión expirada.
 */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { obtenerPerfil } from '@/servicios/auth.js';
import { normalizarRol } from '@/utils/roles.js';

const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [sesionExpirada, setSesionExpirada] = useState(false);

  const redirigirExpirada = useCallback(() => {
    setUsuario(null);
    setSesionExpirada(true);
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      const rutaActual = window.location.pathname + window.location.search;
      const destino =
        rutaActual && rutaActual !== '/'
          ? `/login?expirada=true&redireccion=${encodeURIComponent(rutaActual)}`
          : '/login?expirada=true';
      window.location.replace(destino);
    }
  }, []);

  const verificarSesion = useCallback(async () => {
    try {
      const res = await obtenerPerfil();
      if (res?.ok && res.datos) {
        const datosUsuario = {
          ...res.datos,
          rol: normalizarRol(res.datos.rol),
        };
        setUsuario(datosUsuario);
        setSesionExpirada(false);
      } else {
        redirigirExpirada();
      }
    } catch {
      redirigirExpirada();
    } finally {
      setCargando(false);
    }
  }, [redirigirExpirada]);

  useEffect(() => {
    verificarSesion();

    // Revalidación ante navegación de historial (botón atrás/adelante con bfcache)
    const alMostrarPagina = (evento) => {
      if (evento.persisted) {
        verificarSesion();
      }
    };

    window.addEventListener('pageshow', alMostrarPagina);
    return () => window.removeEventListener('pageshow', alMostrarPagina);
  }, [verificarSesion]);

  if (sesionExpirada || (!cargando && !usuario)) {
    return (
      <div
        className="min-vh-100 d-flex flex-column align-items-center justify-content-center p-4 text-center"
        style={{ backgroundColor: 'var(--sigma-fondo, #f8f9fa)' }}
      >
        <div className="spinner-border text-primary mb-3" role="status">
          <span className="visually-hidden">Cargando...</span>
        </div>
        <h5 className="text-body fw-bold mb-1">Sesión expirada</h5>
        <p className="text-secondary small mb-0">Redirigiendo a la pantalla de inicio de sesión...</p>
      </div>
    );
  }

  return (
    <ContextoSesion.Provider value={{ usuario, cargando, verificarSesion }}>
      {children}
    </ContextoSesion.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(ContextoSesion);
  if (!ctx) throw new Error('useSesion() se tiene que usar dentro de <ProveedorSesion>.');
  return ctx;
}
