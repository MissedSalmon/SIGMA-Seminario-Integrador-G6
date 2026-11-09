'use client';

/**
 * /tecnicos/carga-trabajo - comparación de tareas asignadas por técnico.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';
import { listarCargaTrabajo } from '@/servicios/tecnicos.js';

function direccionDetalle(legajo, desde, hasta) {
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const consulta = parametros.toString();
  return `/tecnicos/carga-trabajo/${legajo}${consulta ? `?${consulta}` : ''}`;
}

export default function PantallaCargaTrabajo() {
  const [tecnicos, setTecnicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');
  const [cargando, setCargando] = useState(true);
  const [errorEspecialidades, setErrorEspecialidades] = useState('');
  const [errorCarga, setErrorCarga] = useState('');

  useEffect(() => {
    let vigente = true;

    listarEspecialidades()
      .then((filas) => {
        if (vigente) {
          setEspecialidades(filas);
          setErrorEspecialidades('');
        }
      })
      .catch((fallo) => {
        if (vigente) setErrorEspecialidades(fallo.message);
      });

    return () => {
      vigente = false;
    };
  }, []);

  useEffect(() => {
    let vigente = true;

    listarCargaTrabajo({
      desde: filtroDesde || null,
      hasta: filtroHasta || null,
      especialidad_id: filtroEspecialidad || null,
    })
      .then((filas) => {
        if (!vigente) return;
        setTecnicos(filas);
        setErrorCarga('');
      })
      .catch((fallo) => {
        if (vigente) {
          setTecnicos([]);
          setErrorCarga(fallo.message);
        }
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [filtroDesde, filtroHasta, filtroEspecialidad]);

  function limpiarFiltros() {
    setCargando(true);
    setFiltroEspecialidad('');
    setFiltroDesde('');
    setFiltroHasta('');
  }

  function cambiarFiltro(setter, valor) {
    setCargando(true);
    setter(valor);
  }

  const columnas = [
    {
      clave: 'tecnico',
      encabezado: 'Técnico',
      render: (tecnico) => (
        <span className="fw-semibold">
          {tecnico.nombre} <span className="text-body-secondary">({tecnico.legajo})</span>
        </span>
      ),
    },
    {
      clave: 'especialidades',
      encabezado: 'Especialidad',
      render: (tecnico) => (
        <span className="text-body-secondary">
          {tecnico.especialidades.map((especialidad) => especialidad.nombre).join(', ') || '-'}
        </span>
      ),
    },
    {
      clave: 'pendientes',
      encabezado: 'Pendientes',
      render: (tecnico) => tecnico.pendientes,
    },
    {
      clave: 'enEjecucion',
      encabezado: 'En ejecución',
      render: (tecnico) => tecnico.enEjecucion,
    },
    {
      clave: 'completadas',
      encabezado: 'Completadas',
      render: (tecnico) => tecnico.completadas,
    },
    {
      clave: 'cargaActiva',
      encabezado: 'Carga activa',
      render: (tecnico) => <span className="fw-semibold">{tecnico.cargaActiva}</span>,
    },
    {
      clave: 'detalle',
      encabezado: 'Detalle',
      alinearDerecha: true,
      render: (tecnico) => (
        <BotonEnlace
          href={direccionDetalle(tecnico.legajo, filtroDesde, filtroHasta)}
          variante="outline"
          tamano="sm"
        >
          Ver tareas
        </BotonEnlace>
      ),
    },
  ];

  const maximoCargaActiva = Math.max(1, ...tecnicos.map((tecnico) => tecnico.cargaActiva));
  const maximoCompletadas = Math.max(1, ...tecnicos.map((tecnico) => tecnico.completadas));

  return (
    <>
      <EncabezadoPagina titulo="Carga de trabajo" />
      <Aviso
        mensaje={errorCarga || errorEspecialidades}
        onCerrar={() => {
          setErrorCarga('');
          setErrorEspecialidades('');
        }}
      />

      <CCard>
        <CCardBody>
          <section className="sigma-carga-graficos" aria-label="Gráficos de carga de trabajo">
            <div className="sigma-carga-leyenda" aria-label="Referencias de estado">
              <span><i className="sigma-carga-muestra sigma-carga-muestra-pendiente" />Pendientes</span>
              <span><i className="sigma-carga-muestra sigma-carga-muestra-ejecucion" />En ejecución</span>
              <span><i className="sigma-carga-muestra sigma-carga-muestra-completada" />Completadas</span>
            </div>

            <figure className="sigma-carga-grafico">
              <figcaption>
                <h2>Carga activa</h2>
                <p>Pendientes y en ejecución, ordenadas por técnico.</p>
              </figcaption>
              {tecnicos.map((tecnico) => {
                const anchoPendientes = (tecnico.pendientes / maximoCargaActiva) * 100;
                const anchoEjecucion = (tecnico.enEjecucion / maximoCargaActiva) * 100;

                return (
                  <div className="sigma-carga-fila" key={`activa-${tecnico.legajo}`}>
                    <span className="sigma-carga-nombre" title={`${tecnico.nombre} (${tecnico.legajo})`}>
                      {tecnico.nombre}
                    </span>
                    <div
                      className="sigma-carga-pista"
                      role="img"
                      aria-label={`${tecnico.nombre}: ${tecnico.pendientes} pendientes y ${tecnico.enEjecucion} en ejecución`}
                    >
                      <span className="sigma-carga-barra sigma-carga-barra-pendiente" style={{ width: `${anchoPendientes}%` }} />
                      <span className="sigma-carga-barra sigma-carga-barra-ejecucion" style={{ width: `${anchoEjecucion}%` }} />
                    </div>
                    <strong className="sigma-carga-total">{tecnico.cargaActiva}</strong>
                  </div>
                );
              })}
              {tecnicos.length === 0 && !cargando && (
                <p className="text-body-secondary mb-0">No hay datos para graficar.</p>
              )}
            </figure>

            <figure className="sigma-carga-grafico">
              <figcaption>
                <h2>Tareas completadas</h2>
                <p>Comparación por técnico en el mismo período.</p>
              </figcaption>
              {tecnicos.map((tecnico) => {
                const anchoCompletadas = (tecnico.completadas / maximoCompletadas) * 100;

                return (
                  <div className="sigma-carga-fila" key={`completadas-${tecnico.legajo}`}>
                    <span className="sigma-carga-nombre" title={`${tecnico.nombre} (${tecnico.legajo})`}>
                      {tecnico.nombre}
                    </span>
                    <div
                      className="sigma-carga-pista"
                      role="img"
                      aria-label={`${tecnico.nombre}: ${tecnico.completadas} tareas completadas`}
                    >
                      <span className="sigma-carga-barra sigma-carga-barra-completada" style={{ width: `${anchoCompletadas}%` }} />
                    </div>
                    <strong className="sigma-carga-total">{tecnico.completadas}</strong>
                  </div>
                );
              })}
              {tecnicos.length === 0 && !cargando && (
                <p className="text-body-secondary mb-0">No hay datos para graficar.</p>
              )}
            </figure>
          </section>

          <TablaDatos
            filas={tecnicos}
            claveFila={(tecnico) => tecnico.legajo}
            columnas={columnas}
            buscarPor={['nombre', 'legajo']}
            placeholderBusqueda="Buscar por nombre o legajo"
            filtros={[
              {
                etiqueta: 'Especialidad',
                valor: filtroEspecialidad,
                alCambiar: (valor) => cambiarFiltro(setFiltroEspecialidad, valor),
                textoTodos: 'Todas',
                opciones: especialidades.map((especialidad) => ({
                  valor: especialidad.idEspecialidad,
                  texto: especialidad.nombre,
                })),
              },
              {
                etiqueta: 'Desde',
                tipo: 'fecha',
                valor: filtroDesde,
                alCambiar: (valor) => cambiarFiltro(setFiltroDesde, valor),
                maximo: filtroHasta,
              },
              {
                etiqueta: 'Hasta',
                tipo: 'fecha',
                valor: filtroHasta,
                alCambiar: (valor) => cambiarFiltro(setFiltroHasta, valor),
                minimo: filtroDesde,
              },
            ]}
            alLimpiar={limpiarFiltros}
            cargando={cargando}
            textoVacio={
              filtroEspecialidad || filtroDesde || filtroHasta
                ? 'No hay técnicos que coincidan con los filtros.'
                : 'Todavía no hay técnicos cargados.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
