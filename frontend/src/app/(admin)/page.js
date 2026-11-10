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
  CBadge,
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
  cilWarning,
  cilCheckCircle,
  cilClock,
} from '@coreui/icons';

import AvisoPlanesPorVencer from '@/componentes/planes/AvisoPlanesPorVencer.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';
import GraficoChart from '@/componentes/estadisticas/GraficoChart.js';
import { obtenerPanelCompleto } from '@/servicios/estadisticas.js';
import { exportarPanelPdf } from '@/servicios/exportacionPanel.js';
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

function restarDias(fechaStr, dias) {
  const d = new Date(fechaStr);
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

function TituloSeccion({ children }) {
  return (
    <h2 className="h5 fw-bold text-body-secondary text-uppercase mb-3" style={{ letterSpacing: '0.05em' }}>
      {children}
    </h2>
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
      await exportarPanelPdf(panelPayload);
    } catch (err) {
      console.error('[panel] Error al exportar archivo PDF:', err);
      setError('No se pudo generar el informe PDF. Verifique la consola para más detalles.');
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
          <h1 className="sigma-titulo mb-1">Panel de Control</h1>
          {metadatos.generadoEn && (
            <div className="small text-body-secondary">
              Actualizado: <strong>{fechaFrescura}</strong> (UTC-3)
            </div>
          )}
        </div>

        <div className="sigma-panel-acciones">
          <CButton
            color="secondary"
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

      <AvisoPlanesPorVencer />

      {error && <Aviso mensaje={error} onCerrar={() => setError(null)} />}

      {cargando && !panelPayload ? (
        <Cargando texto="Cargando estadísticas consolidadas del sistema..." />
      ) : (
        <>
          <section className="mb-5">
            <TituloSeccion>Situación actual</TituloSeccion>

            <div className="sigma-kpi-grid sigma-kpi-grid--4">
              <div className="sigma-kpi-card border-start-primary">
                <div>
                  <div className="sigma-kpi-title" title="Operatividad de activos en servicio">
                    Operatividad de activos
                  </div>
                  <div className="sigma-kpi-value text-body">
                    {resumen.operatividad?.porcentaje != null ? `${resumen.operatividad.porcentaje} %` : '-'}
                  </div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    <strong>{resumen.operatividad?.operativos ?? 0}</strong> de {resumen.operatividad?.enServicio ?? 0} en servicio
                  </div>
                  <div className="sigma-kpi-subtext">
                    {resumen.operatividad?.retirados ?? 0} retirados (Total: {resumen.operatividad?.totalActivos ?? 0})
                  </div>
                </div>
              </div>

              <div className={`sigma-kpi-card ${
                (resumen.coberturaPreventiva?.porcentajeActivos ?? 0) === 100 ? 'border-start-success' : 'border-start-primary'
              }`}>
                <div>
                  <div
                    className="sigma-kpi-title"
                    title="Activos en servicio cuyo tipo tiene un plan preventivo vigente"
                  >
                    Cobertura preventiva
                  </div>
                  <div className={`sigma-kpi-value ${
                    (resumen.coberturaPreventiva?.porcentajeActivos ?? 0) === 100 ? 'text-success' : 'text-body'
                  }`}>
                    {resumen.coberturaPreventiva?.porcentajeActivos != null ? `${resumen.coberturaPreventiva.porcentajeActivos} %` : '-'}
                  </div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    {(resumen.coberturaPreventiva?.porcentajeActivos ?? 0) === 100 ? (
                      <span className="text-success fw-semibold">
                        <CIcon icon={cilCheckCircle} className="me-1" />
                        Todos los activos cubiertos ({resumen.coberturaPreventiva?.totalActivosEnServicio ?? 0})
                      </span>
                    ) : (
                      <>
                        <strong>{resumen.coberturaPreventiva?.activosCubiertos ?? 0}</strong> de {resumen.coberturaPreventiva?.totalActivosEnServicio ?? 0} activos en servicio
                      </>
                    )}
                  </div>
                  <div className="sigma-kpi-subtext d-flex align-items-center justify-content-between gap-1 flex-wrap">
                    <span>
                      {resumen.coberturaPreventiva?.tiposConPlan ?? 0} tipos de activo con plan
                    </span>
                    {(resumen.coberturaPreventiva?.porcentajeActivos ?? 0) < 100 && (
                      <Link
                        href="/planes-mantenimiento"
                        className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle text-decoration-none d-inline-flex align-items-center gap-1"
                        title={resumen.coberturaPreventiva?.tiposSinPlan?.length > 0
                          ? `Sin plan vigente: ${resumen.coberturaPreventiva.tiposSinPlan.map((t) => t.nombre).join(', ')}`
                          : 'Gestionar planes de mantenimiento'}
                      >
                        <span>
                          {resumen.coberturaPreventiva?.tiposSinPlan?.length ?? ((resumen.coberturaPreventiva?.totalTipos ?? 0) - (resumen.coberturaPreventiva?.tiposConPlan ?? 0))} sin plan
                        </span>
                        <span aria-hidden="true">&rarr;</span>
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              <div className="sigma-kpi-card border-start-secondary">
                <div>
                  <div className="sigma-kpi-title" title="Disponibilidad del plantel técnico">
                    Disponibilidad técnica
                  </div>
                  <div className="sigma-kpi-value text-body">
                    {resumen.disponibilidadTecnicos?.porcentaje != null ? `${resumen.disponibilidadTecnicos.porcentaje} %` : '-'}
                  </div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    <strong>{resumen.disponibilidadTecnicos?.disponibles ?? 0}</strong> de {resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} disponibles
                  </div>
                </div>
              </div>

              <div className={`sigma-kpi-card ${
                (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'border-start-danger' : 'border-start-success'
              }`}>
                <div>
                  <div className="sigma-kpi-title" title="Materiales por debajo del stock mínimo">
                    Materiales bajo stock mínimo
                  </div>
                  <div className={`sigma-kpi-value ${
                    (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'text-danger' : 'text-success'
                  }`}>
                    {resumen.materialesBajoMinimo?.bajoMinimo ?? 0}
                  </div>
                </div>
                <div className="sigma-kpi-footer">
                  <div>
                    de <strong>{resumen.materialesBajoMinimo?.totalMateriales ?? 0}</strong> materiales registrados
                  </div>
                  <div className="sigma-kpi-subtext">
                    {resumen.materialesBajoMinimo?.porcentaje ?? 0} % del inventario
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
                        backgroundColor: '#321fdb',
                      },
                    ],
                  }}
                  altura={320}
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
                  altura={320}
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
                        backgroundColor: '#f9b115',
                      },
                    ],
                  }}
                  altura={Math.max(260, (cargaTec.porTecnico?.length ?? 0) * 36 + 80)}
                />
              </CCol>

              <CCol xs={12} lg={6}>
                <CCard className="shadow-sm h-100">
                  <CCardHeader className="py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                    <span className="fw-semibold d-flex align-items-center gap-2">
                      <CIcon icon={cilWarning} className="text-danger" />
                      Materiales bajo stock mínimo
                    </span>
                    {resumen.materialesBajoMinimo?.items?.length > 0 && (
                      <CBadge color="danger">{resumen.materialesBajoMinimo.items.length}</CBadge>
                    )}
                  </CCardHeader>
                  <CCardBody className="p-3">
                    {resumen.materialesBajoMinimo?.items?.length > 0 ? (
                      <div className="table-responsive">
                        <CTable striped hover small className="align-middle mb-0">
                          <CTableHead className="table-light">
                            <CTableRow>
                              <CTableHeaderCell>Código</CTableHeaderCell>
                              <CTableHeaderCell>Material</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Actual</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Mínimo</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Faltante</CTableHeaderCell>
                            </CTableRow>
                          </CTableHead>
                          <CTableBody>
                            {resumen.materialesBajoMinimo.items.map((m) => (
                              <CTableRow key={m.codigo}>
                                <CTableDataCell className="fw-medium">{m.codigo}</CTableDataCell>
                                <CTableDataCell>{m.nombre}</CTableDataCell>
                                <CTableDataCell className="text-end fw-bold text-danger">
                                  {m.stockActual}
                                </CTableDataCell>
                                <CTableDataCell className="text-end text-body-secondary">
                                  {m.stockMinimo}
                                </CTableDataCell>
                                <CTableDataCell className="text-end">
                                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle fw-semibold">
                                    +{m.faltante}
                                  </span>
                                </CTableDataCell>
                              </CTableRow>
                            ))}
                          </CTableBody>
                        </CTable>
                      </div>
                    ) : (
                      <div className="text-body-secondary small py-3">
                        <CIcon icon={cilCheckCircle} className="text-success me-1" />
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
              </CCardBody>
            </CCard>

            <div className="sigma-kpi-grid sigma-kpi-grid--3">
              <div className="sigma-kpi-card border-start-secondary">
                <div>
                  <div className="sigma-kpi-title" title="Tiempo promedio de resolución de los tickets cerrados en el período">
                    Tiempo promedio de resolución
                  </div>
                  <div className="sigma-kpi-value text-body">
                    {textoTiempo(tiempos.general?.promedioSegundos)}
                  </div>
                </div>
                <div className="sigma-kpi-footer">
                  <strong>{tiempos.general?.cantidadTickets ?? 0}</strong> tickets cerrados
                </div>
              </div>

              <div className="sigma-kpi-card border-start-secondary">
                <div>
                  <div className="sigma-kpi-title" title="Tickets dados de alta en el período">
                    Tickets registrados
                  </div>
                  <div className="sigma-kpi-value text-body">{evolucion.totalTicketsPeriodo ?? 0}</div>
                </div>
                <div className="sigma-kpi-footer">
                  <strong>{evolucion.porEstado?.find((e) => e.id === 6)?.cantidad ?? 0}</strong> ya cerrados
                </div>
              </div>

              <div className="sigma-kpi-card border-start-secondary">
                <div>
                  <div className="sigma-kpi-title" title="Órdenes de trabajo dadas de alta en el período">
                    Órdenes de trabajo
                  </div>
                  <div className="sigma-kpi-value text-body">{ordenes.porOrigen?.total ?? 0}</div>
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
                        borderColor: '#321fdb',
                        backgroundColor: 'rgba(50, 31, 219, 0.1)',
                      },
                      {
                        label: 'Tickets cerrados',
                        data: evolucion.evolucion?.map((e) => e.ticketsCerrados) ?? [],
                        borderColor: '#2eb85c',
                        backgroundColor: 'rgba(46, 184, 92, 0.1)',
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
                        backgroundColor: '#39f',
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>
            </CRow>

            <CRow className="g-3 mb-3">
              <CCol xs={12} lg={6}>
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
                        backgroundColor: '#e55353',
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>

              <CCol xs={12} sm={6} lg={3}>
                <GraficoChart
                  id="grafico-ordenes-origen"
                  tipo="doughnut"
                  titulo="Órdenes de trabajo por tipo"
                  subtitulo="Comparación entre órdenes correctivas y preventivas."
                  data={{
                    labels: ['Correctivas', 'Preventivas'],
                    datasets: [
                      {
                        data: [
                          ordenes.porOrigen?.correctivas ?? 0,
                          ordenes.porOrigen?.preventivas ?? 0,
                        ],
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>

              <CCol xs={12} sm={6} lg={3}>
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
                  altura={320}
                />
              </CCol>
            </CRow>

            <CCard className="shadow-sm">
              <CCardHeader className="py-2 d-flex align-items-center justify-content-between flex-wrap gap-2">
                <span className="fw-semibold d-flex align-items-center gap-2">
                  <CIcon icon={cilClock} className="text-info" />
                  Tiempos promedio de resolución por área
                </span>
                {tiempos.porArea?.length > 0 && (
                  <span className="small text-body-secondary">{tiempos.porArea.length} áreas evaluadas</span>
                )}
              </CCardHeader>
              <CCardBody className="p-3">
                {tiempos.porArea?.length > 0 ? (
                  <div className="table-responsive">
                    <CTable striped hover small className="align-middle mb-0">
                      <CTableHead className="table-light">
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
                            <CTableDataCell className="text-end fw-bold text-info">
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
