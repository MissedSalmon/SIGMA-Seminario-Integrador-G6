'use client';

/**
 * /prestadores/tipos/2/editar - modificacion de un tipo de prestador (HU-24).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTipoPrestador from '@/componentes/prestadores/FormularioTipoPrestador.js';
import { obtenerTipoPrestador, actualizarTipoPrestador } from '@/servicios/tiposPrestador.js';

export default function PantallaEditarTipoPrestador({ params }) {
  const { id } = use(params);

  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTipoPrestador(id)
      .then(setTipo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar tipo de prestador" />

      <Aviso mensaje={error} />

      {cargando ? (
        <Cargando texto="Cargando el tipo de prestador..." />
      ) : (
        tipo && (
          <FormularioTipoPrestador
            tipo={tipo}
            onGuardar={(datos) => actualizarTipoPrestador(id, datos)}
          />
        )
      )}
    </>
  );
}
