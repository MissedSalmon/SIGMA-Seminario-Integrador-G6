'use client';

/**
 * Contexto de sesion: expone el usuario actual (rol, identificador) a cualquier
 * componente dentro del layout autenticado.
 *
 * El perfil se pide una sola vez al montar el layout y se guarda aca. Los
 * componentes que necesiten saber el rol (como la barra lateral) lo leen de
 * este contexto sin hacer su propia llamada a la API.
 */
import { createContext, useContext, useEffect, useState } from 'react';
import { obtenerPerfil } from '@/servicios/auth.js';

const ContextoSesion = createContext(null);

export function ProveedorSesion({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerPerfil()
      .then((res) => {
        if (res?.ok && res.datos) {
          setUsuario(res.datos);
        }
      })
      .catch(() => {
        // Si falla (sesión expirada, etc.) el middleware de Next.js ya redirige.
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  return (
    <ContextoSesion.Provider value={{ usuario, cargando }}>
      {children}
    </ContextoSesion.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(ContextoSesion);
  if (!ctx) throw new Error('useSesion() se tiene que usar dentro de <ProveedorSesion>.');
  return ctx;
}
