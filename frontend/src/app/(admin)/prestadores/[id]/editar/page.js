'use client';

/**
 * /prestadores/2/editar - modificacion de un prestador de servicio (HU-25).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioPrestador from '@/componentes/prestadores/FormularioPrestador.js';
import { obtenerPrestador, actualizarPrestador } from '@/servicios/prestadores.js';

export default function PantallaEditarPrestador({ params }) {
  const { id } = use(params);

  const [prestador, setPrestador] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerPrestador(id)
      .then(setPrestador)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar prestador" />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el prestador..." />
      ) : (
        prestador && (
          <FormularioPrestador
            prestador={prestador}
            onGuardar={(datos) => actualizarPrestador(id, datos)}
          />
        )
      )}
    </>
  );
}
