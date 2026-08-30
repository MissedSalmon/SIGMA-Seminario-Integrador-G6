'use client';

/**
 * /tecnicos/1024/editar - modificacion de un tecnico (HU-5).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTecnico from '@/componentes/tecnicos/FormularioTecnico.js';
import { obtenerTecnico, actualizarTecnico } from '@/servicios/tecnicos.js';

export default function PantallaEditarTecnico({ params }) {
  // En Next.js 16 los parametros de la direccion llegan como promesa.
  const { legajo } = use(params);

  const [tecnico, setTecnico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTecnico(legajo)
      .then(setTecnico)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [legajo]);

  return (
    <>
      <EncabezadoPagina
        titulo="Editar tecnico"
        descripcion={tecnico ? `${tecnico.nombre} ${tecnico.apellido}` : undefined}
      />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el tecnico..." />
      ) : (
        tecnico && (
          <FormularioTecnico
            tecnico={tecnico}
            onGuardar={(datos) => actualizarTecnico(legajo, datos)}
          />
        )
      )}
    </>
  );
}
