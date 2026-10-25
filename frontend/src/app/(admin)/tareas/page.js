'use client';

/**
 * /tareas - Tareas asignadas: las del técnico de la sesión (HU-21).
 *
 * - El técnico ve sólo las suyas: la API las busca por el legajo de la sesión.
 * - La lista viene ordenada por creación, de la más vieja a la más nueva.
 * - Arranca mostrando sólo las pendientes (22/10/2026): las finalizadas y
 *   canceladas se ven eligiendo "Todas" en el filtro de estado.
 * - Las pendientes también aparecen en la campana de notificaciones de arriba
 *   (23/10/2026). Antes había un aviso en esta pantalla con la cantidad.
 * - Cada fila lleva al detalle de la tarea (activo, ubicación y OT).
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import { listarMisTareas, listarPrioridadesDeTarea } from '@/servicios/tareas.js';
import { soloFechaLegible } from '@/utils/fechas.js';

/** El valor del filtro de estado que deja sólo lo que falta hacer. */
const SOLO_PENDIENTES = 'Pendientes';

/** Texto en gris e itálica para decir que algo no está. */
function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaMisTareas() {
  const [tareas, setTareas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);

  // Arranca en "Pendientes"; vacío es "Todas".
  const [filtroEstado, setFiltroEstado] = useState(SOLO_PENDIENTES);
  const [filtroPrioridad, setFiltroPrioridad] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarPrioridadesDeTarea()
      .then(setPrioridades)
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Cada vez que cambia un filtro se vuelve a pedir la lista a la API.
  useEffect(() => {
    let vigente = true;

    async function pedir() {
      setCargando(true);

      try {
        const respuesta = await listarMisTareas({
          estado: filtroEstado || null,
          prioridad: filtroPrioridad || null,
          desde: filtroDesde || null,
          hasta: filtroHasta || null,
        });
        if (!vigente) return;
        setTareas(respuesta.tareas);
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
  }, [filtroEstado, filtroPrioridad, filtroDesde, filtroHasta]);

  // Limpiar vuelve a como arranca la pantalla: sólo las pendientes.
  function limpiarFiltros() {
    setFiltroEstado(SOLO_PENDIENTES);
    setFiltroPrioridad('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(filtroPrioridad || filtroDesde || filtroHasta);
  const soloPendientes = filtroEstado === SOLO_PENDIENTES;

  const columnas = [
    {
      clave: 'prioridad',
      encabezado: 'Prioridad',
      render: (tarea) => <EtiquetaPrioridad prioridad={tarea.prioridad} />,
    },
    {
      clave: 'descripcion',
      encabezado: 'Tarea',
      render: (tarea) => <span className="fw-semibold">{tarea.descripcion}</span>,
    },
    {
      clave: 'fechaPrevista',
      encabezado: 'Fecha prevista',
      render: (tarea) =>
        tarea.fechaPrevista ? (
          <span className="text-nowrap">{soloFechaLegible(tarea.fechaPrevista)}</span>
        ) : (
          <SinDato>Sin fecha</SinDato>
        ),
    },
    {
      clave: 'activo',
      encabezado: 'Activo',
      render: (tarea) =>
        tarea.activo ? (
          <>
            <span className="fw-semibold">{tarea.activo.codigo}</span>
            {tarea.activo.nombreTipo && (
              <span className="text-body-secondary"> — {tarea.activo.nombreTipo}</span>
            )}
          </>
        ) : (
          <SinDato>-</SinDato>
        ),
    },
    {
      clave: 'ubicacion',
      encabezado: 'Ubicación',
      render: (tarea) =>
        tarea.ubicacion ? (
          <span className="text-body-secondary">
            {tarea.ubicacion.edificio} · {tarea.ubicacion.espacio}
          </span>
        ) : (
          <SinDato>-</SinDato>
        ),
    },
    {
      clave: 'ot',
      encabezado: 'OT',
      render: (tarea) => <span className="text-body-secondary text-nowrap">#{tarea.idOt}</span>,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (tarea) => <span className="text-body-secondary text-nowrap">{tarea.estado}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (tarea) => (
        <BotonEnlace
          href={`/tareas/${tarea.idOt}/${tarea.idTarea}`}
          variante="ghost"
          className="btn-icono"
          title="Ver la tarea"
          aria-label={`Ver la tarea ${tarea.descripcion}`}
        >
          <CIcon icon={cilDescription} />
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Tareas asignadas" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tareas}
            claveFila={(tarea) => `${tarea.idOt}-${tarea.idTarea}`}
            columnas={columnas}
            buscarPor={['descripcion', 'codigoActivo']}
            placeholderBusqueda="Buscar por tarea o activo"
            filtros={[
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                textoTodos: 'Todas',
                opciones: [{ valor: SOLO_PENDIENTES, texto: 'Pendientes' }],
                ancho: 11,
              },
              {
                etiqueta: 'Prioridad',
                valor: filtroPrioridad,
                alCambiar: setFiltroPrioridad,
                textoTodos: 'Todas',
                opciones: prioridades.map((prioridad) => ({ valor: prioridad, texto: prioridad })),
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
                ? 'No tenés tareas que cumplan con esos filtros.'
                : soloPendientes
                  ? 'No tenés tareas pendientes.'
                  : 'Todavía no tenés tareas asignadas.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
