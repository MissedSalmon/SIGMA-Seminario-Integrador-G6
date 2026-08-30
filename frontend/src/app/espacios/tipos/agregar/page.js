'use client';

/**
 * /espacios/tipos/agregar - alta de un tipo de espacio (HU-2).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTipoEspacio from '@/componentes/espacios/FormularioTipoEspacio.js';
import { crearTipoEspacio } from '@/servicios/tiposEspacio.js';

export default function PantallaAgregarTipoEspacio() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar tipo de espacio"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioTipoEspacio onGuardar={crearTipoEspacio} />
    </>
  );
}
