'use client';

/**
 * useEstadoGuardado: un useState que se acuerda del valor mientras dure la
 * pestaña del navegador (22/11/2026).
 *
 * Sirve para que los filtros de un listado sigan puestos al volver: se entra al
 * detalle de un activo, se aprieta «Volver al listado» y el listado aparece con
 * el mismo buscador, los mismos filtros y en la misma página.
 *
 *   const [filtroEstado, setFiltroEstado] = useEstadoGuardado('filtroEstado', '');
 *
 * El valor se guarda en sessionStorage con la dirección de la pantalla adelante
 * (la clave solo tiene que ser distinta dentro de la misma pantalla). Se borra
 * solo al cerrar la pestaña. Si el navegador no deja guardar (modo privado
 * estricto), se guarda en memoria: el filtro anda igual, aunque no sobrevive a
 * recargar la página.
 *
 * Se lee con useSyncExternalStore: el servidor y el primer dibujado usan el
 * valor inicial, y React pasa al guardado apenas termina de armar la pantalla,
 * sin diferencias entre servidor y navegador.
 */
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';

const PREFIJO = 'sigma:filtros:';

/** Respaldo para cuando sessionStorage no esta disponible. */
const memoria = new Map();
const oyentes = new Set();

function suscribir(oyente) {
  oyentes.add(oyente);
  return () => oyentes.delete(oyente);
}

function leerCrudo(clave) {
  try {
    const guardado = window.sessionStorage.getItem(clave);
    if (guardado !== null) return guardado;
  } catch {
    // Sin almacenamiento: queda la memoria.
  }
  return memoria.get(clave) ?? null;
}

function escribirCrudo(clave, crudo) {
  memoria.set(clave, crudo);
  try {
    window.sessionStorage.setItem(clave, crudo);
  } catch {
    // Sin almacenamiento: queda la memoria.
  }
  oyentes.forEach((oyente) => oyente());
}

function interpretar(crudo, inicial) {
  if (crudo === null) return inicial;
  try {
    return JSON.parse(crudo);
  } catch {
    return inicial;
  }
}

export function useEstadoGuardado(clave, inicial) {
  const ruta = usePathname();
  const claveCompleta = `${PREFIJO}${ruta}:${clave}`;

  const crudo = useSyncExternalStore(
    suscribir,
    () => leerCrudo(claveCompleta),
    () => null
  );

  const valor = useMemo(() => interpretar(crudo, inicial), [crudo, inicial]);

  const cambiar = useCallback(
    (nuevo) => {
      const anterior = interpretar(leerCrudo(claveCompleta), inicial);
      const siguiente = typeof nuevo === 'function' ? nuevo(anterior) : nuevo;
      escribirCrudo(claveCompleta, JSON.stringify(siguiente));
    },
    [claveCompleta, inicial]
  );

  return [valor, cambiar];
}
