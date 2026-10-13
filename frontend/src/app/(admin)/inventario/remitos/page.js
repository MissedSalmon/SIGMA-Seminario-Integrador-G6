'use client';

/**
 * /inventario/remitos - los ingresos al deposito (HU-16).
 *
 * Cada fila es un ingreso: con que comprobante (remito o factura), de quien
 * vino, cuando se recibio y cuanto trajo.
 * De la mas reciente a la mas antigua, que es el orden en que se consultan.
 *
 * No hay editar ni eliminar: un remito confirmado ya movio el stock, y
 * corregirlo seria corregir el stock por la ventana de atras.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarRemitos, listarTiposComprobante } from '@/servicios/remitos.js';
import { soloFechaLegible } from '@/utils/fechas.js';

export default function PantallaRemitos() {
  const [remitos, setRemitos] = useState([]);

  const [tiposComprobante, setTiposComprobante] = useState(['Remito', 'Factura']);
  const [filtroComprobante, setFiltroComprobante] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTiposComprobante()
      .then(setTiposComprobante)
      .catch(() => {});
  }, []);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      setCargando(true);

      try {
        const filas = await listarRemitos({
          desde: filtroDesde || null,
          hasta: filtroHasta || null,
        });
        if (!vigente) return;
        setRemitos(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    pedir();

    return () => {
      vigente = false;
    };
  }, [filtroDesde, filtroHasta]);

  function limpiarFiltros() {
    setFiltroComprobante('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(filtroComprobante || filtroDesde || filtroHasta);

  // El comprobante se filtra acá: la lista ya está en la mano y es chica.
  const filas = filtroComprobante
    ? remitos.filter((remito) => remito.tipoComprobante === filtroComprobante)
    : remitos;

  const columnas = [
    {
      clave: 'id',
      encabezado: '#',
      render: (remito) => <span className="fw-semibold">{remito.id}</span>,
    },
    {
      clave: 'fechaRecepcion',
      encabezado: 'Fecha de recepción',
      render: (remito) => (
        <span className="text-body-secondary">{soloFechaLegible(remito.fechaRecepcion)}</span>
      ),
    },
    {
      clave: 'tipoComprobante',
      encabezado: 'Comprobante',
      render: (remito) => <span className="text-body-secondary">{remito.tipoComprobante}</span>,
    },
    {
      clave: 'proveedor',
      encabezado: 'Proveedor',
      render: (remito) => <span className="text-body-secondary">{remito.proveedor}</span>,
    },
    {
      clave: 'numero',
      encabezado: 'N.º de comprobante',
      render: (remito) =>
        remito.numero ? (
          <span className="text-body-secondary">{remito.numero}</span>
        ) : (
          <span className="text-body-tertiary fst-italic">Sin número</span>
        ),
    },
    {
      clave: 'cantidadItems',
      encabezado: 'Ítems',
      render: (remito) => <span className="text-body-secondary">{remito.cantidadItems}</span>,
    },
    {
      clave: 'totalUnidades',
      encabezado: 'Unidades',
      render: (remito) => <span className="text-body-secondary">{remito.totalUnidades}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (remito) => (
        <BotonEnlace
          href={`/inventario/remitos/${remito.id}`}
          variante="ghost"
          className="btn-icono"
          title="Ver el detalle del ingreso"
        >
          <CIcon icon={cilDescription} />
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Ingresos"
        descripcion="Lo que fue entrando al depósito, del ingreso más reciente al más antiguo."
        accion={{ direccion: '/inventario/remitos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filas}
            claveFila={(remito) => remito.id}
            columnas={columnas}
            buscarPor={['proveedor', 'numero']}
            placeholderBusqueda="Buscar por proveedor o número"
            filtros={[
              {
                etiqueta: 'Comprobante',
                valor: filtroComprobante,
                alCambiar: setFiltroComprobante,
                opciones: tiposComprobante.map((tipo) => ({ valor: tipo, texto: tipo })),
              },
              { etiqueta: 'Desde', tipo: 'fecha', valor: filtroDesde, alCambiar: setFiltroDesde },
              { etiqueta: 'Hasta', tipo: 'fecha', valor: filtroHasta, alCambiar: setFiltroHasta },
            ]}
            alLimpiar={limpiarFiltros}
            cargando={cargando}
            textoVacio={
              hayFiltros
                ? 'No hay ingresos que cumplan con esos filtros.'
                : 'Todavía no se registró ningún ingreso.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
