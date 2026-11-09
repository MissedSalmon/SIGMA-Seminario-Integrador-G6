/**
 * Módulo de exportación analítica del Panel de Administración a archivo .xlsx (D1, D3).
 *
 * Principios aplicados:
 * - D1: Gráficos NATIVOS de hoja de cálculo con @office-kit/xlsx.
 * - D3: Generación 100% en el cliente (navegador), sin endpoint de descarga en backend.
 * - S13: Alcance visible ("Todo el sistema").
 * - S14: Frescura y zona horaria declaradas.
 * - S15: Mismo contrato y cálculo que en pantalla (serialización pura sin recálculo).
 * - Seguridad: Sanitización estricta contra inyección de fórmulas CSV/Excel (CSV Formula Injection).
 */
import { createWorkbook, addWorksheet } from '@office-kit/xlsx/workbook';
import { setCellByCoord } from '@office-kit/xlsx/worksheet';
import {
  makeChartSpace,
  makeLineChart,
  makeBarChart,
  makeDoughnutChart,
} from '@office-kit/xlsx/chart';
import { addChartAt } from '@office-kit/xlsx/drawing';
import { workbookToBytes } from '@office-kit/xlsx/io';
import fileSaver from 'file-saver';
const saveAs = fileSaver?.saveAs || fileSaver;

export const LIMITE_FILAS_SEGURIDAD = 50000;

/**
 * Sanitiza valores de texto para prevenir inyección de fórmulas (Formula Injection).
 * Si un valor inicia con '=', '+', '-', '@', '\t' o '\r', antepone un apóstrofe simple (').
 *
 * @param {any} valor
 * @returns {string}
 */
export function sanitizarTextoExcel(valor) {
  if (valor == null) return '';
  const texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) {
    return `'${texto}`;
  }
  return texto;
}

/**
 * Genera el libro Excel con datos y gráficos nativos como Uint8Array desacoplado del navegador.
 *
 * @param {object} payloadPanel - Objeto { datos, metadatos } devuelto por /api/estadisticas/panel-completo
 * @returns {Promise<Uint8Array>}
 */
export async function generarBytesLibroPanel(payloadPanel) {
  const datos = payloadPanel?.datos ?? {};
  const metadatos = payloadPanel?.metadatos ?? {};

  const wb = createWorkbook();

  // ─── HOJA 1: RESUMEN ──────────────────────────────────────────────────────────
  const wsResumen = addWorksheet(wb, 'Resumen');
  setCellByCoord(wsResumen, 'A1', 'SIGMA - Panel de Estadísticas y Mantenimiento');
  setCellByCoord(wsResumen, 'A2', `Alcance: ${sanitizarTextoExcel(metadatos.alcance ?? 'Todo el sistema')}`);
  setCellByCoord(
    wsResumen,
    'A3',
    `Fecha de generación: ${metadatos.generadoEn ?? new Date().toISOString()} (${metadatos.zonaHoraria ?? 'America/Argentina/Buenos_Aires'})`
  );
  setCellByCoord(
    wsResumen,
    'A4',
    `Versión del sistema: ${metadatos.versionSistema ?? '0.1.0'} (Commit: ${metadatos.commit ?? '899b562d0c76832de809bf99f3e5875703e503e7'})`
  );
  if (metadatos.filtros?.desde || metadatos.filtros?.hasta) {
    setCellByCoord(
      wsResumen,
      'A5',
      `Filtros aplicados: Desde ${metadatos.filtros?.desde ?? 'Inicio'} Hasta ${metadatos.filtros?.hasta ?? 'Actualidad'}`
    );
  }

  // Tabla resumen de KPIs
  setCellByCoord(wsResumen, 'A7', 'Indicador Clave (KPI)');
  setCellByCoord(wsResumen, 'B7', 'Valor Principal');
  setCellByCoord(wsResumen, 'C7', 'Denominador / Total (n)');
  setCellByCoord(wsResumen, 'D7', 'Detalle');

  const resumen = datos.resumenGeneral ?? {};
  const tiempos = datos.tiemposResolucion?.general ?? {};

  const kpis = [
    [
      'Tasa de operatividad de activos',
      `${resumen.operatividad?.porcentaje ?? 0} %`,
      `${resumen.operatividad?.operativos ?? 0} de ${resumen.operatividad?.enServicio ?? 0} en servicio`,
      `${resumen.operatividad?.retirados ?? 0} retirados (Total: ${resumen.operatividad?.totalActivos ?? 0})`,
    ],
    [
      'Tiempo promedio de resolución',
      tiempos.promedioSegundos ? `${Math.round(tiempos.promedioSegundos / 3600)} horas` : 'Sin datos',
      `${tiempos.cantidadTickets ?? 0} tickets cerrados`,
      'Período seleccionado',
    ],
    [
      'Cobertura preventiva',
      `${resumen.coberturaPreventiva?.porcentajeTipos ?? 0} % tipos`,
      `${resumen.coberturaPreventiva?.tiposConPlan ?? 0} de ${resumen.coberturaPreventiva?.totalTipos ?? 0} tipos`,
      `${resumen.coberturaPreventiva?.activosCubiertos ?? 0} activos amparados (${resumen.coberturaPreventiva?.porcentajeActivos ?? 0} %)`,
    ],
    [
      'Disponibilidad técnica',
      `${resumen.disponibilidadTecnicos?.porcentaje ?? 0} %`,
      `${resumen.disponibilidadTecnicos?.disponibles ?? 0} de ${resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} técnicos`,
      'Plantel operativo activo',
    ],
    [
      'Materiales bajo stock mínimo',
      `${resumen.materialesBajoMinimo?.bajoMinimo ?? 0} críticos`,
      `${resumen.materialesBajoMinimo?.bajoMinimo ?? 0} de ${resumen.materialesBajoMinimo?.totalMateriales ?? 0} materiales`,
      `${resumen.materialesBajoMinimo?.porcentaje ?? 0} % del inventario`,
    ],
  ];

  kpis.forEach((fila, idx) => {
    const r = 8 + idx;
    setCellByCoord(wsResumen, `A${r}`, fila[0]);
    setCellByCoord(wsResumen, `B${r}`, fila[1]);
    setCellByCoord(wsResumen, `C${r}`, fila[2]);
    setCellByCoord(wsResumen, `D${r}`, fila[3]);
  });

  // ─── HOJA 2: DEFINICIONES ─────────────────────────────────────────────────────
  const wsDef = addWorksheet(wb, 'Definiciones');
  setCellByCoord(wsDef, 'A1', 'Código');
  setCellByCoord(wsDef, 'B1', 'Métrica');
  setCellByCoord(wsDef, 'C1', 'Fórmula de Cálculo');
  setCellByCoord(wsDef, 'D1', 'Origen de Datos (tabla.columna)');
  setCellByCoord(wsDef, 'E1', 'Tipo de Gráfico');

  const definiciones = metadatos.definiciones ?? [];
  definiciones.forEach((d, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsDef, `A${r}`, sanitizarTextoExcel(d.id));
    setCellByCoord(wsDef, `B${r}`, sanitizarTextoExcel(d.nombre));
    setCellByCoord(wsDef, `C${r}`, sanitizarTextoExcel(d.formula));
    setCellByCoord(wsDef, `D${r}`, sanitizarTextoExcel(d.origen));
    setCellByCoord(wsDef, `E${r}`, sanitizarTextoExcel(d.tipoGrafico));
  });

  // ─── HOJA 3: EVOLUCIÓN DE TICKETS (M-11) ──────────────────────────────────────
  const wsEvolucion = addWorksheet(wb, 'Evolucion_Tickets');
  setCellByCoord(wsEvolucion, 'A1', 'Período');
  setCellByCoord(wsEvolucion, 'B1', 'Tickets Creados');
  setCellByCoord(wsEvolucion, 'C1', 'Tickets Cerrados');

  const evolucion = datos.evolucionTickets?.evolucion ?? [];
  const filasEvolucion = evolucion.slice(0, LIMITE_FILAS_SEGURIDAD);
  filasEvolucion.forEach((fila, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsEvolucion, `A${r}`, sanitizarTextoExcel(fila.mesRotulo ?? fila.periodo));
    setCellByCoord(wsEvolucion, `B${r}`, Number(fila.ticketsCreados ?? 0));
    setCellByCoord(wsEvolucion, `C${r}`, Number(fila.ticketsCerrados ?? 0));
  });

  if (filasEvolucion.length > 0) {
    const topFila = filasEvolucion.length + 1;
    const chartEvolucion = makeLineChart({
      series: [
        {
          idx: 0,
          order: 0,
          val: { ref: `Evolucion_Tickets!$B$2:$B$${topFila}` },
          cat: { ref: `Evolucion_Tickets!$A$2:$A$${topFila}` },
          tx: { kind: 'literal', value: 'Tickets Creados' },
        },
        {
          idx: 1,
          order: 1,
          val: { ref: `Evolucion_Tickets!$C$2:$C$${topFila}` },
          cat: { ref: `Evolucion_Tickets!$A$2:$A$${topFila}` },
          tx: { kind: 'literal', value: 'Tickets Cerrados' },
        },
      ],
    });
    const spaceEvolucion = makeChartSpace({
      title: 'Evolución de Tickets: Creados vs. Cerrados',
      plotArea: { chart: chartEvolucion },
    });
    addChartAt(wsEvolucion, 'E2', { space: spaceEvolucion }, { widthPx: 640, heightPx: 360 });
  }

  // ─── HOJA 4: INCIDENCIAS POR ÁREA (M-04) ──────────────────────────────────────
  const wsIncidencias = addWorksheet(wb, 'Incidencias_Areas');
  setCellByCoord(wsIncidencias, 'A1', 'Área');
  setCellByCoord(wsIncidencias, 'B1', 'Fallas Totales');
  setCellByCoord(wsIncidencias, 'C1', 'Tickets Afectados');
  setCellByCoord(wsIncidencias, 'D1', 'Porcentaje');

  const incidencias = datos.areasIncidencia?.ranking ?? [];
  const filasIncidencias = incidencias.slice(0, LIMITE_FILAS_SEGURIDAD);
  filasIncidencias.forEach((fila, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsIncidencias, `A${r}`, sanitizarTextoExcel(fila.nombreArea ?? fila.nombre ?? 'Sin área'));
    setCellByCoord(wsIncidencias, `B${r}`, Number(fila.cantidadFallas ?? fila.fallas ?? 0));
    setCellByCoord(wsIncidencias, `C${r}`, Number(fila.cantidadTickets ?? fila.tickets ?? 0));
    setCellByCoord(wsIncidencias, `D${r}`, Number(fila.porcentaje ?? 0));
  });

  if (filasIncidencias.length > 0) {
    const topFila = filasIncidencias.length + 1;
    const chartIncidencias = makeBarChart({
      barDir: 'bar',
      series: [
        {
          idx: 0,
          order: 0,
          val: { ref: `Incidencias_Areas!$B$2:$B$${topFila}` },
          cat: { ref: `Incidencias_Areas!$A$2:$A$${topFila}` },
          tx: { kind: 'literal', value: 'Fallas por Área' },
        },
      ],
    });
    const spaceIncidencias = makeChartSpace({
      title: 'Ranking de Incidencias por Área',
      plotArea: { chart: chartIncidencias },
    });
    addChartAt(wsIncidencias, 'F2', { space: spaceIncidencias }, { widthPx: 640, heightPx: 360 });
  }

  // ─── HOJA 5: ÓRDENES DE TRABAJO (M-08, M-09, M-10) ───────────────────────────
  const wsOt = addWorksheet(wb, 'OT_Distribucion');
  // Tabla A: Origen
  setCellByCoord(wsOt, 'A1', 'Origen');
  setCellByCoord(wsOt, 'B1', 'Cantidad');
  setCellByCoord(wsOt, 'C1', 'Porcentaje');
  const otOrigen = datos.ordenesTrabajo?.porOrigen ?? {};
  setCellByCoord(wsOt, 'A2', 'Correctivas');
  setCellByCoord(wsOt, 'B2', Number(otOrigen.correctivas ?? 0));
  setCellByCoord(wsOt, 'C2', Number(otOrigen.porcentajeCorrectivas ?? 0));
  setCellByCoord(wsOt, 'A3', 'Preventivas');
  setCellByCoord(wsOt, 'B3', Number(otOrigen.preventivas ?? 0));
  setCellByCoord(wsOt, 'C3', Number(otOrigen.porcentajePreventivas ?? 0));

  const chartOrigen = makeDoughnutChart({
    series: [
      {
        idx: 0,
        order: 0,
        val: { ref: 'OT_Distribucion!$B$2:$B$3' },
        cat: { ref: 'OT_Distribucion!$A$2:$A$3' },
        tx: { kind: 'literal', value: 'OTs por Origen' },
      },
    ],
  });
  const spaceOrigen = makeChartSpace({
    title: 'Órdenes de Trabajo por Origen',
    plotArea: { chart: chartOrigen },
  });
  addChartAt(wsOt, 'E2', { space: spaceOrigen }, { widthPx: 480, heightPx: 300 });

  // Tabla B: Prioridad
  setCellByCoord(wsOt, 'A8', 'Prioridad');
  setCellByCoord(wsOt, 'B8', 'Cantidad');
  setCellByCoord(wsOt, 'C8', 'Porcentaje');
  const otPrioridad = datos.ordenesTrabajo?.porPrioridad ?? [];
  otPrioridad.forEach((p, idx) => {
    const r = 9 + idx;
    setCellByCoord(wsOt, `A${r}`, sanitizarTextoExcel(p.nombre));
    setCellByCoord(wsOt, `B${r}`, Number(p.cantidad ?? 0));
    setCellByCoord(wsOt, `C${r}`, Number(p.porcentaje ?? 0));
  });

  if (otPrioridad.length > 0) {
    const topFilaPrioridad = 8 + otPrioridad.length;
    const chartPrioridad = makeDoughnutChart({
      series: [
        {
          idx: 0,
          order: 0,
          val: { ref: `OT_Distribucion!$B$9:$B$${topFilaPrioridad}` },
          cat: { ref: `OT_Distribucion!$A$9:$A$${topFilaPrioridad}` },
          tx: { kind: 'literal', value: 'OTs por Prioridad' },
        },
      ],
    });
    const spacePrioridad = makeChartSpace({
      title: 'Órdenes de Trabajo por Prioridad',
      plotArea: { chart: chartPrioridad },
    });
    addChartAt(wsOt, 'E14', { space: spacePrioridad }, { widthPx: 480, heightPx: 300 });
  }

  // ─── HOJA 6: ACTIVOS POR EDIFICIO (M-03) ──────────────────────────────────────
  const wsEdificios = addWorksheet(wb, 'Activos_Edificios');
  setCellByCoord(wsEdificios, 'A1', 'Edificio');
  setCellByCoord(wsEdificios, 'B1', 'Activos en Servicio');
  setCellByCoord(wsEdificios, 'C1', 'Porcentaje');

  const edificios = datos.activos?.porEdificio ?? [];
  edificios.forEach((ed, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsEdificios, `A${r}`, sanitizarTextoExcel(ed.nombre));
    setCellByCoord(wsEdificios, `B${r}`, Number(ed.cantidad ?? 0));
    setCellByCoord(wsEdificios, `C${r}`, Number(ed.porcentaje ?? 0));
  });

  if (edificios.length > 0) {
    const topFilaEd = edificios.length + 1;
    const chartEdificios = makeBarChart({
      barDir: 'bar',
      series: [
        {
          idx: 0,
          order: 0,
          val: { ref: `Activos_Edificios!$B$2:$B$${topFilaEd}` },
          cat: { ref: `Activos_Edificios!$A$2:$A$${topFilaEd}` },
          tx: { kind: 'literal', value: 'Activos en Servicio' },
        },
      ],
    });
    const spaceEdificios = makeChartSpace({
      title: 'Distribución de Activos por Edificio',
      plotArea: { chart: chartEdificios },
    });
    addChartAt(wsEdificios, 'E2', { space: spaceEdificios }, { widthPx: 640, heightPx: 360 });
  }

  // ─── HOJA 7: CARGA TÉCNICA (M-14) ─────────────────────────────────────────────
  const wsTecnicos = addWorksheet(wb, 'Tecnicos_Carga');
  setCellByCoord(wsTecnicos, 'A1', 'Técnico');
  setCellByCoord(wsTecnicos, 'B1', 'Tareas Activas');
  setCellByCoord(wsTecnicos, 'C1', 'Disponibilidad');
  setCellByCoord(wsTecnicos, 'D1', 'Porcentaje de Carga');

  const tecnicos = datos.cargaTecnicos?.porTecnico ?? [];
  tecnicos.forEach((t, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsTecnicos, `A${r}`, sanitizarTextoExcel(t.nombre));
    setCellByCoord(wsTecnicos, `B${r}`, Number(t.tareasActivas ?? 0));
    setCellByCoord(wsTecnicos, `C${r}`, t.disponible ? 'Disponible' : 'No disponible');
    setCellByCoord(wsTecnicos, `D${r}`, Number(t.porcentaje ?? 0));
  });

  if (tecnicos.length > 0) {
    const topFilaTec = tecnicos.length + 1;
    const chartTecnicos = makeBarChart({
      barDir: 'bar',
      series: [
        {
          idx: 0,
          order: 0,
          val: { ref: `Tecnicos_Carga!$B$2:$B$${topFilaTec}` },
          cat: { ref: `Tecnicos_Carga!$A$2:$A$${topFilaTec}` },
          tx: { kind: 'literal', value: 'Tareas Activas' },
        },
      ],
    });
    const spaceTecnicos = makeChartSpace({
      title: 'Carga de Trabajo Activa por Técnico',
      plotArea: { chart: chartTecnicos },
    });
    addChartAt(wsTecnicos, 'F2', { space: spaceTecnicos }, { widthPx: 640, heightPx: 360 });
  }

  // ─── HOJA 8: MATERIALES CRÍTICOS (M-16) ───────────────────────────────────────
  const wsMateriales = addWorksheet(wb, 'Materiales_Criticos');
  setCellByCoord(wsMateriales, 'A1', 'Código');
  setCellByCoord(wsMateriales, 'B1', 'Material');
  setCellByCoord(wsMateriales, 'C1', 'Stock Actual');
  setCellByCoord(wsMateriales, 'D1', 'Stock Mínimo');
  setCellByCoord(wsMateriales, 'E1', 'Faltante');

  const materiales = datos.resumenGeneral?.materialesBajoMinimo?.items ?? [];
  materiales.forEach((m, idx) => {
    const r = 2 + idx;
    setCellByCoord(wsMateriales, `A${r}`, sanitizarTextoExcel(m.codigo));
    setCellByCoord(wsMateriales, `B${r}`, sanitizarTextoExcel(m.nombre));
    setCellByCoord(wsMateriales, `C${r}`, Number(m.stockActual ?? 0));
    setCellByCoord(wsMateriales, `D${r}`, Number(m.stockMinimo ?? 0));
    setCellByCoord(wsMateriales, `E${r}`, Number(m.faltante ?? 0));
  });

  return await workbookToBytes(wb);
}

/**
 * Disparador de descarga de archivo .xlsx en el navegador del usuario.
 *
 * @param {object} payloadPanel - Objeto { datos, metadatos }
 */
export async function exportarPanelXlsx(payloadPanel) {
  const bytes = await generarBytesLibroPanel(payloadPanel);
  const blob = new Blob([bytes], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const fechaStr = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
    .format(new Date())
    .replace(/[/, :]/g, '')
    .slice(0, 12);

  saveAs(blob, `panel-estadisticas-${fechaStr}.xlsx`);
}
