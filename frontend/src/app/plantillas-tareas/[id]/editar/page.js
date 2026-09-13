'use client';

/**
 * /plantillas-tareas/3/editar - modificación de una plantilla de tareas (HU-12).
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioPlantilla from '@/componentes/plantillas/FormularioPlantilla.js';
import { actualizarPlantilla, obtenerPlantilla } from '@/servicios/plantillasTareas.js';

export default function PantallaEditarPlantilla({ params }) {
  const { id } = use(params);

  const [plantilla, setPlantilla] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPlantilla(id)
      .then(setPlantilla)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar plantilla de tareas" descripcion={plantilla?.descripcion} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando la plantilla..." />
      ) : (
        plantilla && (
          <FormularioPlantilla
            plantilla={plantilla}
            onGuardar={(datos) => actualizarPlantilla(id, datos)}
          />
        )
      )}
    </>
  );
}
