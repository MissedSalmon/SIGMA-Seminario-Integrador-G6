'use client';

/**
 * /activos/agregar - alta de un activo (HU-7).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioActivo from '@/componentes/activos/FormularioActivo.js';
import { crearActivo } from '@/servicios/activos.js';

export default function PantallaAgregarActivo() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar activo"
        descripcion="Los campos marcados con * son obligatorios. El activo queda en estado Operativo."
      />
      <FormularioActivo onGuardar={crearActivo} />
    </>
  );
}
