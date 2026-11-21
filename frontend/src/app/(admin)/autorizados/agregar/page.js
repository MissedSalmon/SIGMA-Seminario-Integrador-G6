'use client';

/**
 * /autorizados/agregar - alta de un usuario autorizado (HU-8).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioAutorizado from '@/componentes/autorizados/FormularioAutorizado.js';
import { crearAutorizado } from '@/servicios/autorizados.js';

export default function PantallaAgregarAutorizado() {
  return (
    <>
      <EncabezadoPagina
        titulo="Agregar solicitante"
        descripcion="Los campos marcados con * son obligatorios."
      />
      <FormularioAutorizado onGuardar={crearAutorizado} />
    </>
  );
}
