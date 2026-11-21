'use client';

/**
 * Panel del administrador (Sprint 7).
 *
 * Está dividido en dos partes para que se vea qué cambia con el período:
 * - «Situación actual»: activos, técnicos e inventario tal como están hoy. El período no los cambia.
 * - «Según el período»: tickets, órdenes de trabajo, incidencias y tiempos, con el selector arriba.
 * El botón Exportar arma el informe PDF en el navegador.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CButton,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import {
  cilCloudDownload,
  cilReload,
  cilCheckCircle,
  cilClock,
  cilArrowRight,
} from '@coreui/icons';

import AvisoPlanesPorVencer from '@/componentes/planes/AvisoPlanesPorVencer.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';
import GraficoChart, { COLORES_GRAFICO } from '@/componentes/estadisticas/GraficoChart.js';
import TalonesAbiertos from '@/componentes/ordenes/TalonesAbiertos.js';
import { obtenerPanelCompleto } from '@/servicios/estadisticas.js';
import { hoyTexto } from '@/utils/fechas.js';
import { textoTiempo } from '@/utils/duracion.js';

const PRESETS_PERIODO = [
  { clave: '30d', label: 'Últimos 30 días', dias: 30 },
  { clave: '90d', label: 'Trimestre', dias: 90 },
  { clave: '180d', label: 'Semestre', dias: 180 },
  { clave: '365d', label: 'Año', dias: 365 },
  { clave: 'todo', label: 'Histórico', dias: null },
  { clave: 'personalizado', label: 'Personalizado', dias: -1 },
];

/** "2026-10-11" -> "11/10/2026", sin pasar por Date (que lo leería en UTC y restaría un día). */
const fechaCorta = (texto) => texto.split('-').reverse().join('/');

/**
 * Resta dias a una fecha "2026-10-11" trabajando con la fecha local. Antes
 * pasaba por new Date("2026-10-11"), que la lee en UTC y en Argentina la
 * corria un dia para atras.
 */
function restarDias(fechaStr, dias) {
  const [anio, mes, dia] = fechaStr.split('-').map(Number);
  const d = new Date(anio, mes - 1, dia - dias);
  const dos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

/** Un numero con coma decimal, como se escribe en Argentina ("79,2"). */
const numero = (valor, decimales = 1) =>
  Number(valor ?? 0).toLocaleString('es-AR', { maximumFractionDigits: decimales });

/** Un porcentaje con coma decimal, o un guion si no hay dato. */
const porcentaje = (valor) => (valor != null ? `${numero(valor)} %` : '-');

/** "1 retirado" / "3 retirados". */
const contar = (cantidad, singular, plural) => `${cantidad ?? 0} ${(cantidad ?? 0) === 1 ? singular : plural}`;

function TituloSeccion({ id, children }) {
  return (
    <h2 id={id} className="sigma-panel-seccion">
      {children}
    </h2>
  );
}

/**
 * Un pendiente de la franja «Para atender»: un casillero con su cantidad que
 * lleva a la pantalla donde se resuelve.
 */
function Pendiente({ rotulo, cantidad, accion, href }) {
  return (
    <Link href={href} className="sigma-pendiente">
      <span className="sigma-casillero-rotulo">{rotulo}</span>
      <span className="sigma-pendiente-cantidad">{cantidad}</span>
      <span className="sigma-pendiente-accion">
        {accion}
        <CIcon icon={cilArrowRight} size="sm" aria-hidden="true" />
      </span>
    </Link>
  );
}

export default function PantallaPanelAdministrador() {
  const [preset, setPreset] = useState('180d');
  const [desde, setDesde] = useState(() => restarDias(hoyTexto(), 180));
  const [hasta, setHasta] = useState(() => hoyTexto());

  const [panelPayload, setPanelPayload] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [exportando, setExportando] = useState(false);

  const cargarDatos = async (filtroDesde, filtroHasta) => {
    setCargando(true);
    setError(null);
    try {
      const payload = await obtenerPanelCompleto({
        desde: filtroDesde || undefined,
        hasta: filtroHasta || undefined,
      });
      setPanelPayload(payload);
    } catch (err) {
      console.error('[panel] Error al obtener datos del panel:', err);
      setError(err?.response?.data?.mensaje || err.message || 'No se pudieron cargar los datos del panel.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    let cancelado = false;
    async function inicializar() {
      try {
        const payload = await obtenerPanelCompleto({
          desde: desde || undefined,
          hasta: hasta || undefined,
        });
        if (!cancelado) setPanelPayload(payload);
      } catch (err) {
        if (!cancelado) {
          console.error('[panel] Error al obtener datos del panel:', err);
          setError(err?.response?.data?.mensaje || err.message || 'No se pudieron cargar los datos del panel.');
        }
      } finally {
        if (!cancelado) setCargando(false);
      }
    }
    inicializar();
    return () => {
      cancelado = true;
    };
  }, []);

  const aplicarPreset = (p) => {
    setPreset(p.clave);
    if (p.dias === null) {
      setDesde('');
      setHasta('');
      cargarDatos('', '');
    } else if (p.dias > 0) {
      const hoy = hoyTexto();
      const nDesde = restarDias(hoy, p.dias);
      setDesde(nDesde);
      setHasta(hoy);
      cargarDatos(nDesde, hoy);
    }
  };

  // El período personalizado se aplica solo, apenas las dos fechas forman un rango válido.
  const cambiarFecha = (nuevoDesde, nuevoHasta) => {
    setDesde(nuevoDesde);
    setHasta(nuevoHasta);
    if (nuevoDesde && nuevoHasta && nuevoDesde > nuevoHasta) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    cargarDatos(nuevoDesde, nuevoHasta);
  };

  const rangoElegido =
    desde || hasta
      ? `${desde ? fechaCorta(desde) : '…'} – ${hasta ? fechaCorta(hasta) : 'hoy'}`
      : 'Todo el historial';

  const handleExportar = async () => {
    if (!panelPayload) return;
    setExportando(true);
    try {
      // jsPDF pesa mucho: se descarga recien cuando alguien exporta.
      const { exportarPanelPdf } = await import('@/servicios/exportacionPanel.js');
      await exportarPanelPdf(panelPayload);
    } catch (err) {
      console.error('[panel] Error al exportar archivo PDF:', err);
      setError('No se pudo generar el informe PDF. Probá de nuevo en un momento.');
    } finally {
      setExportando(false);
    }
  };

  const datos = panelPayload?.datos ?? {};
  const metadatos = panelPayload?.metadatos ?? {};
  const resumen = datos.resumenGeneral ?? {};
  const tiempos = datos.tiemposResolucion ?? {};
  const activos = datos.activos ?? {};
  const ordenes = datos.ordenesTrabajo ?? {};
  const evolucion = datos.evolucionTickets ?? {};
  const cargaTec = datos.cargaTecnicos ?? {};
  const areas = datos.areasIncidencia ?? {};
  const rankingAreas = Array.isArray(areas) ? areas : (areas.ranking ?? []);
  const cobertura = resumen.coberturaPreventiva ?? {};
  const tiposSinPlan = cobertura.tiposSinPlan?.length ?? Math.max(0, (cobertura.totalTipos ?? 0) - (cobertura.tiposConPlan ?? 0));
  const materialesBajos = resumen.materialesBajoMinimo?.items ?? [];
  const ticketsCerradosDelPeriodo = evolucion.porEstado?.find((e) => e.id === 6)?.cantidad ?? 0;

  const fechaFrescura = metadatos.generadoEn
    ? new Intl.DateTimeFormat('es-AR', {
        timeZone: 'America/Argentina/Buenos_Aires',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(metadatos.generadoEn))
    : '-';

  return (
    <>
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-3 mb-3">
        <div>
          <h1 className="sigma-titulo mb-1">Panel de control</h1>
          {metadatos.generadoEn && (
            <div className="small text-body-secondary">
              Actualizado: <strong>{fechaFrescura}</strong> (UTC-3)
            </div>
          )}
        </div>

        <div className="sigma-panel-acciones">
          <CButton
            color="primary"
            variant="outline"
            disabled={cargando}
            onClick={() => cargarDatos(desde, hasta)}
          >
            {cargando ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilReload} className="me-2" />}
            Actualizar
          </CButton>

          <CButton
            color="primary"
            disabled={cargando || exportando || !panelPayload}
            onClick={handleExportar}
          >
            {exportando ? <CSpinner size="sm" className="me-2" /> : <CIcon icon={cilCloudDownload} className="me-2" />}
            Exportar PDF
          </CButton>
        </div>
      </div>

      {error && <Aviso mensaje={error} onCerrar={() => setError(null)} />}

      {/* Lo primero que se ve: el trabajo abierto, como talones de un talonario. */}
      <TalonesAbiertos recarga={metadatos.generadoEn} />

      {/*
        Lo que necesita una decision hoy. Cada casillero lleva a la pantalla
        donde se resuelve; los numeros salen del mismo resumen del panel.
      */}
      {panelPayload && (
        <section className="mb-4" aria-labelledby="titulo-pendientes">
          <TituloSeccion id="titulo-pendientes">Para atender</TituloSeccion>
          <div className="sigma-pendientes">
            <Pendiente
              rotulo="Materiales bajo el mínimo"
              cantidad={materialesBajos.length}
              accion="Ver materiales"
              href="/inventario/materiales"
            />
            <Pendiente
              rotulo="Tipos de activo sin plan"
              cantidad={tiposSinPlan}
              accion="Ver planes"
              href="/planes-mantenimiento"
            />
            <Pendiente
              rotulo="Tareas sin terminar"
              cantidad={cargaTec.totalTareasActivas ?? 0}
              accion="Ver carga de trabajo"
              href="/tecnicos/carga-trabajo"
            />
          </div>
          <AvisoPlanesPorVencer />
        </section>
      )}

      {cargando && !panelPayload ? (
        <Cargando texto="Cargando estadísticas consolidadas del sistema..." />
      ) : (
        <>
          <section className="mb-5">
            <TituloSeccion>Situación actual</TituloSeccion>

            <div className="sigma-kpi-grid sigma-kpi-grid--3">
              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Operatividad de activos</div>
                  <div className="sigma-kpi-value text-body">{porcentaje(resumen.operatividad?.porcentaje)}</div>
                  <div className="sigma-kpi-explicacion">Activos operativos sobre los que están en servicio.</div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    <strong>{resumen.operatividad?.operativos ?? 0}</strong> de {resumen.operatividad?.enServicio ?? 0} en servicio
                  </div>
                  <div className="sigma-kpi-subtext">
                    {contar(resumen.operatividad?.retirados, 'retirado', 'retirados')} de {resumen.operatividad?.totalActivos ?? 0} en total
                  </div>
                </div>
              </div>

              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Cobertura preventiva</div>
                  <div className="sigma-kpi-value text-body">{porcentaje(cobertura.porcentajeActivos)}</div>
                  <div className="sigma-kpi-explicacion">Activos en servicio cuyo tipo tiene un plan vigente.</div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    {(resumen.coberturaPreventiva?.porcentajeActivos ?? 0) === 100 ? (
                      <span className="fw-semibold">
                        <CIcon icon={cilCheckCircle} className="me-1" />
                        Todos los activos cubiertos ({resumen.coberturaPreventiva?.totalActivosEnServicio ?? 0})
                      </span>
                    ) : (
                      <>
                        <strong>{resumen.coberturaPreventiva?.activosCubiertos ?? 0}</strong> de {resumen.coberturaPreventiva?.totalActivosEnServicio ?? 0} activos en servicio
                      </>
                    )}
                  </div>
                  <div className="sigma-kpi-subtext">
                    {contar(cobertura.tiposConPlan, 'tipo de activo con plan', 'tipos de activo con plan')}
                    {/* Los tipos sin plan se leen en pantalla, no sólo al pasar el mouse. */}
                    {cobertura.tiposSinPlan?.length > 0 && (
                      <> · sin plan: {cobertura.tiposSinPlan.map((t) => t.nombre).join(', ')}</>
                    )}
                  </div>
                </div>
              </div>

              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Disponibilidad técnica</div>
                  <div className="sigma-kpi-value text-body">{porcentaje(resumen.disponibilidadTecnicos?.porcentaje)}</div>
                  <div className="sigma-kpi-explicacion">Técnicos que pueden tomar tareas nuevas.</div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    <strong>{resumen.disponibilidadTecnicos?.disponibles ?? 0}</strong> de {resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} disponibles
                  </div>
                </div>
              </div>
            </div>

            <CRow className="g-3 mb-3">
              <CCol xs={12} lg={8}>
                <GraficoChart
                  id="grafico-activos-edificio"
                  tipo="bar"
                  horizontal={true}
                  titulo="Activos en servicio por edificio"
                  subtitulo="Cantidad de activos en servicio; no incluye los retirados."
                  data={{
                    labels: activos.porEdificio?.map((e) => e.nombre) ?? [],
                    datasets: [
                      {
                        label: 'Activos en servicio',
                        data: activos.porEdificio?.map((e) => e.cantidad) ?? [],
                      },
                    ],
                  }}
                  altura={Math.max(180, (activos.porEdificio?.length ?? 0) * 48 + 70)}
                />
              </CCol>

              <CCol xs={12} lg={4}>
                <GraficoChart
                  id="grafico-activos-estado"
                  tipo="doughnut"
                  titulo="Activos según su estado"
                  subtitulo="Distribución según el estado del ciclo de vida del equipamiento."
                  data={{
                    labels: activos.porEstado?.map((e) => e.nombre) ?? [],
                    datasets: [
                      {
                        data: activos.porEstado?.map((e) => e.cantidad) ?? [],
                      },
                    ],
                  }}
                  altura={240}
                />
              </CCol>
            </CRow>

            <CRow className="g-3">
              <CCol xs={12} lg={6}>
                <GraficoChart
                  id="grafico-carga-tecnicos"
                  tipo="bar"
                  horizontal={true}
                  titulo="Tareas pendientes por técnico"
                  subtitulo="Tareas asignadas que todavía no fueron finalizadas."
                  data={{
                    labels: cargaTec.porTecnico?.map((t) => t.nombre) ?? [],
                    datasets: [
                      {
                        label: 'Tareas pendientes',
                        data: cargaTec.porTecnico?.map((t) => t.tareasActivas) ?? [],
                      },
                    ],
                  }}
                  altura={Math.max(260, (cargaTec.porTecnico?.length ?? 0) * 36 + 80)}
                />
              </CCol>

              <CCol xs={12} lg={6}>
                {/*
                  El vale de reposicion: los materiales que hay que pedir. Va sin
                  colores; lo que importa se lee en la columna «Faltan».
                */}
                <CCard className="sigma-vale h-100">
                  <CCardHeader className="sigma-vale-encabezado">
                    <span className="fw-semibold">Materiales bajo stock mínimo</span>
                    <span className="sigma-etiqueta">{contar(materialesBajos.length, 'material', 'materiales')}</span>
                  </CCardHeader>
                  <CCardBody className="p-3">
                    {materialesBajos.length > 0 ? (
                      <CTable small className="align-middle mb-0 sigma-vale-tabla">
                        <CTableHead>
                          <CTableRow>
                            <CTableHeaderCell>Material</CTableHeaderCell>
                            <CTableHeaderCell className="text-end">Hay</CTableHeaderCell>
                            <CTableHeaderCell className="text-end">Mínimo</CTableHeaderCell>
                            <CTableHeaderCell className="text-end">Faltan</CTableHeaderCell>
                          </CTableRow>
                        </CTableHead>
                        <CTableBody>
                          {materialesBajos.map((m) => (
                            <CTableRow key={m.codigo}>
                              <CTableDataCell>
                                <div className="fw-medium">{m.nombre}</div>
                                <div className="small text-body-secondary text-nowrap">{m.codigo}</div>
                              </CTableDataCell>
                              <CTableDataCell className="text-end">{m.stockActual}</CTableDataCell>
                              <CTableDataCell className="text-end text-body-secondary">{m.stockMinimo}</CTableDataCell>
                              <CTableDataCell className="text-end fw-bold">{m.faltante}</CTableDataCell>
                            </CTableRow>
                          ))}
                        </CTableBody>
                      </CTable>
                    ) : (
                      <div className="text-body-secondary py-3">
                        <CIcon icon={cilCheckCircle} className="me-1" aria-hidden="true" />
                        No hay materiales con stock por debajo del mínimo.
                      </div>
                    )}
                  </CCardBody>
                </CCard>
              </CCol>
            </CRow>
          </section>

          <section className="mb-4">
            <TituloSeccion>Según el período</TituloSeccion>

            <CCard className="mb-3 shadow-sm">
              <CCardBody className="sigma-periodo">
                <span className="sigma-periodo-etiqueta" id="etiqueta-periodo">Período:</span>

                <div className="sigma-segmentos" role="group" aria-labelledby="etiqueta-periodo">
                  {PRESETS_PERIODO.map((p) => (
                    <button
                      key={p.clave}
                      type="button"
                      className="sigma-segmento"
                      aria-pressed={preset === p.clave}
                      disabled={cargando && preset !== p.clave}
                      onClick={() => aplicarPreset(p)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {preset === 'personalizado' ? (
                  <div className="sigma-periodo-fechas">
                    <CampoFecha
                      id="desde"
                      etiqueta="Desde"
                      compacto
                      valor={desde}
                      alCambiar={(valor) => cambiarFecha(valor, hasta)}
                      maximo={hasta || hoyTexto()}
                    />
                    <CampoFecha
                      id="hasta"
                      etiqueta="Hasta"
                      compacto
                      valor={hasta}
                      alCambiar={(valor) => cambiarFecha(desde, valor)}
                      minimo={desde}
                      maximo={hoyTexto()}
                    />
                  </div>
                ) : (
                  <span className="sigma-periodo-rango">{rangoElegido}</span>
                )}

                {cargando && <CSpinner size="sm" className="sigma-periodo-cargando" aria-label="Cargando" />}
                {/* Avisa a los lectores de pantalla cuando cambian los datos del período. */}
                <span className="visually-hidden" aria-live="polite">
                  {cargando ? 'Cargando los datos del período…' : `Datos del período ${rangoElegido}.`}
                </span>
              </CCardBody>
            </CCard>

            <div className="sigma-kpi-grid sigma-kpi-grid--3">
              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Tiempo promedio de resolución</div>
                  <div className="sigma-kpi-value text-body">{textoTiempo(tiempos.general?.promedioSegundos)}</div>
                  <div className="sigma-kpi-explicacion">Desde el alta hasta el cierre de cada ticket.</div>
                </div>
                <div className="sigma-kpi-footer">
                  Sobre <strong>{tiempos.general?.cantidadTickets ?? 0}</strong>{' '}
                  {(tiempos.general?.cantidadTickets ?? 0) === 1 ? 'ticket cerrado' : 'tickets cerrados'} en el período
                </div>
              </div>

              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Tickets registrados</div>
                  <div className="sigma-kpi-value text-body">{evolucion.totalTicketsPeriodo ?? 0}</div>
                  <div className="sigma-kpi-explicacion">Dados de alta en el período.</div>
                </div>
                <div className="sigma-kpi-footer">
                  De estos, <strong>{ticketsCerradosDelPeriodo}</strong>{' '}
                  {ticketsCerradosDelPeriodo === 1 ? 'ya se cerró' : 'ya se cerraron'}
                </div>
              </div>

              <div className="sigma-kpi-card">
                <div>
                  <div className="sigma-kpi-title">Órdenes de trabajo</div>
                  <div className="sigma-kpi-value text-body">{ordenes.porOrigen?.total ?? 0}</div>
                  <div className="sigma-kpi-explicacion">Dadas de alta en el período.</div>
                </div>
                <div className="sigma-kpi-footer">
                  <strong>{ordenes.porOrigen?.correctivas ?? 0}</strong> correctivas · <strong>{ordenes.porOrigen?.preventivas ?? 0}</strong> preventivas
                </div>
              </div>
            </div>

            <CRow className="g-3 mb-3">
              <CCol xs={12} lg={8}>
                <GraficoChart
                  id="grafico-evolucion-tickets"
                  tipo="line"
                  titulo="Tickets creados y cerrados por mes"
                  subtitulo="Comparación mensual de tickets registrados y cerrados."
                  data={{
                    labels: evolucion.evolucion?.map((e) => e.mesRotulo ?? e.periodo) ?? [],
                    datasets: [
                      {
                        label: 'Tickets creados',
                        data: evolucion.evolucion?.map((e) => e.ticketsCreados) ?? [],
                        borderColor: COLORES_GRAFICO.petroleo,
                        backgroundColor: COLORES_GRAFICO.petroleo,
                      },
                      {
                        label: 'Tickets cerrados',
                        data: evolucion.evolucion?.map((e) => e.ticketsCerrados) ?? [],
                        borderColor: COLORES_GRAFICO.exito,
                        backgroundColor: COLORES_GRAFICO.exito,
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>

              <CCol xs={12} lg={4}>
                <GraficoChart
                  id="grafico-tickets-estado"
                  tipo="bar"
                  titulo="Tickets según su estado"
                  subtitulo="Distribución de los tickets registrados en el período seleccionado."
                  data={{
                    labels: evolucion.porEstado?.map((e) => e.nombre) ?? [],
                    datasets: [
                      {
                        label: 'Cantidad de tickets',
                        data: evolucion.porEstado?.map((e) => e.cantidad) ?? [],
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>
            </CRow>

            <CRow className="g-3 mb-3">
              <CCol xs={12} lg={7}>
                <GraficoChart
                  id="grafico-areas-incidencias"
                  tipo="bar"
                  horizontal={true}
                  titulo="Áreas con más incidencias"
                  subtitulo="Cantidad de fallas registradas en activos de cada área."
                  mensajeVacio="Sin incidencias en el período seleccionado"
                  data={{
                    labels: rankingAreas.slice(0, 8).map((a) => a.nombreArea ?? a.nombre) ?? [],
                    datasets: [
                      {
                        label: 'Fallas registradas',
                        data: rankingAreas.slice(0, 8).map((a) => a.cantidadFallas ?? a.fallas) ?? [],
                      },
                    ],
                  }}
                  altura={Math.max(200, Math.min(rankingAreas.length, 8) * 44 + 70)}
                />
              </CCol>

              {/* Correctivas y preventivas ya se leen en el indicador «Órdenes de trabajo». */}
              <CCol xs={12} lg={5}>
                <GraficoChart
                  id="grafico-ordenes-prioridad"
                  tipo="doughnut"
                  titulo="Órdenes por prioridad"
                  subtitulo="Órdenes no canceladas incluidas en el período seleccionado."
                  data={{
                    labels: ordenes.porPrioridad?.map((p) => p.nombre) ?? [],
                    datasets: [
                      {
                        data: ordenes.porPrioridad?.map((p) => p.cantidad) ?? [],
                      },
                    ],
                  }}
                  altura={280}
                />
              </CCol>
            </CRow>

            <CCard className="shadow-sm">
              <CCardHeader className="py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-semibold d-flex align-items-center gap-2">
                  <CIcon icon={cilClock} aria-hidden="true" />
                  Tiempos promedio de resolución por área
                </span>
                {tiempos.porArea?.length > 0 && (
                  <span className="small text-body-secondary">{tiempos.porArea.length} áreas evaluadas</span>
                )}
              </CCardHeader>
              <CCardBody className="p-3">
                {tiempos.porArea?.length > 0 ? (
                  <div className="table-responsive">
                    <CTable hover small className="align-middle mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Área</CTableHeaderCell>
                          <CTableHeaderCell>Edificio</CTableHeaderCell>
                          <CTableHeaderCell className="text-end">Tickets</CTableHeaderCell>
                          <CTableHeaderCell className="text-end">Tiempo promedio</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>
                      <CTableBody>
                        {tiempos.porArea.map((a, idx) => (
                          <CTableRow key={a.id ?? `sin-area-${idx}`}>
                            <CTableDataCell className="fw-medium">{a.nombre}</CTableDataCell>
                            <CTableDataCell className="text-body-secondary">{a.edificio || '-'}</CTableDataCell>
                            <CTableDataCell className="text-end">{a.cantidadTickets}</CTableDataCell>
                            <CTableDataCell className="text-end fw-semibold">
                              {textoTiempo(a.promedioSegundos)}
                            </CTableDataCell>
                          </CTableRow>
                        ))}
                      </CTableBody>
                    </CTable>
                  </div>
                ) : (
                  <div className="text-body-secondary small py-3">
                    No se registraron tickets cerrados en las áreas durante este período.
                  </div>
                )}
              </CCardBody>
            </CCard>
          </section>
        </>
      )}
    </>
  );
}
