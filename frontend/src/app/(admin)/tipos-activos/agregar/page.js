'use client';

/**
 * /tipos-activos/agregar - alta de un tipo de activo.
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTipoActivo from '@/componentes/activos/FormularioTipoActivo.js';
import { crearTipoActivo } from '@/servicios/tiposActivos.js';

export default function PantallaAgregarTipoActivo() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar tipo de activo" />
      <FormularioTipoActivo onGuardar={crearTipoActivo} />
    </>
  );
}
