'use client';

/**
 * Tablero de Control / Panel Analítico del Administrador (Sprint 7, FE-01).
 *
 * Muestra el estado integral de la gestión de mantenimiento, infraestructura y pañol:
 * - Indicadores clave (KPIs) con denominadores visibles (S4).
 * - Gráficos analíticos mediante GraficoChart con principios anti-sesgo (S9, S10, S11).
 * - Selector de períodos temporales y filtros personalizados.
 * - Exportación analítica nativa a formato .xlsx generada 100% en el navegador (D1, D3, S15).
 * - Indicadores visibles de alcance ("Todo el sistema") y frescura horaria (S13, S14).
 */
import { useEffect, useState, useTransition } from 'react';
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
  cilPeople,
  cilSpreadsheet,
} from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import AvisoPlanesPorVencer from '@/componentes/planes/AvisoPlanesPorVencer.js';
import Aviso from '@/componentes/Aviso.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';
import GraficoChart from '@/componentes/estadisticas/GraficoChart.js';
import { obtenerPanelCompleto } from '@/servicios/estadisticas.js';
import { exportarPanelXlsx } from '@/servicios/exportacionPanel.js';
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
  const [mostrarDetalles, setMostrarDetalles] = useState(false);

  const [, startTransition] = useTransition();

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
    cargarDatos(desde, hasta);
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
      await exportarPanelXlsx(panelPayload);
    } catch (err) {
      console.error('[panel] Error al exportar archivo .xlsx:', err);
      setError('No se pudo generar el archivo Excel. Verifique la consola para más detalles.');
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
          <EncabezadoPagina titulo="Panel de Control" />
          <div className="small text-body-secondary mt-n2 mb-2">
            <span>Actualizado: <strong>{fechaFrescura}</strong> (UTC-3)</span>
          </div>
        </div>

        <div className="d-flex align-items-center gap-2">
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
          >
            {exportando ? (
              <>
                <CSpinner size="sm" />
                <span>Exportando...</span>
              </>
            ) : (
              <>
                <CIcon icon={cilCloudDownload} />
                <span>Exportar a Excel</span>
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
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span className="small fw-semibold text-body-secondary me-2">Período:</span>
              <CButtonGroup size="sm" role="group">
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
              </CButtonGroup>
            </div>

            {preset === 'personalizado' && (
              <form onSubmit={aplicarFiltroPersonalizado} className="d-flex flex-wrap align-items-center gap-2">
                <CampoFecha
                  id="desde"
                  etiqueta="Desde"
                  valor={desde}
                  alCambiar={setDesde}
                  maximo={hasta || hoyTexto()}
                />
                <CampoFecha
                  id="hasta"
                  etiqueta="Hasta"
                  valor={hasta}
                  alCambiar={setHasta}
                  minimo={desde}
                  maximo={hoyTexto()}
                />
                <CButton type="submit" color="primary" size="sm" className="mt-3">
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
          {/* ─── FILA 1: TARJETAS KPI (M-01, M-06, M-07, M-15, M-16) ───────────── */}
          <CRow className="g-3 mb-4">
            {/* M-01 · Tasa de Operatividad de Activos */}
            <CCol sm={6} lg={4} xl>
              <CCard className="h-100 border-start border-start-4 border-start-success shadow-sm">
                <CCardBody className="p-3">
                  <div className="text-body-secondary text-uppercase fw-bold small">Operatividad de Activos</div>
                  <div className="fs-3 fw-bold text-success my-1">
                    {resumen.operatividad?.porcentaje != null ? `${resumen.operatividad.porcentaje} %` : '-'}
                  </div>
                  <div className="text-body-secondary small">
                    <strong>{resumen.operatividad?.operativos ?? 0}</strong> de {resumen.operatividad?.enServicio ?? 0} en servicio
                  </div>
                  <div className="text-body-tertiary small mt-1">
                    {resumen.operatividad?.retirados ?? 0} retirados (Total: {resumen.operatividad?.totalActivos ?? 0})
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* M-06 · Tiempo Promedio de Resolución */}
            <CCol sm={6} lg={4} xl>
              <CCard className="h-100 border-start border-start-4 border-start-info shadow-sm">
                <CCardBody className="p-3">
                  <div className="text-body-secondary text-uppercase fw-bold small">Tiempo Promedio Resolución</div>
                  <div className="fs-3 fw-bold text-info my-1">
                    {textoTiempo(tiempos.general?.promedioSegundos)}
                  </div>
                  <div className="text-body-secondary small">
                    <strong>{tiempos.general?.cantidadTickets ?? 0}</strong> tickets cerrados evaluados
                  </div>
                  <div className="text-body-tertiary small mt-1">
                    En el período seleccionado
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* M-07 · Cobertura Preventiva */}
            <CCol sm={6} lg={4} xl>
              <CCard className="h-100 border-start border-start-4 border-start-primary shadow-sm">
                <CCardBody className="p-3">
                  <div className="text-body-secondary text-uppercase fw-bold small">Cobertura Preventiva</div>
                  <div className="fs-3 fw-bold text-primary my-1">
                    {resumen.coberturaPreventiva?.porcentajeTipos != null ? `${resumen.coberturaPreventiva.porcentajeTipos} %` : '-'}
                  </div>
                  <div className="text-body-secondary small">
                    <strong>{resumen.coberturaPreventiva?.tiposConPlan ?? 0}</strong> de {resumen.coberturaPreventiva?.totalTipos ?? 0} tipos cubiertos
                  </div>
                  <div className="text-body-tertiary small mt-1">
                    {resumen.coberturaPreventiva?.activosCubiertos ?? 0} activos amparados ({resumen.coberturaPreventiva?.porcentajeActivos ?? 0} %)
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* M-15 · Disponibilidad del Plantel Técnico */}
            <CCol sm={6} lg={6} xl>
              <CCard className="h-100 border-start border-start-4 border-start-warning shadow-sm">
                <CCardBody className="p-3">
                  <div className="text-body-secondary text-uppercase fw-bold small">Disponibilidad Técnica</div>
                  <div className="fs-3 fw-bold text-warning my-1">
                    {resumen.disponibilidadTecnicos?.porcentaje != null ? `${resumen.disponibilidadTecnicos.porcentaje} %` : '-'}
                  </div>
                  <div className="text-body-secondary small">
                    <strong>{resumen.disponibilidadTecnicos?.disponibles ?? 0}</strong> de {resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} disponibles
                  </div>
                  <div className="text-body-tertiary small mt-1">
                    Plantel de técnicos activos
                  </div>
                </CCardBody>
              </CCard>
            </CCol>

            {/* M-16 · Materiales Críticos Bajo Mínimo */}
            <CCol sm={6} lg={6} xl>
              <CCard className={`h-100 border-start border-start-4 shadow-sm ${
                (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'border-start-danger' : 'border-start-success'
              }`}>
                <CCardBody className="p-3">
                  <div className="text-body-secondary text-uppercase fw-bold small">Materiales Bajo Mínimo</div>
                  <div className={`fs-3 fw-bold my-1 ${
                    (resumen.materialesBajoMinimo?.bajoMinimo ?? 0) > 0 ? 'text-danger' : 'text-success'
                  }`}>
                    {resumen.materialesBajoMinimo?.bajoMinimo ?? 0}
                  </div>
                  <div className="text-body-secondary small">
                    de <strong>{resumen.materialesBajoMinimo?.totalMateriales ?? 0}</strong> insumos registrados
                  </div>
                  <div className="text-body-tertiary small mt-1">
                    {resumen.materialesBajoMinimo?.porcentaje ?? 0} % del inventario
                  </div>
                </CCardBody>
              </CCard>
            </CCol>
          </CRow>

          {/* ─── FILA 2: MANTENIMIENTO CORRECTIVO ─────────────────────────────── */}
          <CRow className="g-3 mb-4">
            <CCol lg={8}>
              <GraficoChart
                tipo="line"
                titulo="Evolución mensual de tickets: Creados vs. Cerrados"
                subtitulo="Series cronológicas completas; períodos sin actividad en 0"
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

            <CCol lg={4}>
              <GraficoChart
                tipo="bar"
                titulo="Distribución de tickets por estado"
                subtitulo="Tickets dados de alta en el período"
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

          {/* ─── FILA 3: ÓRDENES DE TRABAJO E INCIDENCIAS ───────────────────────── */}
          <CRow className="g-3 mb-4">
            <CCol lg={6}>
              <GraficoChart
                tipo="bar"
                horizontal={true}
                titulo="Ranking de áreas con mayor incidencia de fallas"
                subtitulo="Top áreas con fallas registradas en activos"
                data={{
                  labels: areas.ranking?.slice(0, 8).map((a) => a.nombreArea ?? a.nombre) ?? [],
                  datasets: [
                    {
                      label: 'Fallas registradas',
                      data: areas.ranking?.slice(0, 8).map((a) => a.cantidadFallas ?? a.fallas) ?? [],
                      backgroundColor: '#e55353',
                    },
                  ],
                }}
                altura={320}
              />
            </CCol>

            <CCol lg={3}>
              <GraficoChart
                tipo="doughnut"
                titulo="Órdenes de trabajo por origen"
                subtitulo="Correctivas vs. Preventivas"
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

            <CCol lg={3}>
              <GraficoChart
                tipo="doughnut"
                titulo="Órdenes de trabajo por prioridad"
                subtitulo="OTs no canceladas en el período"
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

          {/* ─── FILA 4: RECURSOS Y PLANTA FÍSICA ───────────────────────────────── */}
          <CRow className="g-3 mb-4">
            <CCol lg={5}>
              <GraficoChart
                tipo="bar"
                horizontal={true}
                titulo="Carga de trabajo activa por técnico"
                subtitulo="Tareas asignadas pendientes de conclusión"
                data={{
                  labels: cargaTec.porTecnico?.map((t) => t.nombre) ?? [],
                  datasets: [
                    {
                      label: 'Tareas activas',
                      data: cargaTec.porTecnico?.map((t) => t.tareasActivas) ?? [],
                      backgroundColor: '#f9b115',
                    },
                  ],
                }}
                altura={320}
              />
            </CCol>

            <CCol lg={4}>
              <GraficoChart
                tipo="bar"
                horizontal={true}
                titulo="Activos inventariados por edificio"
                subtitulo="Activos en servicio (no retirados)"
                data={{
                  labels: activos.porEdificio?.map((e) => e.nombre) ?? [],
                  datasets: [
                    {
                      label: 'Activos',
                      data: activos.porEdificio?.map((e) => e.cantidad) ?? [],
                      backgroundColor: '#321fdb',
                    },
                  ],
                }}
                altura={320}
              />
            </CCol>

            <CCol lg={3}>
              <GraficoChart
                tipo="doughnut"
                titulo="Distribución de activos por estado"
                subtitulo="Ciclo de vida del equipamiento"
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

          {/* ─── FILA 5: SECCIÓN DE AUDITORÍA Y DETALLES TABULARES ───────────────── */}
          <CCard className="mb-4 shadow-sm">
            <CCardHeader className="d-flex justify-content-between align-items-center py-2 bg-body-tertiary">
              <span className="fw-semibold">Auditoría y Tablas de Detalle</span>
              <CButton
                color="secondary"
                variant="ghost"
                size="sm"
                onClick={() => setMostrarDetalles((prev) => !prev)}
              >
                {mostrarDetalles ? 'Ocultar detalles' : 'Mostrar tablas de auditoría'}
              </CButton>
            </CCardHeader>

            {mostrarDetalles && (
              <CCardBody className="p-3">
                <CRow className="g-4">
                  {/* Detalle de Materiales Críticos */}
                  <CCol lg={6}>
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <CIcon icon={cilWarning} className="text-danger" />
                      Materiales Críticos bajo Stock Mínimo
                    </h6>
                    {resumen.materialesBajoMinimo?.items?.length > 0 ? (
                      <div className="table-responsive">
                        <CTable striped hover small className="align-middle">
                          <CTableHead>
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
                                <CTableDataCell className="text-end fw-bold text-warning">
                                  +{m.faltante}
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
                  <CCol lg={6}>
                    <h6 className="fw-bold mb-3 d-flex align-items-center gap-2">
                      <CIcon icon={cilClock} className="text-info" />
                      Tiempos Promedio de Resolución por Área
                    </h6>
                    {tiempos.porArea?.length > 0 ? (
                      <div className="table-responsive">
                        <CTable striped hover small className="align-middle">
                          <CTableHead>
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
            )}
          </CCard>
        </>
      )}
    </>
  );
}
