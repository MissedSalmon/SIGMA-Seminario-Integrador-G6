'use client';

/**
 * /tipos-activos/3/editar - modificacion de un tipo de activo.
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTipoActivo from '@/componentes/activos/FormularioTipoActivo.js';
import { obtenerTipoActivo, actualizarTipoActivo } from '@/servicios/tiposActivos.js';

export default function PantallaEditarTipoActivo({ params }) {
  const { id } = use(params);

  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTipoActivo(id)
      .then(setTipo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar tipo de activo" descripcion={tipo?.nombre} />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el tipo de activo..." />
      ) : (
        tipo && (
          <FormularioTipoActivo
            tipo={tipo}
            onGuardar={(datos) => actualizarTipoActivo(id, datos)}
          />
        )
      )}
    </>
  );
}
