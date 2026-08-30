'use client';

/**
 * /espacios/3/editar - modificacion de un espacio (HU-2).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioEspacio from '@/componentes/espacios/FormularioEspacio.js';
import { obtenerEspacio, actualizarEspacio } from '@/servicios/espacios.js';

export default function PantallaEditarEspacio({ params }) {
  const { id } = use(params);

  const [espacio, setEspacio] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerEspacio(id)
      .then(setEspacio)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar espacio" descripcion={espacio?.nombre} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el espacio..." />
      ) : (
        espacio && (
          <FormularioEspacio
            espacio={espacio}
            onGuardar={(datos) => actualizarEspacio(id, datos)}
          />
        )
      )}
    </>
  );
}
