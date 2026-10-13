'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioMaterialHerramienta from '@/componentes/inventario/FormularioMaterialHerramienta.js';
import { crearItem } from '@/servicios/inventario.js';

export default function PantallaAgregarHerramienta() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar herramienta" />
      <FormularioMaterialHerramienta clase="Herramienta" onGuardar={crearItem} />
    </>
  );
}
