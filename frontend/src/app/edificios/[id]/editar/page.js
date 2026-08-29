'use client';

/**
 * /edificios/3/editar - modificacion de un edificio (HU-1).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioEdificio from '@/componentes/edificios/FormularioEdificio.js';
import { obtenerEdificio, actualizarEdificio } from '@/servicios/edificios.js';

export default function PantallaEditarEdificio({ params }) {
  // En Next.js 16 los parametros de la direccion llegan como promesa.
  const { id } = use(params);

  const [edificio, setEdificio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerEdificio(id)
      .then(setEdificio)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina
        titulo="Editar edificio"
        descripcion={edificio?.nombre}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el edificio..." />
      ) : (
        edificio && (
          <FormularioEdificio
            edificio={edificio}
            onGuardar={(datos) => actualizarEdificio(id, datos)}
          />
        )
      )}
    </>
  );
}
