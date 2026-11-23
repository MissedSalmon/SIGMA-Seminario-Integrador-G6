'use client';

/**
 * Ventana para agregar una unidad de medida nueva sin salir del formulario de
 * material. Queda guardada en el catalogo de unidades de medida y se le avisa
 * al formulario con `alCrear` para que la agregue al desplegable y la elija.
 *
 *   <DialogoNuevaUnidadMedida
 *     visible={nuevaUnidadVisible}
 *     alCrear={(unidad) => ...}
 *     alCerrar={() => setNuevaUnidadVisible(false)}
 *   />
 */
import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { crearUnidadMedida } from '@/servicios/inventario.js';

export default function DialogoNuevaUnidadMedida({ visible, alCrear, alCerrar }) {
  const { mostrarToast } = useToast();

  const [nombre, setNombre] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  function cerrar() {
    if (creando) return;
    setNombre('');
    setError('');
    alCerrar();
  }

  async function crear() {
    if (!nombre.trim()) {
      setError('Escribí la unidad de medida.');
      return;
    }

    setCreando(true);
    setError('');
    try {
      const nueva = await crearUnidadMedida(nombre.trim());
      mostrarToast({ tipo: 'exito', mensaje: 'Se agregó la unidad de medida.' });
      alCrear(nueva);
      setNombre('');
      alCerrar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <CModal visible={visible} onClose={cerrar} alignment="center">
      <CModalHeader>
        <CModalTitle>Nueva unidad de medida</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <Aviso mensaje={error} />
        <Campo
          id="nuevaUnidadMedida"
          etiqueta="Unidad de medida"
          valor={nombre}
          alCambiar={setNombre}
          placeholder="Ej: rollo"
          obligatorio
          maxLength={40}
          ancho={22}
        />
      </CModalBody>
      <CModalFooter>
        <BotonesAccion procesando={creando} alAceptar={crear} alCancelar={cerrar} />
      </CModalFooter>
    </CModal>
  );
}
