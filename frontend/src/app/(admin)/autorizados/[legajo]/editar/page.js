'use client';

/**
 * /autorizados/1024/editar - modificacion de un usuario autorizado (HU-8).
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioAutorizado from '@/componentes/autorizados/FormularioAutorizado.js';
import { obtenerAutorizado, actualizarAutorizado } from '@/servicios/autorizados.js';

export default function PantallaEditarAutorizado({ params }) {
  // En Next.js 16 los parametros de la direccion llegan como promesa.
  const { legajo } = use(params);

  const [autorizado, setAutorizado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerAutorizado(legajo)
      .then(setAutorizado)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [legajo]);

  return (
    <>
      <EncabezadoPagina
        titulo="Editar usuario autorizado"
        descripcion={autorizado ? autorizado.nombre : undefined}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el usuario autorizado..." />
      ) : (
        autorizado && (
          <FormularioAutorizado
            autorizado={autorizado}
            onGuardar={(datos) => actualizarAutorizado(legajo, datos)}
          />
        )
      )}
    </>
  );
}
