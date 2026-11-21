/**
 * El nombre de un espacio: su tipo y su número ("Aula 1.1"). La base no guarda
 * un nombre propio; se arma así en todas las pantallas (21/11/2026).
 * Espera la fila con `espacio_num` y `tipo_espacio ( tipo_espacio_nom )`.
 */
export function nombreDelEspacio(espacio) {
  if (!espacio) return '';
  return espacio.tipo_espacio?.tipo_espacio_nom
    ? `${espacio.tipo_espacio.tipo_espacio_nom} ${espacio.espacio_num}`
    : `Espacio ${espacio.espacio_num}`;
}
