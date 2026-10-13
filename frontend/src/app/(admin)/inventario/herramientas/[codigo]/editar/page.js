'use client';

import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioMaterialHerramienta from '@/componentes/inventario/FormularioMaterialHerramienta.js';
import { actualizarItem, obtenerItem } from '@/servicios/inventario.js';

export default function PantallaEditarHerramienta({ params }) {
  const { codigo } = use(params);
  const codigoBuscado = decodeURIComponent(codigo);
  const [articulo, setArticulo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    obtenerItem(codigoBuscado)
      .then(setArticulo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [codigoBuscado]);

  return (
    <>
      <EncabezadoPagina titulo="Editar herramienta" />
      <Aviso mensaje={error} />
      {cargando ? (
        <Cargando texto="Cargando los datos..." />
      ) : (
        articulo && (
          <FormularioMaterialHerramienta
            clase="Herramienta"
            articulo={articulo}
            onGuardar={(datos) => actualizarItem(codigoBuscado, datos)}
          />
        )
      )}
    </>
  );
}
