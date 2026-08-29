'use client';

/**
 * /edificios/agregar - alta de un edificio (HU-1).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioEdificio from '@/componentes/edificios/FormularioEdificio.js';
import { crearEdificio } from '@/servicios/edificios.js';

export default function PantallaAgregarEdificio() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar edificio"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioEdificio onGuardar={crearEdificio} />
    </>
  );
}
