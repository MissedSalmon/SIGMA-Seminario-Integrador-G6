'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioTipo from '@/componentes/inventario/FormularioTipo.js';
import { crearTipoInventario } from '@/servicios/inventario.js';

export default function PantallaAgregarTipoInventario() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar tipo" />
      <FormularioTipo onGuardar={crearTipoInventario} />
    </>
  );
}
