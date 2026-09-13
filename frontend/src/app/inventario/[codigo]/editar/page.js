'use client';

import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioItem from '@/componentes/inventario/FormularioItem.js';
import { actualizarItem, obtenerItem } from '@/servicios/inventario.js';

export default function PantallaEditarItem({ params }) {
  const { codigo } = use(params);
  const codigoItem = decodeURIComponent(codigo);
  const [item, setItem] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerItem(codigoItem).then(setItem).catch((fallo) => setError(fallo.message)).finally(() => setCargando(false));
  }, [codigoItem]);

  return (
    <>
      <EncabezadoPagina titulo="Editar item" descripcion={item?.nombre} />
      <Aviso mensaje={error} />
      {cargando ? <Cargando texto="Cargando el item..." /> : item && <FormularioItem item={item} onGuardar={(datos) => actualizarItem(codigoItem, datos)} />}
    </>
  );
}
