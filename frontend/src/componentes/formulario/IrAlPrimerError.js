'use client';

/**
 * Cuando alguien toca «Guardar» y el formulario tiene errores, lleva la
 * pantalla y el foco al primer campo marcado, para no tener que buscarlo.
 *
 * Se monta una sola vez en LayoutAdmin y escucha el envio de cualquier
 * formulario: los formularios no tienen que hacer nada. Espera un instante
 * a que el formulario termine de marcar sus errores y busca el primero.
 * Si el envio salio bien no hay campos marcados y no hace nada.
 */
import { useEffect } from 'react';

/** Las marcas de error que dejan los campos de formulario de SIGMA. */
const CAMPO_CON_ERROR = [
  '[aria-invalid="true"]',
  '.sigma-campo--error',
  '.sigma-fecha--error',
  '.sigma-duracion--error',
  '.sigma-numero--error',
  '.sigma-lista--error',
].join(', ');

/** Dentro de un campo marcado, lo que puede recibir el foco. */
const ENFOCABLE = 'input:not([type="hidden"]), textarea, select, [role="combobox"], [contenteditable="true"], button';

export default function IrAlPrimerError() {
  useEffect(() => {
    const alEnviar = (evento) => {
      const formulario = evento.target;
      if (!(formulario instanceof HTMLFormElement)) return;

      window.setTimeout(() => {
        const marcado = formulario.querySelector(CAMPO_CON_ERROR);
        if (!marcado) return;

        const destino = marcado.matches(ENFOCABLE) ? marcado : marcado.querySelector(ENFOCABLE);
        const menosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        marcado.scrollIntoView({ block: 'center', behavior: menosMovimiento ? 'auto' : 'smooth' });
        destino?.focus({ preventScroll: true });
      }, 60);
    };

    document.addEventListener('submit', alEnviar, true);
    return () => document.removeEventListener('submit', alEnviar, true);
  }, []);

  return null;
}
