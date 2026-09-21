'use client';

/**
 * El campo de DNI. Solo deja escribir numeros y corta al octavo.
 */
import Campo from './Campo.js';
import { formatearDni } from '@/utils/validaciones.js';

export default function CampoDni({ valor, alCambiar, ...resto }) {
  return (
    <Campo
      id="dni"
      etiqueta="DNI"
      valor={valor}
      alCambiar={alCambiar}
      formato={formatearDni}
      placeholder="20345678"
      ancho={10}
      {...resto}
    />
  );
}
