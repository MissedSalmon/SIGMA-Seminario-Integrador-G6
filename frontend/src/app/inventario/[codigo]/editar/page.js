'use client';

import { use, useEffect, useState } from 'react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import FormularioMaterialHerramienta from '@/componentes/inventario/FormularioMaterialHerramienta.js';
import { actualizarItem, obtenerItem } from '@/servicios/inventario.js';

export default function PantallaEditarMaterialHerramienta({ params }) {
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

  const titulo = articulo?.clase === 'Herramienta' ? 'Editar herramienta' : 'Editar material';

  return (
    <>
      <EncabezadoPagina titulo={titulo} />
      <Aviso mensaje={error} />
      {cargando ? (
        <Cargando texto="Cargando los datos..." />
      ) : (
        articulo && (
          <FormularioMaterialHerramienta
            articulo={articulo}
            onGuardar={(datos) => actualizarItem(codigoBuscado, datos)}
          />
        )
      )}
    </>
  );
}
