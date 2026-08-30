'use client';

/**
 * /activos/AC-014/editar - modificacion de un activo (HU-7).
 *
 * Desde aca tambien se lo reubica (cambiando el espacio) y se cambia su estado
 * entre Operativo y Fuera de servicio.
 */
import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioActivo from '@/componentes/activos/FormularioActivo.js';
import { obtenerActivo, actualizarActivo } from '@/servicios/activos.js';

export default function PantallaEditarActivo({ params }) {
  const { codigo } = use(params);

  // El codigo viaja en la direccion, asi que puede venir escapado ("AC%2D014").
  const codigoActivo = decodeURIComponent(codigo);

  const [activo, setActivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerActivo(codigoActivo)
      .then(setActivo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoActivo]);

  return (
    <>
      <EncabezadoPagina
        titulo="Editar activo"
        descripcion={activo ? `${activo.codigo} — ${activo.descripcion || activo.nombreTipo}` : undefined}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el activo..." />
      ) : (
        activo && (
          <FormularioActivo
            activo={activo}
            onGuardar={(datos) => actualizarActivo(codigoActivo, datos)}
          />
        )
      )}
    </>
  );
}
