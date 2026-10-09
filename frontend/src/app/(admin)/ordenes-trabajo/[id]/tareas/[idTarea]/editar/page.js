'use client';

/**
 * /ordenes-trabajo/5/tareas/3/editar - modificación de una tarea de la OT (HU-14).
 *
 * No hay un servicio para traer una tarea suelta: se trae la OT entera y se
 * busca la tarea entre las suyas.
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTareaOT from '@/componentes/ordenes/FormularioTareaOT.js';
import { actualizarTarea, obtenerOrden } from '@/servicios/ordenesTrabajo.js';

export default function PantallaEditarTareaOT({ params }) {
  const { id, idTarea } = use(params);

  const [orden, setOrden] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerOrden(id)
      .then(setOrden)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  const tarea = orden?.tareas.find((una) => String(una.idTarea) === String(idTarea));

  return (
    <>
      <EncabezadoPagina titulo={`Editar tarea ${idTarea} de la orden de trabajo #${id}`} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando la tarea..." />
      ) : orden && !tarea ? (
        <Aviso mensaje={`La orden de trabajo #${id} no tiene una tarea ${idTarea}.`} />
      ) : (
        tarea && (
          <FormularioTareaOT
            orden={orden}
            tarea={tarea}
            onGuardar={(datos) => actualizarTarea(orden.id, tarea.idTarea, datos)}
          />
        )
      )}
    </>
  );
}
