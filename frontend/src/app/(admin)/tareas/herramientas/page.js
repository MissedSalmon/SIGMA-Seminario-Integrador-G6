'use client';

/**
 * /tareas/herramientas - Herramientas utilizadas: las que el técnico tiene a su nombre
 * y las que tuvo, de la más nueva a la más vieja (10/10/2026).
 *
 * Las que tiene todavía se pueden devolver desde acá.
 */
import { useEffect, useMemo, useState } from 'react';
import { CButton, CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import DialogoHerramienta from '@/componentes/tareas/DialogoHerramienta.js';
import { listarHistorialHerramientas } from '@/servicios/tareas.js';
import { formatearFechaHora } from '@/utils/fechas.js';

const ESTADOS = ['En uso', 'Devuelta'];

export default function PantallaHerramientasUtilizadas() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [aDevolver, setADevolver] = useState(null);

  function cargar() {
    return listarHistorialHerramientas()
      .then(setFilas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    listarHistorialHerramientas()
      .then(setFilas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const filtradas = useMemo(
    () =>
      filas.filter((fila) => {
        if (filtroEstado === 'En uso') return fila.enUso;
        if (filtroEstado === 'Devuelta') return !fila.enUso;
        return true;
      }),
    [filas, filtroEstado]
  );

  const columnas = [
    {
      clave: 'herramienta',
      encabezado: 'Herramienta',
      render: (fila) => (
        <>
          <span className="fw-semibold">{fila.codigo}</span>
          <span className="text-body-secondary"> — {fila.nombre}</span>
        </>
      ),
    },
    {
      clave: 'desde',
      encabezado: 'Desde',
      render: (fila) => <span className="text-nowrap">{formatearFechaHora(fila.desde)}</span>,
    },
    {
      clave: 'hasta',
      encabezado: 'Hasta',
      render: (fila) =>
        fila.enUso ? (
          <span className="fw-semibold">En uso</span>
        ) : (
          <span className="text-nowrap text-body-secondary">{formatearFechaHora(fila.hasta)}</span>
        ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (fila) =>
        fila.enUso && (
          <CButton color="secondary" variant="outline" size="sm" onClick={() => setADevolver(fila)}>
            Devolver
          </CButton>
        ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Herramientas utilizadas" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtradas}
            claveFila={(fila) => `${fila.codigo}-${fila.desde}`}
            columnas={columnas}
            buscarPor={['codigo', 'nombre']}
            placeholderBusqueda="Buscar herramienta"
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
