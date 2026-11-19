/**
 * Los pisos de un espacio (19/11/2026). En la base se guarda el número como
 * texto ("0", "1", "2"); en pantalla se muestra el nombre.
 */
export const PISOS = [
  { valor: '0', texto: 'Planta baja' },
  { valor: '1', texto: '1er piso' },
  { valor: '2', texto: '2do piso' },
];

/** "Planta baja" para "0". Un valor viejo que no está en la lista se muestra tal cual. */
export function textoDelPiso(valor) {
  if (valor === null || valor === undefined || valor === '') return '';
  return PISOS.find((piso) => piso.valor === String(valor))?.texto ?? String(valor);
}
