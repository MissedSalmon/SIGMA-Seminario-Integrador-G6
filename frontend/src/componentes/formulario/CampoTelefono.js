'use client';

/**
 * El campo de telefono. Separa la caracteristica del numero (362 4123456),
 * corta al decimo digito y saca solo el 0 y el 15 de discar.
 */
import Campo from './Campo.js';
import { formatearTelefono } from '@/utils/validaciones.js';

export default function CampoTelefono({ valor, alCambiar, ...resto }) {
  return (
    <Campo
      id="telefono"
      etiqueta="Teléfono"
      tipoHtml="tel"
      valor={valor}
      alCambiar={alCambiar}
      formato={formatearTelefono}
      placeholder="362 4123456"
      ancho={14}
      {...resto}
    />
  );
}
