'use client';

/**
 * /tareas/materiales - Materiales utilizados: lo que el técnico usó en sus
 * tareas, del más nuevo al más viejo (10/10/2026).
 *
 * Una fila por tarea y material. Es sólo para consultar: no lleva acciones.
 *
 * Desde el 25/10/2026 la tarea va en la última columna y su descripción es el
 * enlace a la tarea. La OT va abajo, en gris y sin enlace, con el activo y el
 * espacio. La fecha va sin la hora. En el celular la cantidad y la fecha pasan
 * abajo del material.
 */
import { useEffect, useMemo, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import TareaDelHistorial from '@/componentes/tareas/TareaDelHistorial.js';
import { listarHistorialMateriales } from '@/servicios/tareas.js';
import { diaLocal, formatearFecha } from '@/utils/fechas.js';

export default function PantallaMaterialesUtilizados() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [filtroMaterial, setFiltroMaterial] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  useEffect(() => {
    listarHistorialMateriales()
      .then(setFilas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  // Los materiales que aparecen en el historial, para el filtro.
  const materiales = useMemo(() => {
    const vistos = new Map();
    filas.forEach((fila) => vistos.set(fila.codigo, fila.nombre));
    return [...vistos].sort((a, b) => a[1].localeCompare(b[1], 'es'));
  }, [filas]);

  // El historial ya está entero en pantalla: los filtros se aplican acá.
  const filtradas = useMemo(
    () =>
      filas.filter((fila) => {
        const dia = diaLocal(fila.fecha);
        if (filtroMaterial && fila.codigo !== filtroMaterial) return false;
        if (filtroDesde && dia < filtroDesde) return false;
        if (filtroHasta && dia > filtroHasta) return false;
        return true;
      }),
    [filas, filtroMaterial, filtroDesde, filtroHasta]
  );

  function limpiarFiltros() {
    setFiltroMaterial('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  const hayFiltros = Boolean(filtroMaterial || filtroDesde || filtroHasta);

  const columnas = [
    {
      clave: 'material',
      encabezado: 'Material',
      render: (fila) => (
        <>
          <span className="fw-semibold">{fila.codigo}</span>
          <span className="text-body-secondary"> — {fila.nombre}</span>
          <div className="d-md-none text-body-secondary small">
            Cantidad: {fila.cantidad} · {formatearFecha(fila.fecha)}
          </div>
        </>
      ),
    },
    {
      clave: 'cantidad',
      encabezado: 'Cantidad',
      ocultarDebajoDe: 'md',
      render: (fila) => fila.cantidad,
    },
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      ocultarDebajoDe: 'md',
      render: (fila) => <span className="text-nowrap">{formatearFecha(fila.fecha)}</span>,
    },
    {
      clave: 'tarea',
      encabezado: 'Tarea',
      render: (fila) => <TareaDelHistorial fila={fila} />,
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Materiales utilizados" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtradas}
            claveFila={(fila) => `${fila.idOt}-${fila.idTarea}-${fila.codigo}`}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'tarea']}
            placeholderBusqueda="Buscar por material o tarea"
            filtros={[
              {
                etiqueta: 'Material',
                valor: filtroMaterial,
                alCambiar: setFiltroMaterial,
                opciones: materiales.map(([codigo, nombre]) => ({ valor: codigo, texto: `${codigo} — ${nombre}` })),
              },
              {
                etiqueta: 'Desde',
                tipo: 'fecha',
                valor: filtroDesde,
                alCambiar: setFiltroDesde,
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
                ? 'No hay materiales que cumplan con esos filtros.'
                : 'Todavía no registraste materiales en tus tareas.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
