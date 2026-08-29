'use client';

/**
 * Estado compartido del layout: si la barra lateral esta abierta o cerrada.
 *
 * El boton para abrirla vive en el encabezado y la barra vive al costado:
 * son dos componentes distintos que necesitan el mismo dato, por eso va en un
 * contexto de React y no en el estado de uno de los dos.
 */
import { createContext, useContext, useState } from 'react';

const ContextoLayout = createContext(null);

export function ProveedorLayout({ children }) {
  // En pantallas chicas arranca cerrada; CoreUI se encarga del resto.
  const [barraVisible, setBarraVisible] = useState(true);

  return (
    <ContextoLayout.Provider value={{ barraVisible, setBarraVisible }}>
      {children}
    </ContextoLayout.Provider>
  );
}

/**
 * Unico nombre en ingles del proyecto, y es a proposito: React exige que todo
 * hook se llame `useAlgo`. Si se llamara `usarLayout`, ESLint lo rechaza.
 */
export function useLayout() {
  const contexto = useContext(ContextoLayout);

  if (!contexto) {
    throw new Error('useLayout() se tiene que usar dentro de <ProveedorLayout>.');
  }

  return contexto;
}
