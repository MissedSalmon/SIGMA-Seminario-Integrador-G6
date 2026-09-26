'use client';

/**
 * /ordenes-trabajo/5/tareas/agregar - alta de una tarea de la OT (HU-14).
 *
 * Se trae la OT porque el formulario necesita saber el tipo de activo, para
 * ofrecer sus tareas estándar.
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTareaOT from '@/componentes/ordenes/FormularioTareaOT.js';
import { agregarTarea, obtenerOrden } from '@/servicios/ordenesTrabajo.js';

export default function PantallaAgregarTareaOT({ params }) {
  const { id } = use(params);

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerOrden(id)
      .then(setOrden)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo={`Agregar tarea a la orden de trabajo #${id}`} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando la orden de trabajo..." />
      ) : (
        orden && (
          <FormularioTareaOT orden={orden} onGuardar={(datos) => agregarTarea(orden.id, datos)} />
        )
      )}
    </>
  );
}
