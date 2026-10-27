'use client';

/**
 * /tareas/herramientas - Herramientas utilizadas: las que el técnico tiene a su
 * nombre y las que tuvo (10/10/2026).
 *
 * Desde el 25/10/2026 va una fila por préstamo (cada vez que tomó una
 * herramienta), igual que materiales va una fila por consumo. Primero las que
 * tiene todavía, que se pueden devolver desde acá, y después las devueltas, de
 * la más nueva a la más vieja. Reemplaza a la fila por herramienta con la
 * ventana "Ver OT" (22/10/2026).
 *
 * La tarea queda guardada sólo cuando la herramienta se toma desde una tarea.
 * Las que asignó el administrador desde el depósito, y los préstamos de antes
 * del 22/10/2026, aparecen como "Sin tarea registrada".
 */
import { useEffect, useMemo, useState } from 'react';
import { CButton, CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import DialogoHerramienta from '@/componentes/tareas/DialogoHerramienta.js';
import EtiquetaEstadoPrestamo from '@/componentes/tareas/EtiquetaEstadoPrestamo.js';
import TareaDelHistorial from '@/componentes/tareas/TareaDelHistorial.js';
import { listarHistorialHerramientas } from '@/servicios/tareas.js';
import { formatearFecha } from '@/utils/fechas.js';

const ESTADOS = ['En uso', 'Devuelta'];

/** Las que tiene todavía primero; el resto ya viene del préstamo más nuevo al más viejo. */
function compararPrestamos(uno, otro) {
  return Number(otro.enUso) - Number(uno.enUso);
}

function BotonDevolver({ alDevolver }) {
  return (
    <CButton color="secondary" variant="outline" size="sm" onClick={alDevolver}>
      Devolver
    </CButton>
  );
}

export default function PantallaHerramientasUtilizadas() {
  const [prestamos, setPrestamos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [aDevolver, setADevolver] = useState(null);

  function cargar() {
    return listarHistorialHerramientas()
      .then((filas) => setPrestamos([...filas].sort(compararPrestamos)))
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }

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
          {/* Las fechas van acá mientras no entran sus columnas; en el celular, también la acción. */}
          <div className="d-xl-none text-body-secondary small">
            {prestamo.enUso
              ? `En uso desde el ${formatearFecha(prestamo.desde)}`
              : `Devuelta el ${formatearFecha(prestamo.hasta)}`}
          </div>
          {prestamo.enUso && (
            <div className="d-md-none mt-2">
              <BotonDevolver alDevolver={() => setADevolver(prestamo)} />
            </div>
          )}
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
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      ocultarDebajoDe: 'md',
      render: (prestamo) => prestamo.enUso && <BotonDevolver alDevolver={() => setADevolver(prestamo)} />,
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

      {aDevolver && (
        <DialogoHerramienta
          aDevolver={aDevolver}
          onCerrar={() => setADevolver(null)}
          onGuardado={() => {
            setADevolver(null);
            cargar();
          }}
        />
      )}
    </>
  );
}
