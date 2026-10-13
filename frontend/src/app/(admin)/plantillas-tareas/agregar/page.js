'use client';

/**
 * /plantillas-tareas/agregar - alta de una plantilla de tareas (HU-12).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioPlantilla from '@/componentes/plantillas/FormularioPlantilla.js';
import { crearPlantilla } from '@/servicios/plantillasTareas.js';

export default function PantallaAgregarPlantilla() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar plantilla de tareas" />
      <FormularioPlantilla onGuardar={crearPlantilla} />
    </>
  );
}
