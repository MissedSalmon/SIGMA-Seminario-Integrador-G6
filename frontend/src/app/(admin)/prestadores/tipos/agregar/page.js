'use client';

/**
 * /prestadores/tipos/agregar - alta de un tipo de prestador de servicio (HU-24).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTipoPrestador from '@/componentes/prestadores/FormularioTipoPrestador.js';
import { crearTipoPrestador } from '@/servicios/tiposPrestador.js';

export default function PantallaAgregarTipoPrestador() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar tipo de prestador" />
      <FormularioTipoPrestador onGuardar={crearTipoPrestador} />
    </>
  );
}
