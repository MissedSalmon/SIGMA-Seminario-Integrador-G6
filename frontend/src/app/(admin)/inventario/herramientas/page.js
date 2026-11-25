'use client';

/** Lista los modelos de herramientas y la cantidad de unidades en cada estado. */
import { useEffect, useState } from 'react';
import { CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription, cilPencil } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarItems } from '@/servicios/inventario.js';
import { useFiltroPersistente } from '@/utils/filtros.js';

export default function PantallaHerramientas() {
  const [herramientas, setHerramientas] = useState([]);
  const [categoria, setCategoria] = useFiltroPersistente('categoria', '');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarItems('Herramienta')
      .then(setHerramientas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const filasVisibles = herramientas
    .filter((fila) => !categoria || fila.nombreTipo === categoria);

  const categorias = [...new Set(herramientas.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );
  const columnas = [
    {
      clave: 'codigo',
      encabezado: 'Código',
      render: (fila) => <span className="fw-semibold">{fila.codigo}</span>,
    },
    { clave: 'nombre', encabezado: 'Nombre', render: (fila) => fila.nombre },
    {
      clave: 'nombreTipo',
      encabezado: 'Categoría',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    {
      clave: 'stockActual',
      encabezado: 'Disponibles',
      render: (fila) => <span className="fw-semibold">{fila.stockActual}</span>,
    },
    { clave: 'cantidadEnUso', encabezado: 'En uso', render: (fila) => fila.cantidadEnUso },
    {
      clave: 'cantidadFueraDeServicio',
      encabezado: 'Fuera de servicio',
      render: (fila) => fila.cantidadFueraDeServicio,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/inventario/herramientas/${encodeURIComponent(fila.codigo)}`}
            variante="ghost"
            className="btn-icono"
            title={`Ver detalle de ${fila.nombre}`}
          >
            <CIcon icon={cilDescription} />
          </BotonEnlace>
          <BotonEnlace
            href={`/inventario/herramientas/${encodeURIComponent(fila.codigo)}/editar`}
            variante="ghost"
            className="btn-icono"
            title={`Editar ${fila.nombre}`}
          >
            <CIcon icon={cilPencil} />
          </BotonEnlace>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Herramientas" accion={{ direccion: '/inventario/herramientas/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'descripcion', 'nombreTipo']}
            placeholderBusqueda="Buscar por código, nombre o categoría"
            filtros={[
              // Solo tiene sentido si ya hay mas de una categoria cargada.
              ...(categorias.length > 1
                ? [
                    {
                      etiqueta: 'Categoría',
                      valor: categoria,
                      alCambiar: setCategoria,
                      opciones: categorias.map((texto) => ({ valor: texto, texto })),
                    },
                  ]
                : []),
            ]}
            alLimpiar={() => setCategoria('')}
            cargando={cargando}
            textoVacio="Todavía no hay modelos de herramientas cargados."
          />
        </CCardBody>
      </CCard>

    </>
  );
}
