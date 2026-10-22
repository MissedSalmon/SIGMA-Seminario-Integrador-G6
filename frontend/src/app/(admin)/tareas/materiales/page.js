'use client';

/**
 * /tareas/materiales - Materiales utilizados: lo que el técnico usó en sus
 * tareas, del más nuevo al más viejo (10/10/2026).
 *
 * Una fila por tarea y material. Es sólo para consultar: no lleva acciones.
 *
 * La OT de cada fila es un enlace (22/10/2026). Lleva al detalle de la tarea,
 * que muestra los datos de la OT: la pantalla de órdenes de trabajo es del
 * administrador y el técnico no puede entrar.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarHistorialMateriales } from '@/servicios/tareas.js';
import { formatearFechaHora } from '@/utils/fechas.js';

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
        const dia = String(fila.fecha).slice(0, 10);
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
      clave: 'fecha',
      encabezado: 'Fecha',
      render: (fila) => <span className="text-nowrap">{formatearFechaHora(fila.fecha)}</span>,
    },
    {
      clave: 'material',
      encabezado: 'Material',
      render: (fila) => (
        <>
          <span className="fw-semibold">{fila.codigo}</span>
          <span className="text-body-secondary"> — {fila.nombre}</span>
        </>
      ),
    },
    {
      clave: 'cantidad',
      encabezado: 'Cantidad',
      render: (fila) => fila.cantidad,
    },
    {
      clave: 'tarea',
      encabezado: 'Tarea',
      render: (fila) => (
        <>
          {fila.tarea}
          {' '}
          <Link
            href={`/tareas/${fila.idOt}/${fila.idTarea}`}
            className="text-nowrap"
            title={`Ver la tarea de la OT #${fila.idOt}`}
          >
            (OT #{fila.idOt})
          </Link>
        </>
      ),
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
