'use client';

/**
 * /planes-mantenimiento/agregar - alta de plan de mantenimiento preventivo (Sprint 5).
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioPlan from '@/componentes/planes/FormularioPlan.js';
import { crearPlan } from '@/servicios/planesMantenimiento.js';

export default function PantallaAgregarPlan() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar plan de mantenimiento" />
      <FormularioPlan onGuardar={crearPlan} />
    </>
  );
}
