'use client';

/**
 * /tareas/herramientas - Herramientas utilizadas: las que el técnico tiene a su
 * nombre y las que tuvo (10/10/2026).
 *
 * Desde el 25/10/2026 va una fila por préstamo (cada vez que tomó una
 * herramienta), igual que materiales va una fila por consumo. Primero las que
 * tiene todavía y después las devueltas, de la más nueva a la más vieja.
 *
 * Es sólo de consulta: la columna «Acción» se sacó el 10/11/2026. Las
 * herramientas se devuelven desde el detalle de la tarea. Reemplaza a la fila por herramienta con la
 * ventana "Ver OT" (22/10/2026).
 *
 * La tarea queda guardada sólo cuando la herramienta se toma desde una tarea.
 * Las que asignó el administrador desde el depósito, y los préstamos de antes
 * del 22/10/2026, aparecen como "Sin tarea registrada".
 */
import { useEffect, useMemo, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaEstadoPrestamo from '@/componentes/tareas/EtiquetaEstadoPrestamo.js';
import TareaDelHistorial from '@/componentes/tareas/TareaDelHistorial.js';
import { listarHistorialHerramientas } from '@/servicios/tareas.js';
import { formatearFecha } from '@/utils/fechas.js';

const ESTADOS = ['En uso', 'Devuelta'];

/** Las que tiene todavía primero; el resto ya viene del préstamo más nuevo al más viejo. */
function compararPrestamos(uno, otro) {
  return Number(otro.enUso) - Number(uno.enUso);
}

export default function PantallaHerramientasUtilizadas() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => {
    listarHistorialHerramientas()
      .then((filas) => setPrestamos([...filas].sort(compararPrestamos)))
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const filtrados = useMemo(
    () =>
      prestamos.filter((prestamo) => {
        if (filtroEstado === 'En uso') return prestamo.enUso;
        if (filtroEstado === 'Devuelta') return !prestamo.enUso;
        return true;
      }),
    [prestamos, filtroEstado]
  );

  const columnas = [
    {
      clave: 'herramienta',
      encabezado: 'Herramienta',
      render: (prestamo) => (
        <>
          <span className="fw-semibold">{prestamo.codigo}</span>
          <span className="text-body-secondary"> — {prestamo.nombre}</span>
          {/* Las fechas van acá mientras no entran sus columnas. */}
          <div className="d-xl-none text-body-secondary small">
            {prestamo.enUso
              ? `En uso desde el ${formatearFecha(prestamo.desde)}`
              : `Devuelta el ${formatearFecha(prestamo.hasta)}`}
          </div>
        </>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      ocultarDebajoDe: 'md',
      render: (prestamo) => <EtiquetaEstadoPrestamo enUso={prestamo.enUso} />,
    },
    {
      clave: 'desde',
      encabezado: 'Desde',
      ocultarDebajoDe: 'xl',
      render: (prestamo) => <span className="text-nowrap">{formatearFecha(prestamo.desde)}</span>,
    },
    {
      clave: 'hasta',
      encabezado: 'Hasta',
      ocultarDebajoDe: 'xl',
      render: (prestamo) =>
        prestamo.enUso ? (
          <span className="text-body-tertiary">-</span>
        ) : (
          <span className="text-nowrap">{formatearFecha(prestamo.hasta)}</span>
        ),
    },
    {
      clave: 'tarea',
      encabezado: 'Tarea',
      render: (prestamo) => <TareaDelHistorial fila={prestamo} />,
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Herramientas utilizadas" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtrados}
            claveFila={(prestamo) => `${prestamo.codigo}-${prestamo.desde}`}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'tarea']}
            placeholderBusqueda="Buscar por herramienta o tarea"
            filtros={[
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: ESTADOS.map((estado) => ({ valor: estado, texto: estado })),
              },
            ]}
            alLimpiar={() => setFiltroEstado('')}
            cargando={cargando}
            textoVacio={
              filtroEstado
                ? 'No hay herramientas que cumplan con ese filtro.'
                : 'Todavía no tuviste herramientas a tu nombre.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
