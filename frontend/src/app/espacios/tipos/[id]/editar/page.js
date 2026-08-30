'use client';

/**
 * /espacios/tipos/2/editar - modificacion de un tipo de espacio (HU-2).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTipoEspacio from '@/componentes/espacios/FormularioTipoEspacio.js';
import { obtenerTipoEspacio, actualizarTipoEspacio } from '@/servicios/tiposEspacio.js';

export default function PantallaEditarTipoEspacio({ params }) {
  const { id } = use(params);

  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTipoEspacio(id)
      .then(setTipo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar tipo de espacio" descripcion={tipo?.nombre} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el tipo de espacio..." />
      ) : (
        tipo && (
          <FormularioTipoEspacio
            tipo={tipo}
            onGuardar={(datos) => actualizarTipoEspacio(id, datos)}
          />
        )
      )}
    </>
  );
}
