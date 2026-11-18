'use client';

/**
 * Badge de prioridad de una tarea de la OT (HU-14).
 *
 * La prioridad se carga en cada tarea; la OT sugiere la más alta de las suyas,
 * salvo que el administrador le haya puesto otra a mano.
 * El color acompaña, pero lo que se lee es la palabra: "Alta", "Media" o
 * "Baja". Si una OT no tiene tareas todavía, no hay prioridad que mostrar y se
 * devuelve un guion.
 */
/** El tono del sello de cada estado (ver --sigma-tono-* en globals.css). */
const TONOS = {
  Alta: 'peligro',
  Media: 'aviso',
  Baja: 'neutro',
};

export default function EtiquetaPrioridad({ prioridad }) {
  if (!prioridad) return <span className="text-body-tertiary">-</span>;

  const tono = TONOS[prioridad] ?? TONOS.Media;

  return (
    <span className={`sigma-sello sigma-sello--${tono}`}>
      {prioridad}
    </span>
  );
}
