'use client';

/**
 * Etiqueta para el campo "tipo" de un espacio (Aula, Laboratorio, Oficina...).
 *
 * Va neutra, sin color: un tipo es una categoria, no un estado, y un color sin
 * una referencia de que significa no se usa (regla 6 de UI del CLAUDE.md).
 * Antes cada tipo tomaba un color de una paleta segun su texto (18/11/2026).
 */
export default function EtiquetaTipo({ texto }) {
  if (!texto) return null;

  return <span className="sigma-etiqueta">{texto}</span>;
}
