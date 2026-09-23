'use client';

/**
 * /ordenes-trabajo - listado de órdenes de trabajo (HU-14).
 *
 * La OT se genera sola al validar el ticket, así que lo normal es entrar acá a
 * buscarla y planificarla. El botón "Agregar" está para el caso en que el
 * ticket quedó validado sin OT: lleva al alta, donde se elige de qué ticket
 * sale.
 *
 * La columna "Tareas" es la que más se mira: mientras diga que faltan
 * responsables, esa OT todavía no se puede empezar a trabajar.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import { listarActivos } from '@/servicios/activos.js';
import { listarOrdenes, listarEstadosDeOrden, listarPrioridades } from '@/servicios/ordenesTrabajo.js';
import { formatearFechaHora, inicioDelDia, finDelDia } from '@/utils/fechas.js';

export default function PantallaOrdenesTrabajo() {
  const [ordenes, setOrdenes] = useState([]);

  // Lo que hay para elegir en los desplegables. Se carga una sola vez.
  const [estados, setEstados] = useState([]);
  const [prioridades, setPrioridades] = useState([]);
  const [activos, setActivos] = useState([]);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarEstadosDeOrden(), listarPrioridades(), listarActivos()])
      .then(([listaEstados, listaPrioridades, listaActivos]) => {
        setEstados(listaEstados);
        setPrioridades(listaPrioridades);
        setActivos(listaActivos);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Cada vez que cambia un filtro se vuelve a pedir la lista a la API.
  useEffect(() => {
    let vigente = true;

    async function pedir() {
      setCargando(true);

      try {
        const filas = await listarOrdenes({
          estado: filtroEstado || null,
          prioridad: filtroPrioridad || null,
          codigoActivo: filtroActivo || null,
          desde: inicioDelDia(filtroDesde),
          hasta: finDelDia(filtroHasta),
        });
        if (!vigente) return;
        setOrdenes(filas);
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
  }, [filtroEstado, filtroPrioridad, filtroActivo, filtroDesde, filtroHasta]);

  function limpiarFiltros() {
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroActivo('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(
    filtroEstado || filtroPrioridad || filtroActivo || filtroDesde || filtroHasta
  );

  const columnas = [
    {
      clave: 'id',
      encabezado: '#',
      render: (orden) => <span className="fw-semibold">{orden.id}</span>,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (orden) => <EtiquetaEstadoOT estado={orden.estado} />,
    },
    {
      clave: 'prioridad',
      encabezado: 'Prioridad',
      render: (orden) => <EtiquetaPrioridad prioridad={orden.prioridad} />,
    },
    {
      clave: 'tareas',
      encabezado: 'Tareas',
      render: (orden) =>
        orden.cantidadTareas === 0 ? (
          <span className="text-body-tertiary fst-italic">Sin tareas</span>
        ) : (
          <span className="text-body-secondary">
            {orden.cantidadTareas} {orden.cantidadTareas === 1 ? 'tarea' : 'tareas'}
            {orden.tareasSinResponsable > 0 && `, ${orden.tareasSinResponsable} sin responsable`}
          </span>
        ),
    },
    {
      clave: 'activo',
      encabezado: 'Activo',
      render: (orden) =>
        orden.codigoActivo ? (
          <>
            <span className="fw-semibold">{orden.codigoActivo}</span>
            {orden.activo?.nombreTipo && (
              <span className="text-body-secondary"> — {orden.activo.nombreTipo}</span>
            )}
          </>
        ) : (
          <span className="text-body-tertiary">-</span>
        ),
    },
    {
      clave: 'origen',
      encabezado: 'Origen',
      render: (orden) =>
        orden.idTicket ? (
          <span className="text-body-secondary">Ticket #{orden.idTicket}</span>
        ) : (
          <span className="text-body-secondary">Preventivo</span>
        ),
    },
    {
      clave: 'fechaAlta',
      encabezado: 'Fecha de alta',
      render: (orden) => (
        <span className="text-body-secondary">{formatearFechaHora(orden.fechaAlta)}</span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (orden) => (
        <BotonEnlace
          href={`/ordenes-trabajo/${orden.id}`}
          color="secondary"
          variante="outline"
          tamano="sm"
          className="text-nowrap"
          title="Ver la orden de trabajo y sus tareas"
        >
          <CIcon icon={cilDescription} size="sm" className="me-1" />
          Ver detalle
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Órdenes de trabajo" accion={{ direccion: '/ordenes-trabajo/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={ordenes}
            claveFila={(orden) => orden.id}
            columnas={columnas}
            buscarPor={['descripcion', 'codigoActivo']}
            placeholderBusqueda="Buscar por descripción o activo"
            filtros={[
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: estados.map((estado) => ({ valor: estado, texto: estado })),
              },
              {
                etiqueta: 'Prioridad',
                valor: filtroPrioridad,
                alCambiar: setFiltroPrioridad,
                textoTodos: 'Todas',
                opciones: prioridades.map((prioridad) => ({ valor: prioridad, texto: prioridad })),
              },
              {
                etiqueta: 'Activo',
                valor: filtroActivo,
                alCambiar: setFiltroActivo,
                opciones: activos.map((activo) => ({
                  valor: activo.codigo,
                  texto: activo.nombreTipo ? `${activo.codigo} — ${activo.nombreTipo}` : activo.codigo,
                })),
              },
              {
                etiqueta: 'Desde',
                tipo: 'fecha',
                valor: filtroDesde,
                alCambiar: setFiltroDesde,
                // Un rango no se puede dar vuelta: el desde no pasa del hasta.
                maximo: filtroHasta,
              },
              {
                etiqueta: 'Hasta',
                tipo: 'fecha',
                valor: filtroHasta,
                alCambiar: setFiltroHasta,
                minimo: filtroDesde,
              },
            ]}
            alLimpiar={limpiarFiltros}
            cargando={cargando}
            textoVacio={
              hayFiltros
                ? 'No hay órdenes de trabajo que cumplan con esos filtros.'
                : 'Todavía no hay órdenes de trabajo. Se generan al validar un ticket.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
