'use client';

/**
 * El campo de CUIL. Se escribe a mano: los guiones se ponen solos y al guardar
 * se controla el digito verificador (ver utils/validaciones.js).
 */
import Campo from './Campo.js';
import { formatearCuil } from '@/utils/validaciones.js';

export default function CampoCuil({ valor, alCambiar, ...resto }) {
  return (
    <Campo
      id="cuil"
      etiqueta="CUIL"
      valor={valor}
      alCambiar={alCambiar}
      formato={formatearCuil}
      placeholder="20345678901"
      ancho={15}
      {...resto}
    />
  );
}
