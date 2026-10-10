'use client';

/**
 * /tareas - Tareas asignadas: las del técnico de la sesión (HU-21).
 *
 * - El técnico ve sólo las suyas: la API las busca por el legajo de la sesión.
 * - La lista ya viene ordenada por prioridad y fecha prevista, para que no
 *   tenga que decidir por dónde empezar.
 * - Arriba, un aviso con cuántas le quedan pendientes. Ese número no cambia con
 *   los filtros: dice todo el trabajo que le queda.
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

/** "Tenés 3 tareas pendientes." en singular o plural. */
function textoPendientes(cantidad) {
  if (cantidad === 0) return 'No tenés tareas pendientes.';
  if (cantidad === 1) return 'Tenés 1 tarea pendiente.';
  return `Tenés ${cantidad} tareas pendientes.`;
}

/*
 * El aviso de pendientes se puede cerrar (10/10/2026). Se recuerda con qué
 * cantidad se cerró, sólo en esta pestaña del navegador (sessionStorage): no
 * vuelve al entrar a una tarea y regresar, pero sí cuando la cantidad cambia,
 * porque ahí hay algo nuevo que avisar. Si el navegador no deja guardar, el
 * aviso se cierra igual hasta que se recarga la pantalla.
 */
const CLAVE_AVISO_CERRADO = 'sigma.tareas.avisoPendientesCerrado';

function leerAvisoCerrado() {
  try {
    const valor = window.sessionStorage.getItem(CLAVE_AVISO_CERRADO);
    return valor === null ? null : Number(valor);
  } catch {
    return null;
  }
}

function guardarAvisoCerrado(cantidad) {
  try {
    window.sessionStorage.setItem(CLAVE_AVISO_CERRADO, String(cantidad));
  } catch {
    // Sin almacenamiento: queda cerrado sólo mientras no se recargue.
  }
}

/** Texto en gris e itálica para decir que algo no está. */
function SinDato({ children }) {
  return <span className="text-body-tertiary fst-italic">{children}</span>;
}

export default function PantallaMisTareas() {
  const [tareas, setTareas] = useState([]);
  const [pendientes, setPendientes] = useState(null);
  // Con qué cantidad de pendientes se cerró el aviso (null: no se cerró).
  const [avisoCerradoCon, setAvisoCerradoCon] = useState(leerAvisoCerrado);
  const [prioridades, setPrioridades] = useState([]);

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
          prioridad: filtroPrioridad || null,
          desde: filtroDesde || null,
          hasta: filtroHasta || null,
        });
        if (!vigente) return;
        setTareas(respuesta.tareas);
        setPendientes(respuesta.pendientes);
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
  }, [filtroPrioridad, filtroDesde, filtroHasta]);

  function cerrarAvisoPendientes() {
    setAvisoCerradoCon(pendientes);
    guardarAvisoCerrado(pendientes);
  }

  const mostrarAvisoPendientes = pendientes !== null && pendientes !== avisoCerradoCon;

  function limpiarFiltros() {
    setFiltroPrioridad('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(filtroPrioridad || filtroDesde || filtroHasta);

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

      {mostrarAvisoPendientes && (
        <Aviso mensaje={textoPendientes(pendientes)} color="info" onCerrar={cerrarAvisoPendientes} />
      )}

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
                : 'Todavía no tenés tareas asignadas.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
