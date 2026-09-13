'use client';

import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioTipo from '@/componentes/inventario/FormularioTipo.js';
import { actualizarTipoInventario, obtenerTipoInventario } from '@/servicios/inventario.js';

export default function PantallaEditarTipoInventario({ params }) {
  const { id } = use(params);
  const [tipo, setTipo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerTipoInventario(id).then(setTipo).catch((fallo) => setError(fallo.message)).finally(() => setCargando(false));
  }, [id]);

  return (
    <>
      <EncabezadoPagina titulo="Editar tipo de inventario" descripcion={tipo?.nombre} />
      <Aviso mensaje={error} />
      {cargando ? <Cargando texto="Cargando el tipo..." /> : tipo && <FormularioTipo tipo={tipo} onGuardar={(datos) => actualizarTipoInventario(id, datos)} />}
    </>
  );
}
