'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioRemito from '@/componentes/inventario/FormularioRemito.js';
import { registrarRemito } from '@/servicios/remitos.js';

export default function PantallaAgregarRemito() {
  return (
    <>
      <EncabezadoPagina
        titulo="Nuevo ingreso"
        descripcion="Lo que entró al depósito. Al confirmar, sube el stock de cada ítem."
      />
      <FormularioRemito onGuardar={registrarRemito} />
    </>
  );
}
