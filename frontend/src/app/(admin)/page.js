'use client';

/**
 * Tablero de Control / Panel Analítico del Administrador (Sprint 7, FE-01).
 *
 * Muestra el estado integral de la gestión de mantenimiento, infraestructura y pañol:
 * - Indicadores clave (KPIs) con denominadores visibles (S4).
 * - Gráficos analíticos mediante GraficoChart con principios anti-sesgo (S9, S10, S11).
 * - Selector de períodos temporales y filtros personalizados responsive.
 * - Exportación analítica en formato PDF generada 100% en el navegador (D1, D3, S15).
 * - Indicadores visibles de alcance ("Todo el sistema") y frescura horaria (S13, S14).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CBadge,
  CButton,
  CButtonGroup,
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

function restarDias(fechaStr, dias) {
  const d = new Date(fechaStr);
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
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

  const aplicarFiltroPersonalizado = (e) => {
    e?.preventDefault();
    if (desde && hasta && desde > hasta) {
      setError('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    cargarDatos(desde, hasta);
  };

  const handleExportar = async () => {
    if (!panelPayload) return;
    setExportando(true);
    try {
      const imagenesGraficos = {};
      const idsGraficos = [
        'grafico-evolucion-tickets',
        'grafico-tickets-estado',
        'grafico-areas-incidencias',
        'grafico-ordenes-origen',
        'grafico-ordenes-prioridad',
        'grafico-carga-tecnicos',
        'grafico-activos-edificio',
        'grafico-activos-estado',
      ];

      idsGraficos.forEach((id) => {
        const cont = document.getElementById(id);
        const canvas = cont?.querySelector('canvas');
        if (canvas) {
          try {
            // Fondo blanco para impresión nítida en papel A4
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const ctx = tempCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
            ctx.drawImage(canvas, 0, 0);
            imagenesGraficos[id] = tempCanvas.toDataURL('image/png');
          } catch (e) {
            console.warn(`[pdf] Error al capturar canvas de ${id}:`, e);
          }
        }
      });

      await exportarPanelPdf(panelPayload, { imagenesGraficos });
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

  // Formato de fecha de frescura
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
          <div className="small text-body-secondary">
            <span>Actualizado: <strong>{fechaFrescura}</strong> (UTC-3)</span>
          </div>
        </div>

        <div className="d-flex flex-wrap align-items-center gap-2">
          <CButton
            color="primary"
            variant="outline"
            disabled={cargando}
            onClick={() => cargarDatos(desde, hasta)}
            className="d-flex align-items-center gap-2 shadow-sm"
          >
            <CIcon icon={cilReload} />
            <span>Actualizar</span>
          </CButton>

          <CButton
            color="success"
            disabled={cargando || exportando || !panelPayload}
            onClick={handleExportar}
            className="d-flex align-items-center gap-2 text-white shadow-sm"
            title="Exportar informe en formato PDF"
            aria-label="Exportar informe"
          >
            {exportando ? (
              <>
                <CSpinner size="sm" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} />
                <span>Exportar</span>
              </>
            )}
          </CButton>
        </div>
      </div>

      <AvisoPlanesPorVencer />

      {/* Barra de Filtros Temporales */}
      <CCard className="mb-4 shadow-sm">
        <CCardBody className="p-3">
          <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center justify-content-between gap-3">
            {/* Selector en móvil (< 768px): dropdown accesible sin overflow horizontal */}
            <div className="d-block d-md-none w-100">
              <label htmlFor="select-periodo-movil" className="small fw-semibold text-body-secondary mb-1 d-block">
                Período:
              </label>
              <select
                id="select-periodo-movil"
                className="form-select form-select-sm"
                value={preset}
                onChange={(e) => {
                  const seleccionado = PRESETS_PERIODO.find((p) => p.clave === e.target.value);
                  if (seleccionado) aplicarPreset(seleccionado);
                }}
              >
                {PRESETS_PERIODO.map((p) => (
                  <option key={p.clave} value={p.clave}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Selector en pantallas medianas y grandes (>= 768px): botones con wrap */}
            <div className="d-none d-md-flex flex-wrap align-items-center gap-2">
              <span className="small fw-semibold text-body-secondary me-2">Período:</span>
              <div className="btn-group btn-group-sm flex-wrap" role="group">
                {PRESETS_PERIODO.map((p) => (
                  <CButton
                    key={p.clave}
                    color={preset === p.clave ? 'primary' : 'secondary'}
                    variant={preset === p.clave ? 'solid' : 'outline'}
                    onClick={() => aplicarPreset(p)}
                  >
                    {p.label}
                  </CButton>
                ))}
              </div>
            </div>

            {preset === 'personalizado' && (
              <form onSubmit={aplicarFiltroPersonalizado} className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-end gap-2 w-100 w-lg-auto mt-2 mt-lg-0">
                <div className="flex-grow-1">
                  <CampoFecha
                    id="desde"
                    etiqueta="Desde"
                    valor={desde}
                    alCambiar={setDesde}
                    maximo={hasta || hoyTexto()}
                  />
                </div>
                <div className="flex-grow-1">
                  <CampoFecha
                    id="hasta"
                    etiqueta="Hasta"
                    valor={hasta}
                    alCambiar={setHasta}
                    minimo={desde}
                    maximo={hoyTexto()}
                  />
                </div>
                <CButton type="submit" color="primary" size="sm" className="mb-1">
                  Aplicar
                </CButton>
              </form>
            )}
          </div>
        </CCardBody>
      </CCard>

      {error && <Aviso mensaje={error} onCerrar={() => setError(null)} />}

      {cargando && !panelPayload ? (
        <Cargando texto="Cargando estadísticas consolidadas del sistema..." />
      ) : (
        <>
          {/* ─── INDICADORES CLAVE (KPIs) ─────────────────────────────────────── */}
          <div className="sigma-kpi-grid">
            {/* KPI 1 · Operatividad de Activos */}
            <div className="sigma-kpi-card border-start-primary">
              <div>
                <div className="sigma-kpi-title" title="Operatividad de activos en servicio">
                  Operatividad de Activos
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
                  {resumen.operatividad?.retirados ?? 0} retirados (Total: {resumen.operatividad?.totalActivos ?? 0}) · Estado actual
                </div>
              </div>
            </div>

            {/* KPI 2 · Tiempo Promedio de Resolución */}
            <div className="sigma-kpi-card border-start-secondary">
              <div>
                <div className="sigma-kpi-title" title="Tiempo promedio de resolución de tickets cerrados">
                  Tiempo Promedio Resolución
                </div>
                <div className="sigma-kpi-value text-body">
                  {textoTiempo(tiempos.general?.promedioSegundos)}
                </div>
              </div>
              <div className="sigma-kpi-footer">
                <div>
                  <strong>{tiempos.general?.cantidadTickets ?? 0}</strong> tickets cerrados evaluados
                </div>
                <div className="sigma-kpi-subtext">
                  En el período seleccionado
                </div>
              </div>
            </div>

            {/* KPI 3 · Cobertura Preventiva */}
            <div className={`sigma-kpi-card ${
              (resumen.coberturaPreventiva?.porcentajeTipos ?? 0) === 100 ? 'border-start-success' : 'border-start-primary'
            }`}>
              <div>
                <div
                  className="sigma-kpi-title"
                  title="Tipos de activo con al menos un plan preventivo vigente"
                >
                  Cobertura Preventiva
                </div>
                <div className={`sigma-kpi-value ${
                  (resumen.coberturaPreventiva?.porcentajeTipos ?? 0) === 100 ? 'text-success' : 'text-body'
                }`}>
                  {resumen.coberturaPreventiva?.porcentajeTipos != null ? `${resumen.coberturaPreventiva.porcentajeTipos} %` : '-'}
                </div>
              </div>
              <div className="sigma-kpi-footer">
                <div>
                  {(resumen.coberturaPreventiva?.porcentajeTipos ?? 0) === 100 ? (
                    <span className="text-success fw-semibold">
                      <CIcon icon={cilCheckCircle} className="me-1" />
                      Todos los tipos cubiertos ({resumen.coberturaPreventiva?.totalTipos ?? 0} de {resumen.coberturaPreventiva?.totalTipos ?? 0})
                    </span>
                  ) : (
                    <>
                      <strong>{resumen.coberturaPreventiva?.tiposConPlan ?? 0}</strong> de {resumen.coberturaPreventiva?.totalTipos ?? 0} tipos cubiertos
                    </>
                  )}
                </div>
                <div className="sigma-kpi-subtext d-flex align-items-center justify-content-between gap-1 flex-wrap">
                  <span>
                    {resumen.coberturaPreventiva?.activosCubiertos ?? 0} activos amparados ({resumen.coberturaPreventiva?.porcentajeActivos ?? 0} %)
                  </span>
                  {(resumen.coberturaPreventiva?.porcentajeTipos ?? 0) < 100 && (
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

            {/* KPI 4 · Disponibilidad Técnica */}
            <div className="sigma-kpi-card border-start-secondary">
              <div>
                <div className="sigma-kpi-title" title="Disponibilidad del plantel técnico">
                  Disponibilidad Técnica
                </div>
                <div className="sigma-kpi-value text-body">
                  {resumen.disponibilidadTecnicos?.porcentaje != null ? `${resumen.disponibilidadTecnicos.porcentaje} %` : '-'}
                </div>
              </div>
              <div className="sigma-kpi-footer">
                <div>
                  <strong>{resumen.disponibilidadTecnicos?.disponibles ?? 0}</strong> de {resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} disponibles
                </div>
                <div className="sigma-kpi-subtext">
                  Plantel de técnicos activos · Estado actual
                </div>
              </div>
            </div>

            {/* KPI 5 · Materiales por debajo del stock mínimo */}
            <div className={`sigma-kpi-card ${
              (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'border-start-danger' : 'border-start-success'
            }`}>
              <div>
                <div className="sigma-kpi-title" title="Materiales por debajo del stock mínimo de seguridad">
                  Materiales por debajo del stock mínimo
                </div>
                <div className={`sigma-kpi-value ${
                  (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'text-danger' : 'text-success'
                }`}>
                  {resumen.materialesBajoMinimo?.bajoMinimo ?? 0}
                </div>
              </div>
              <div className="sigma-kpi-footer">
                <div>
                  de <strong>{resumen.materialesBajoMinimo?.totalMateriales ?? 0}</strong> insumos registrados
                </div>
                <div className="sigma-kpi-subtext">
                  {resumen.materialesBajoMinimo?.porcentaje ?? 0} % del inventario · Stock actual
                </div>
              </div>
            </div>
          </div>

          {/* ─── SECCIÓN A: MANTENIMIENTO Y TICKETS ──────────────────────────── */}
          <div className="mb-4">
            <h2 className="h5 fw-bold text-body-secondary text-uppercase mb-3" style={{ letterSpacing: '0.05em' }}>
              Mantenimiento y tickets
            </h2>

            {/* Fila 1: Actividad y estado de tickets (8 cols + 4 cols) */}
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
                    labels: evolucion.porEstado?.filter((e) => e.nombre !== 'Finalizado' && e.id !== 5).map((e) => e.nombre) ?? [],
                    datasets: [
                      {
                        label: 'Cantidad de tickets',
                        data: evolucion.porEstado?.filter((e) => e.nombre !== 'Finalizado' && e.id !== 5).map((e) => e.cantidad) ?? [],
                        backgroundColor: '#39f',
                      },
                    ],
                  }}
                  altura={320}
                />
              </CCol>
            </CRow>

            {/* Fila 2: Incidencias y órdenes de trabajo (6 cols + 3 cols + 3 cols) */}
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
          </div>

          {/* ─── SECCIÓN B: PERSONAL E INVENTARIO DE ACTIVOS ─────────────────── */}
          <div className="mb-4">
            <h2 className="h5 fw-bold text-body-secondary text-uppercase mb-3" style={{ letterSpacing: '0.05em' }}>
              Personal e inventario de activos
            </h2>

            {/* Fila 1: Carga de trabajo (12 cols) */}
            <CRow className="g-3 mb-3">
              <CCol xs={12}>
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
            </CRow>

            {/* Fila 2: Inventario de activos (8 cols + 4 cols) */}
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
          </div>

          {/* ─── AUDITORÍA Y TABLAS DE DETALLE ─────────────────────────────── */}
          <div className="mb-4">
            <CCard className="shadow-sm">
              <CCardHeader className="py-2 bg-body-tertiary">
                <span className="fw-semibold text-body">Auditoría y Tablas de Detalle</span>
              </CCardHeader>

              <CCardBody className="p-3">
                <CRow className="g-4">
                  {/* Detalle de Materiales Críticos */}
                  <CCol xs={12} lg={6}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CIcon icon={cilWarning} className="text-danger" />
                        Materiales Críticos bajo Stock Mínimo
                      </h6>
                      {resumen.materialesBajoMinimo?.items?.length > 0 && (
                        <CBadge color="danger">
                          {resumen.materialesBajoMinimo.items.length}{' '}
                          {resumen.materialesBajoMinimo.items.length === 1 ? 'material por debajo del stock mínimo' : 'materiales por debajo del stock mínimo'}
                        </CBadge>
                      )}
                    </div>
                    {resumen.materialesBajoMinimo?.items?.length > 0 ? (
                      <div className="table-responsive">
                        <CTable striped hover small className="align-middle">
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
                        No hay materiales con stock por debajo del mínimo de seguridad.
                      </div>
                    )}
                  </CCol>

                  {/* Detalle de Tiempos por Área */}
                  <CCol xs={12} lg={6}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <h6 className="fw-bold mb-0 d-flex align-items-center gap-2">
                        <CIcon icon={cilClock} className="text-info" />
                        Tiempos Promedio de Resolución por Área
                      </h6>
                      {tiempos.porArea?.length > 0 && (
                        <span className="small text-body-secondary">
                          {tiempos.porArea.length} áreas evaluadas
                        </span>
                      )}
                    </div>
                    {tiempos.porArea?.length > 0 ? (
                      <div className="table-responsive">
                        <CTable striped hover small className="align-middle">
                          <CTableHead className="table-light">
                            <CTableRow>
                              <CTableHeaderCell>Área</CTableHeaderCell>
                              <CTableHeaderCell>Edificio</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Tickets</CTableHeaderCell>
                              <CTableHeaderCell className="text-end">Tiempo Promedio</CTableHeaderCell>
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
                  </CCol>
                </CRow>
              </CCardBody>
            </CCard>
          </div>
        </>
      )}
    </>
  );
}
