'use client';

/**
 * /tickets - listado y consulta de tickets (HU-10).
 *
 * El administrador ve todos los tickets, del mas nuevo al mas viejo, y los
 * filtra por estado, por fecha de alta (desde/hasta), por activo y por area.
 * Los filtros se combinan y los aplica la API, no la pantalla.
 *
 * El filtro de estado sirve sobre todo para ver los "Creado": los tickets que
 * todavia no fueron validados y esperan la decision del administrador.
 *
 * El area de un ticket es la del espacio donde esta el activo. Si ese
 * espacio no tiene un area asignada, el ticket se muestra sin area.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { listarActivos } from '@/servicios/activos.js';
import { listarAreas } from '@/servicios/areas.js';
import { listarTickets, listarEstadosDeTicket } from '@/servicios/tickets.js';
import { formatearFechaHora, inicioDelDia, finDelDia } from '@/utils/fechas.js';

export default function PantallaTickets() {
  const [tickets, setTickets] = useState([]);

  // Lo que hay para elegir en los desplegables. Se carga una sola vez.
  const [estados, setEstados] = useState([]);
  const [activos, setActivos] = useState([]);
  const [areas, setAreas] = useState([]);

  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [filtroActivo, setFiltroActivo] = useState('');
  const [filtroArea, setFiltroArea] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarEstadosDeTicket(), listarActivos(), listarAreas()])
      .then(([listaEstados, listaActivos, listaAreas]) => {
        setEstados(listaEstados);
        setActivos(listaActivos);
        setAreas(listaAreas);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Cada vez que cambia un filtro se vuelve a pedir la lista a la API.
  useEffect(() => {
    let vigente = true;

    async function pedir() {
      setCargando(true);

      try {
        const filas = await listarTickets({
          estado: filtroEstado || null,
          desde: inicioDelDia(filtroDesde),
          hasta: finDelDia(filtroHasta),
          codigoActivo: filtroActivo || null,
          idArea: filtroArea || null,
        });
        if (!vigente) return;
        setTickets(filas);
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
  }, [filtroEstado, filtroDesde, filtroHasta, filtroActivo, filtroArea]);

  function limpiarFiltros() {
    setFiltroEstado('');
    setFiltroDesde('');
    setFiltroHasta('');
    setFiltroActivo('');
    setFiltroArea('');
  }

  const hayFiltros = Boolean(filtroEstado || filtroDesde || filtroHasta || filtroActivo || filtroArea);

  const columnas = [
    {
      clave: 'id',
      encabezado: '#',
      render: (ticket) => <span className="fw-semibold">{ticket.id}</span>,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (ticket) => <EtiquetaEstadoTicket estado={ticket.estado} />,
    },
    {
      clave: 'fechaAlta',
      encabezado: 'Fecha de alta',
      render: (ticket) => <span className="text-body-secondary">{formatearFechaHora(ticket.fechaAlta)}</span>,
    },
    {
      clave: 'activo',
      encabezado: 'Activo',
      render: (ticket) => (
        <>
          <span className="fw-semibold">{ticket.codigoActivo}</span>
          {ticket.activo?.nombreTipo && (
            <span className="text-body-secondary"> — {ticket.activo.nombreTipo}</span>
          )}
        </>
      ),
    },
    {
      clave: 'area',
      encabezado: 'Área',
      render: (ticket) =>
        ticket.nombreArea ? (
          <span className="text-body-secondary">{ticket.nombreArea}</span>
        ) : (
          <span className="text-body-tertiary fst-italic">Sin área</span>
        ),
    },
    {
      clave: 'registradoPor',
      encabezado: 'Registrado por',
      render: (ticket) => (
        <span className="text-body-secondary">
          {ticket.registradoPor?.nombre || ticket.registradoPor?.legajo || '-'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (ticket) => (
        <BotonEnlace
          href={`/tickets/${ticket.id}`}
          color="secondary"
          variante="outline"
          tamano="sm"
          className="text-nowrap"
          title="Ver el detalle del ticket"
        >
          <CIcon icon={cilDescription} size="sm" className="me-1" />
          Ver detalle
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Tickets"
        descripcion="Las solicitudes de mantenimiento, de la más reciente a la más antigua."
        accion={{ direccion: '/tickets/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tickets}
            claveFila={(ticket) => ticket.id}
            columnas={columnas}
            buscarPor={['descripcion', 'codigoActivo']}
            placeholderBusqueda="Buscar por descripción o activo..."
            filtros={[
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: estados.map((estado) => ({ valor: estado, texto: estado })),
              },
              {
                etiqueta: 'Desde',
                tipo: 'fecha',
                valor: filtroDesde,
                alCambiar: setFiltroDesde,
              },
              {
                etiqueta: 'Hasta',
                tipo: 'fecha',
                valor: filtroHasta,
                alCambiar: setFiltroHasta,
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
                etiqueta: 'Área',
                valor: filtroArea,
                alCambiar: setFiltroArea,
                textoTodos: 'Todas',
                opciones: areas.map((area) => ({ valor: area.idArea, texto: area.nombre })),
              },
            ]}
            alLimpiar={limpiarFiltros}
            cargando={cargando}
            textoVacio={
              hayFiltros
                ? 'No hay tickets que cumplan con esos filtros.'
                : 'Todavía no hay tickets registrados.'
            }
            accionVacio={
              hayFiltros ? undefined : { direccion: '/tickets/agregar' }
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
