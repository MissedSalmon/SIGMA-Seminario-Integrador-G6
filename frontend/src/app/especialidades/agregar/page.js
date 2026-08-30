'use client';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioEspecialidad from '@/componentes/especialidades/FormularioEspecialidad.js';
import { crearEspecialidad } from '@/servicios/especialidades.js';

export default function PantallaAgregarEspecialidad() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar especialidad" descripcion="Los campos marcados con * son obligatorios." />
      <FormularioEspecialidad onGuardar={async ({ nombre }) => crearEspecialidad(nombre)} />
    </>
  );
}
