'use client';

/**
 * /tareas - Tareas asignadas: las del técnico de la sesión (HU-21).
 *
 * - El técnico ve sólo las suyas: la API las busca por el legajo de la sesión.
 * - Orden (25/10/2026): primero lo que tiene entre manos. En ejecución, después
 *   Asignada y después el resto; dentro de cada estado, la prioridad más alta y
 *   la fecha prevista más cercana primero. El estado va como segunda columna,
 *   con la misma etiqueta que el estado de la OT.
 * - El filtro de estado ofrece los estados de la tarea (25/10/2026). Arranca en
 *   "Todas": por el orden, las finalizadas y canceladas quedan al final.
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
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import { listarMisTareas, listarPrioridadesDeTarea } from '@/servicios/tareas.js';
import { soloFechaLegible } from '@/utils/fechas.js';

/** El orden de la lista: lo que el técnico está haciendo, después lo que le asignaron. */
const ORDEN_ESTADO = ['En ejecución', 'Asignada', 'Pendiente', 'Creada', 'Finalizada', 'Cancelada'];
const ORDEN_PRIORIDAD = ['Alta', 'Media', 'Baja'];

/** Los que ofrece el filtro: Creada y Pendiente existen en la base, pero el técnico no las tiene. */
const ESTADOS_DEL_FILTRO = ['En ejecución', 'Asignada', 'Finalizada', 'Cancelada'];

/** Un valor que no está en la lista va al final. */
function posicion(lista, valor) {
  const indice = lista.indexOf(valor);
  return indice === -1 ? lista.length : indice;
}

function compararTareas(una, otra) {
  return (
    posicion(ORDEN_ESTADO, una.estado) - posicion(ORDEN_ESTADO, otra.estado) ||
    posicion(ORDEN_PRIORIDAD, una.prioridad) - posicion(ORDEN_PRIORIDAD, otra.prioridad) ||
    // Sin fecha prevista va después de las que tienen. El texto "2026-10-02" se compara como fecha.
    (una.fechaPrevista ?? '9999').localeCompare(otra.fechaPrevista ?? '9999') ||
    una.idOt - otra.idOt ||
    una.idTarea - otra.idTarea
  );
}

/** Texto en gris e itálica para decir que algo no está. */
function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaMisTareas() {
  const [tareas, setTareas] = useState([]);
  const [prioridades, setPrioridades] = useState([]);

  const [filtroEstado, setFiltroEstado] = useState('');
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
        setTareas([...respuesta.tareas].sort(compararTareas));
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

  function limpiarFiltros() {
    setFiltroEstado('');
    setFiltroPrioridad('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(filtroEstado || filtroPrioridad || filtroDesde || filtroHasta);

  const columnas = [
    {
      clave: 'prioridad',
      encabezado: 'Prioridad',
      render: (tarea) => <EtiquetaPrioridad prioridad={tarea.prioridad} />,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      // La tarea tiene los mismos estados que la OT (salvo Pendiente): se usa su etiqueta.
      render: (tarea) => <EtiquetaEstadoOT estado={tarea.estado} />,
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
                opciones: ESTADOS_DEL_FILTRO.map((estado) => ({ valor: estado, texto: estado })),
                ancho: 12,
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
              hayFiltros ? 'No tenés tareas que cumplan con esos filtros.' : 'Todavía no tenés tareas asignadas.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
