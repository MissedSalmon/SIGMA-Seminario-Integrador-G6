'use client';

/**
 * /tecnicos/agregar - alta de un tecnico (HU-5).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTecnico from '@/componentes/tecnicos/FormularioTecnico.js';
import { crearTecnico } from '@/servicios/tecnicos.js';

export default function PantallaAgregarTecnico() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar tecnico"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioTecnico onGuardar={crearTecnico} />
    </>
  );
}
