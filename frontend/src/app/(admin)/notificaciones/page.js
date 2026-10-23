'use client';

/**
 * /notificaciones - la lista completa de notificaciones (HU-33). Es a donde
 * lleva el "Ver más" de la campana de arriba.
 *
 * Por ahora son las alertas de stock minimo: cada material que esta por
 * debajo de su minimo, con cuanto falta para llegar. La lista se calcula del
 * stock: un remito que lo sube hace que el material deje de aparecer.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarAlertasStock } from '@/servicios/inventario.js';

export default function PantallaNotificaciones() {
  const [alertas, setAlertas] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarAlertasStock()
      .then(setAlertas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const filasVisibles = alertas.filter((fila) => !categoria || fila.nombreTipo === categoria);

  const categorias = [...new Set(alertas.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const columnas = [
    {
      clave: 'nombre',
      encabezado: 'Material',
      render: (fila) => (
        <>
          <div className="fw-semibold">{fila.nombre}</div>
          <div className="small text-body-secondary">{fila.codigo}</div>
        </>
      ),
    },
    {
      clave: 'nombreTipo',
      encabezado: 'Categoría',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    { clave: 'stockActual', encabezado: 'Stock actual', render: (fila) => fila.stockActual },
    { clave: 'stockMinimo', encabezado: 'Stock mínimo', render: (fila) => fila.stockMinimo },
    { clave: 'faltante', encabezado: 'Falta', render: (fila) => <span className="fw-semibold">{fila.faltante}</span> },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <BotonEnlace
          href={`/inventario/materiales/${encodeURIComponent(fila.codigo)}`}
          variante="ghost"
          className="btn-icono"
          title="Ver la ficha del material"
        >
          <CIcon icon={cilDescription} />
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Notificaciones" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'nombreTipo']}
            placeholderBusqueda="Buscar por código, nombre o categoría"
            filtros={
              categorias.length > 1
                ? [
                    {
                      etiqueta: 'Categoría',
                      valor: categoria,
                      alCambiar: setCategoria,
                      opciones: categorias.map((texto) => ({ valor: texto, texto })),
                    },
                  ]
                : []
            }
            alLimpiar={() => setCategoria('')}
            cargando={cargando}
            textoVacio="No hay notificaciones: ningún material está por debajo de su stock mínimo."
          />
        </CCardBody>
      </CCard>
    </>
  );
}
