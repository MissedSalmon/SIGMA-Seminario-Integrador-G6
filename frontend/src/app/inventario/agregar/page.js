'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioItem from '@/componentes/inventario/FormularioItem.js';
import { crearItem } from '@/servicios/inventario.js';

export default function PantallaAgregarItem() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar item" descripcion="Carga los datos del material o de la herramienta." />
      <FormularioItem onGuardar={crearItem} />
    </>
  );
}
