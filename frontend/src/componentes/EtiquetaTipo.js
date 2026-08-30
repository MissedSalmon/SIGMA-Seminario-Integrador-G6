'use client';

/**
 * Badge para el campo "tipo" de un espacio (Aula, Laboratorio, Oficina...).
 *
 * El color no es libre: se elige siempre el mismo para el mismo texto (una
 * funcion de hash sobre el texto elige una posicion en una paleta fija), asi
 * "Aula" siempre se ve del mismo color en toda la aplicacion sin necesidad de
 * mantener un mapa a mano por cada tipo que se cargue.
 */
const PALETA = [
  { fondo: '#e6f0f4', texto: '#0b6b8c' },
  { fondo: '#fdecd8', texto: '#b5620f' },
  { fondo: '#e7f6ec', texto: '#1b8a4c' },
  { fondo: '#f1ebfb', texto: '#6c3fc9' },
  { fondo: '#fde8ec', texto: '#c23a5e' },
  { fondo: '#e9f1fd', texto: '#2f66c9' },
];

function elegirColor(texto) {
  let hash = 0;
  for (let i = 0; i < texto.length; i += 1) {
    hash = (hash * 31 + texto.charCodeAt(i)) % PALETA.length;
  }
  return PALETA[Math.abs(hash)];
}

export default function EtiquetaTipo({ texto }) {
  if (!texto) return null;

  const color = elegirColor(texto);

  return (
    <span className="sigma-etiqueta" style={{ backgroundColor: color.fondo, color: color.texto }}>
      {texto}
    </span>
  );
}
