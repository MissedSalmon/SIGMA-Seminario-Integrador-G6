'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioMaterialHerramienta from '@/componentes/inventario/FormularioMaterialHerramienta.js';
import { crearItem } from '@/servicios/inventario.js';

export default function PantallaAgregarMaterial() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar material" />
      <FormularioMaterialHerramienta clase="Material" onGuardar={crearItem} />
    </>
  );
}
