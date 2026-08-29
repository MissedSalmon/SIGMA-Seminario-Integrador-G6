'use client';

/**
 * /espacios/agregar - alta de un espacio (HU-2).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioEspacio from '@/componentes/espacios/FormularioEspacio.js';
import { crearEspacio } from '@/servicios/espacios.js';

export default function PantallaAgregarEspacio() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar espacio"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioEspacio onGuardar={crearEspacio} />
    </>
  );
}
