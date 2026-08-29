'use client';

/**
 * /areas/agregar - alta de un area funcional (HU-3).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioArea from '@/componentes/areas/FormularioArea.js';
import { crearArea } from '@/servicios/areas.js';

export default function PantallaAgregarArea() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar area"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioArea onGuardar={crearArea} />
    </>
  );
}
