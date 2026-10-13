'use client';

/**
 * /prestadores/agregar - alta de un prestador de servicio (HU-25).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioPrestador from '@/componentes/prestadores/FormularioPrestador.js';
import { crearPrestador } from '@/servicios/prestadores.js';

export default function PantallaAgregarPrestador() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar prestador" />
      <FormularioPrestador onGuardar={crearPrestador} />
    </>
  );
}
