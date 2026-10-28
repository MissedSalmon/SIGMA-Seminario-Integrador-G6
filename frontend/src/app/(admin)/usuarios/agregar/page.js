'use client';

/**
 * /usuarios/agregar - alta de un usuario para una persona ya registrada.
 */
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioUsuario from '@/componentes/usuarios/FormularioUsuario.js';

export default function PantallaAgregarUsuario() {
  return (
    <>
      <EncabezadoPagina titulo="Agregar usuario" />
      <FormularioUsuario />
    </>
  );
}
