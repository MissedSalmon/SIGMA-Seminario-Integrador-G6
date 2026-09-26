'use client';

/**
 * /ordenes-trabajo/agregar - alta de una orden de trabajo (HU-14).
 *
 * La OT sale de un ticket validado. Ver el formulario para el detalle.
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioOrdenTrabajo from '@/componentes/ordenes/FormularioOrdenTrabajo.js';

export default function PantallaAgregarOrdenTrabajo() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar orden de trabajo" />
      <FormularioOrdenTrabajo />
    </>
  );
}
