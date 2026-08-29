'use client';

/**
 * /areas/3/editar - modificacion de un area funcional (HU-3).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioArea from '@/componentes/areas/FormularioArea.js';
import { obtenerArea, actualizarArea } from '@/servicios/areas.js';

export default function PantallaEditarArea({ params }) {
  const { id } = use(params);

  const [area, setArea] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerArea(id)
      .then(setArea)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar area" descripcion={area?.nombre} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el area..." />
      ) : (
        area && <FormularioArea area={area} onGuardar={(datos) => actualizarArea(id, datos)} />
      )}
    </>
  );
}
