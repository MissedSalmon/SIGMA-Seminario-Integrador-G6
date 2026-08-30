'use client';

/**
 * Contexto de toasts: el mensaje flotante que confirma que una accion
 * (crear, editar, eliminar) se hizo bien o fallo.
 *
 * Se usa con el hook useToast() desde cualquier componente cliente que este
 * dentro de <ProveedorToast> (montado una sola vez en LayoutAdmin.js):
 *
 *   const { mostrarToast } = useToast();
 *   mostrarToast({ tipo: 'exito', mensaje: 'Se guardo el edificio.' });
 */
import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ContextoToast = createContext(null);

const DURACION_MS = 4000;

export function ProveedorToast({ children }) {
  const [toasts, setToasts] = useState([]);

  const cerrarToast = useCallback((id) => {
    setToasts((actuales) => actuales.filter((toast) => toast.id !== id));
  }, []);

  const mostrarToast = useCallback(
    ({ tipo = 'exito', mensaje }) => {
      if (!mensaje) return;

      const id = Date.now() + Math.random();
      setToasts((actuales) => [...actuales, { id, tipo, mensaje }]);

      setTimeout(() => cerrarToast(id), DURACION_MS);
    },
    [cerrarToast]
  );

  const valor = useMemo(() => ({ toasts, mostrarToast, cerrarToast }), [toasts, mostrarToast, cerrarToast]);

  return <ContextoToast.Provider value={valor}>{children}</ContextoToast.Provider>;
}

export function useToast() {
  const contexto = useContext(ContextoToast);

  if (!contexto) {
    throw new Error('useToast se tiene que usar adentro de <ProveedorToast>.');
  }

  return contexto;
}
