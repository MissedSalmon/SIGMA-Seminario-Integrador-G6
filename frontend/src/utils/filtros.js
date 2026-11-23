'use client';

/**
 * Persistencia de filtros y búsquedas en sessionStorage.
 *
 * Guarda el estado por ruta (pathname) y clave para que al navegar entre
 * pantallas dentro de la sesión los filtros aplicados se mantengan tal como se
 * dejaron, y sólo se reseteen cuando se limpian manualmente o al cerrar sesión.
 */
import { useCallback, useState } from 'react';
import { usePathname } from 'next/navigation';

const PREFIJO = 'sigma-filtro:';

function armarClave(ruta, clave) {
  return `${PREFIJO}${ruta}:${clave}`;
}

function leerGuardado(claveCompleta, valorInicial) {
  if (typeof window === 'undefined') return valorInicial;
  try {
    const guardado = sessionStorage.getItem(claveCompleta);
    return guardado !== null ? JSON.parse(guardado) : valorInicial;
  } catch {
    return valorInicial;
  }
}

function escribirGuardado(claveCompleta, valor, valorInicial) {
  if (typeof window === 'undefined') return;
  try {
    if (valor === valorInicial) {
      sessionStorage.removeItem(claveCompleta);
    } else {
      sessionStorage.setItem(claveCompleta, JSON.stringify(valor));
    }
  } catch {
    // Si sessionStorage no está disponible, funciona en memoria sin romper la pantalla.
  }
}

/**
 * Funciona como useState, pero recuerda el valor en sessionStorage para la
 * pantalla actual (según su ruta).
 *
 * @param {string} clave - Nombre del filtro dentro de la pantalla (ej. 'estado', 'desde').
 * @param {*} [valorInicial=''] - Valor por defecto cuando no hay filtro guardado.
 * @param {string} [rutaFija] - Ruta opcional si se quiere fijar en vez de usar usePathname().
 */
export function useFiltroPersistente(clave, valorInicial = '', rutaFija) {
  const pathname = usePathname();
  const ruta = rutaFija ?? pathname;
  const claveCompleta = armarClave(ruta, clave);

  const [estado, setEstado] = useState(() => ({
    claveCompleta,
    valor: leerGuardado(claveCompleta, valorInicial),
  }));

  const valorActual =
    estado.claveCompleta === claveCompleta
      ? estado.valor
      : leerGuardado(claveCompleta, valorInicial);

  const setValor = useCallback(
    (nuevo) => {
      setEstado((anterior) => {
        const base =
          anterior.claveCompleta === claveCompleta
            ? anterior.valor
            : leerGuardado(claveCompleta, valorInicial);
        const resuelto = typeof nuevo === 'function' ? nuevo(base) : nuevo;
        escribirGuardado(claveCompleta, resuelto, valorInicial);
        return { claveCompleta, valor: resuelto };
      });
    },
    [claveCompleta, valorInicial]
  );

  return [valorActual, setValor];
}

/**
 * Borra todos los filtros guardados en sessionStorage (por ejemplo, al cerrar sesión).
 */
export function olvidarFiltrosGuardados() {
  if (typeof window === 'undefined') return;
  try {
    const claves = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const clave = sessionStorage.key(i);
      if (clave && clave.startsWith(PREFIJO)) {
        claves.push(clave);
      }
    }
    claves.forEach((clave) => sessionStorage.removeItem(clave));
  } catch {
    // Nada que borrar.
  }
}
