/**
 * Módulo de exportación analítica del Panel de Administración a informe PDF.
 *
 * Genera un informe formal en PDF (formato A4) con:
 * - Encabezado institucional SIGMA, período seleccionado y marca temporal UTC-3.
 * - Indicadores clave de gestión (KPIs).
 * - Las mismas tablas analíticas que exportaba el panel, cada una con su título,
 *   tabla de datos y su gráfico correspondiente.
 * - Paginación limpia, repetición de encabezados de tabla en saltos de página
 *   y estado vacío explícito ("Sin datos en el período") cuando corresponda.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { textoTiempo } from '../utils/duracion.js';

const COLOR_PRIMARIO_RGB = [50, 31, 219]; // #321fdb
const COLOR_TEXTO_TITULO = [30, 41, 59];
const COLOR_TEXTO_MUTED = [100, 116, 139];

/**
 * Formatea una fecha ISO o actual a la zona horaria de Argentina (UTC-3).
 */
export function formatearFechaUtc3(fechaIso) {
  const d = fechaIso ? new Date(fechaIso) : new Date();
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/**
 * Obtiene la fecha de hoy en formato YYYY-MM-DD para el nombre de archivo.
 */
export function fechaHoyArchivoUtc3() {
  const ahora = new Date();
  const formato = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formato.format(ahora); // YYYY-MM-DD
}

/**
 * Aplica autoTable de forma segura tanto en ESM (navegador) como en CJS/Jest.
 */
function aplicarAutoTable(doc, opciones) {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(opciones);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, opciones);
  } else if (autoTable?.default) {
    autoTable.default(doc, opciones);
  }
}

/**
 * Construye el documento jsPDF con todas las tablas y gráficos requeridos.
 *
 * @param {object} payloadPanel - Objeto { datos, metadatos } consolidado del panel.
 * @param {object} [opciones]
 * @param {object} [opciones.imagenesGraficos] - Mapa de { [idGrafico]: dataUrlPng }
 * @returns {jsPDF} Instancia configurada de jsPDF.
 */
export function generarDocumentoPdf(payloadPanel, { imagenesGraficos = {} } = {}) {
  const datos = payloadPanel?.datos ?? {};
  const metadatos = payloadPanel?.metadatos ?? {};

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margenIzq = 14;
  const margenDer = 14;
  const margenSup = 20;
  const margenInf = 20;
  const anchoUtil = pageWidth - margenIzq - margenDer;

  // Encabezado institucional de la primera página
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLOR_PRIMARIO_RGB);
  doc.text('SIGMA', margenIzq, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLOR_TEXTO_TITULO);
  doc.text('Informe del Panel de Control', margenIzq, 26);

  // Período
  let textoPeriodo = 'Histórico (sin límite temporal)';
  if (metadatos.filtros?.desde && metadatos.filtros?.hasta) {
    textoPeriodo = `${metadatos.filtros.desde} al ${metadatos.filtros.hasta}`;
  } else if (metadatos.filtros?.desde) {
    textoPeriodo = `Desde ${metadatos.filtros.desde}`;
  } else if (metadatos.filtros?.hasta) {
    textoPeriodo = `Hasta ${metadatos.filtros.hasta}`;
  }

  const fechaGeneracion = formatearFechaUtc3(metadatos.generadoEn);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLOR_TEXTO_MUTED);
  doc.text(
    `Período: ${textoPeriodo}   |   Generado: ${fechaGeneracion} (UTC-3)   |   Alcance: ${metadatos.alcance ?? 'Todo el sistema'}`,
    margenIzq,
    32
  );

  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(margenIzq, 35, pageWidth - margenDer, 35);

  let currentY = 41;

  /**
   * Agrega una sección completa: título de la tabla, tabla de datos y gráfico asociado.
   */
  function agregarSeccion({
    titulo,
    columnas,
    filas,
    idGrafico,
    anchoGrafico = 150,
    altoGrafico = 60,
  }) {
    const hayDatos = Array.isArray(filas) && filas.length > 0;
    const imagen = idGrafico ? imagenesGraficos[idGrafico] : null;

    // Verificar si necesitamos salto de página antes del título y tabla
    const espacioNecesario = hayDatos ? 35 : 20;
    if (currentY + espacioNecesario > pageHeight - margenInf) {
      doc.addPage();
      currentY = margenSup;
    }

    // Título de la tabla (sin subtítulos según especificación)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(...COLOR_TEXTO_TITULO);
    doc.text(titulo, margenIzq, currentY);
    currentY += 4;

    if (!hayDatos) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...COLOR_TEXTO_MUTED);
      doc.text('Sin datos en el período', margenIzq, currentY + 2);
      currentY += 12;
      return;
    }

    aplicarAutoTable(doc, {
      head: [columnas],
      body: filas,
      startY: currentY,
      margin: { left: margenIzq, right: margenDer, top: margenSup, bottom: margenInf },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        font: 'helvetica',
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
        lineWidth: 0.1,
      },
      headStyles: {
        fillColor: COLOR_PRIMARIO_RGB,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7.5,
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252],
      },
      showHead: 'everyPage',
    });

    const finalY = doc.lastAutoTable?.finalY ?? currentY + 20;
    currentY = finalY + 5;

    // Agregar gráfico correspondiente si existe imagen
    if (imagen) {
      if (currentY + altoGrafico > pageHeight - margenInf) {
        doc.addPage();
        currentY = margenSup;
      }
      const xGrafico = margenIzq + (anchoUtil - anchoGrafico) / 2;
      try {
        doc.addImage(imagen, 'PNG', xGrafico, currentY, anchoGrafico, altoGrafico);
        currentY += altoGrafico + 8;
      } catch (err) {
        console.warn(`[pdf] Error al insertar imagen del gráfico ${idGrafico}:`, err);
        currentY += 4;
      }
    } else {
      currentY += 4;
    }
  }

  // ─── 1. TABLA: INDICADORES CLAVE DE GESTIÓN (KPIs) ──────────────────────────
  const resumen = datos.resumenGeneral ?? {};
  const tiemposGen = datos.tiemposResolucion?.general ?? {};
  const kpisFilas = [
    [
      'Tasa de operatividad de activos',
      `${resumen.operatividad?.porcentaje ?? 0} %`,
      `${resumen.operatividad?.operativos ?? 0} de ${resumen.operatividad?.enServicio ?? 0} en servicio`,
      `${resumen.operatividad?.retirados ?? 0} retirados (Total: ${resumen.operatividad?.totalActivos ?? 0}) · Estado actual`,
    ],
    [
      'Tiempo promedio de resolución',
      tiemposGen.promedioSegundos ? textoTiempo(tiemposGen.promedioSegundos) : 'Sin datos',
      `${tiemposGen.cantidadTickets ?? 0} tickets cerrados evaluados`,
      'Período seleccionado',
    ],
    [
      'Cobertura preventiva',
      `${resumen.coberturaPreventiva?.porcentajeTipos ?? 0} %`,
      `${resumen.coberturaPreventiva?.tiposConPlan ?? 0} de ${resumen.coberturaPreventiva?.totalTipos ?? 0} tipos cubiertos`,
      `${resumen.coberturaPreventiva?.activosCubiertos ?? 0} activos amparados (${resumen.coberturaPreventiva?.porcentajeActivos ?? 0} %) · Planes vigentes`,
    ],
    [
      'Disponibilidad técnica',
      `${resumen.disponibilidadTecnicos?.porcentaje ?? 0} %`,
      `${resumen.disponibilidadTecnicos?.disponibles ?? 0} de ${resumen.disponibilidadTecnicos?.totalTecnicos ?? 0} técnicos disponibles`,
      'Plantel de técnicos activos · Estado actual',
    ],
    [
      'Materiales por debajo del stock mínimo',
      `${resumen.materialesBajoMinimo?.bajoMinimo ?? 0}`,
      `de ${resumen.materialesBajoMinimo?.totalMateriales ?? 0} insumos registrados`,
      `${resumen.materialesBajoMinimo?.porcentaje ?? 0} % del inventario · Stock actual`,
    ],
  ];
  agregarSeccion({
    titulo: 'Indicadores Clave de Gestión (KPIs)',
    columnas: ['Indicador Clave (KPI)', 'Valor Principal', 'Denominador / Total (n)', 'Detalle'],
    filas: kpisFilas,
  });

  // ─── 2. TABLA Y GRÁFICO: EVOLUCIÓN MENSUAL DE TICKETS ───────────────────────
  const evolucion = datos.evolucionTickets?.evolucion ?? [];
  const filasEvolucion = evolucion.map((f) => [
    f.mesRotulo ?? f.periodo,
    f.ticketsCreados ?? 0,
    f.ticketsCerrados ?? 0,
  ]);
  agregarSeccion({
    titulo: 'Tickets creados y cerrados por mes',
    columnas: ['Período', 'Tickets Creados', 'Tickets Cerrados'],
    filas: filasEvolucion,
    idGrafico: 'grafico-evolucion-tickets',
    altoGrafico: 62,
  });

  // ─── 3. TABLA Y GRÁFICO: TICKETS SEGÚN SU ESTADO ───────────────────────────
  const porEstado = (datos.evolucionTickets?.porEstado ?? []).filter(
    (e) => e.nombre !== 'Finalizado' && e.id !== 5
  );
  const filasTicketsEstado = porEstado.map((e) => [
    e.nombre,
    e.cantidad ?? 0,
    `${e.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Tickets según su estado',
    columnas: ['Estado del Ticket', 'Cantidad', 'Porcentaje'],
    filas: filasTicketsEstado,
    idGrafico: 'grafico-tickets-estado',
    altoGrafico: 55,
  });

  // ─── 4. TABLA Y GRÁFICO: ÁREAS CON MÁS INCIDENCIAS ─────────────────────────
  const rawAreas = datos.areasIncidencia;
  const listaAreas = Array.isArray(rawAreas) ? rawAreas : (rawAreas?.ranking ?? []);
  const filasAreas = listaAreas.map((a) => [
    a.nombreArea ?? a.nombre ?? 'Sin área',
    a.nombreEdificio || '-',
    a.cantidadFallas ?? a.fallas ?? 0,
    a.cantidadTickets ?? a.tickets ?? 0,
    `${a.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Áreas con más incidencias',
    columnas: ['Área', 'Edificio', 'Fallas Totales', 'Tickets Afectados', 'Porcentaje'],
    filas: filasAreas,
    idGrafico: 'grafico-areas-incidencias',
    altoGrafico: 62,
  });

  // ─── 5. TABLA Y GRÁFICO: ÓRDENES DE TRABAJO POR ORIGEN ─────────────────────
  const otOrigen = datos.ordenesTrabajo?.porOrigen ?? {};
  const totalOtOrigen = (otOrigen.correctivas ?? 0) + (otOrigen.preventivas ?? 0);
  const filasOtOrigen = totalOtOrigen > 0 ? [
    ['Correctivas', otOrigen.correctivas ?? 0, `${otOrigen.porcentajeCorrectivas ?? 0} %`],
    ['Preventivas', otOrigen.preventivas ?? 0, `${otOrigen.porcentajePreventivas ?? 0} %`],
  ] : [];
  agregarSeccion({
    titulo: 'Órdenes de trabajo por origen',
    columnas: ['Origen', 'Cantidad', 'Porcentaje'],
    filas: filasOtOrigen,
    idGrafico: 'grafico-ordenes-origen',
    anchoGrafico: 90,
    altoGrafico: 55,
  });

  // ─── 6. TABLA Y GRÁFICO: ÓRDENES DE TRABAJO POR PRIORIDAD ──────────────────
  const otPrioridad = datos.ordenesTrabajo?.porPrioridad ?? [];
  const filasOtPrioridad = otPrioridad.map((p) => [
    p.nombre,
    p.cantidad ?? 0,
    `${p.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Órdenes de trabajo por prioridad',
    columnas: ['Prioridad', 'Cantidad', 'Porcentaje'],
    filas: filasOtPrioridad,
    idGrafico: 'grafico-ordenes-prioridad',
    anchoGrafico: 90,
    altoGrafico: 55,
  });

  // ─── 7. TABLA Y GRÁFICO: ACTIVOS EN SERVICIO POR EDIFICIO ──────────────────
  const activosEdificios = datos.activos?.porEdificio ?? [];
  const filasActivosEdificio = activosEdificios.map((ed) => [
    ed.nombre,
    ed.cantidad ?? 0,
    `${ed.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Activos en servicio por edificio',
    columnas: ['Edificio', 'Activos en Servicio', 'Porcentaje'],
    filas: filasActivosEdificio,
    idGrafico: 'grafico-activos-edificio',
    altoGrafico: 60,
  });

  // ─── 8. TABLA Y GRÁFICO: ACTIVOS SEGÚN SU ESTADO ───────────────────────────
  const activosEstados = datos.activos?.porEstado ?? [];
  const filasActivosEstado = activosEstados.map((st) => [
    st.nombre,
    st.cantidad ?? 0,
    `${st.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Activos según su estado',
    columnas: ['Estado', 'Cantidad', 'Porcentaje'],
    filas: filasActivosEstado,
    idGrafico: 'grafico-activos-estado',
    anchoGrafico: 90,
    altoGrafico: 55,
  });

  // ─── 9. TABLA Y GRÁFICO: CARGA TÉCNICA ─────────────────────────────────────
  const tecnicosCarga = datos.cargaTecnicos?.porTecnico ?? [];
  const filasTecnicos = tecnicosCarga.map((t) => [
    t.nombre,
    t.tareasActivas ?? 0,
    t.disponible ? 'Disponible' : 'No disponible',
    `${t.porcentaje ?? 0} %`,
  ]);
  agregarSeccion({
    titulo: 'Tareas pendientes por técnico',
    columnas: ['Técnico', 'Tareas Pendientes', 'Disponibilidad', 'Porcentaje de Carga'],
    filas: filasTecnicos,
    idGrafico: 'grafico-carga-tecnicos',
    altoGrafico: 60,
  });

  // ─── 10. TABLA: MATERIALES POR DEBAJO DEL STOCK MÍNIMO ─────────────────────
  const materialesItems = datos.resumenGeneral?.materialesBajoMinimo?.items ?? [];
  const filasMateriales = materialesItems.map((m) => [
    m.codigo,
    m.nombre,
    m.stockActual ?? 0,
    m.stockMinimo ?? 0,
    `+${m.faltante ?? 0}`,
  ]);
  agregarSeccion({
    titulo: 'Materiales por debajo del stock mínimo',
    columnas: ['Código', 'Material', 'Stock Actual', 'Stock Mínimo', 'Faltante'],
    filas: filasMateriales,
  });

  // ─── 11. TABLA: TIEMPOS PROMEDIO DE RESOLUCIÓN POR ÁREA ────────────────────
  const tiemposArea = datos.tiemposResolucion?.porArea ?? [];
  const filasTiemposArea = tiemposArea.map((a) => [
    a.nombre ?? 'Sin área',
    a.edificio || '-',
    a.cantidadTickets ?? 0,
    textoTiempo(a.promedioSegundos),
  ]);
  agregarSeccion({
    titulo: 'Tiempos promedio de resolución por área',
    columnas: ['Área', 'Edificio', 'Tickets Cerrados', 'Tiempo Promedio'],
    filas: filasTiemposArea,
  });

  // Numeración de páginas en el pie de página
  const totalPaginas = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPaginas; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('SIGMA · Sistema Integral de Gestión de Mantenimiento de Activos', margenIzq, 287);
    doc.text(`Página ${i} de ${totalPaginas}`, pageWidth - margenDer, 287, { align: 'right' });
  }

  return doc;
}

/**
 * Genera el documento PDF como un Uint8Array desacoplado del navegador.
 */
export async function generarBytesPdf(payloadPanel, opciones = {}) {
  const doc = generarDocumentoPdf(payloadPanel, opciones);
  const buffer = doc.output('arraybuffer');
  return new Uint8Array(buffer);
}

/**
 * Disparador de descarga de archivo PDF en el navegador del usuario.
 * Cumple con el formato de nombre: informe-panel-AAAA-MM-DD.pdf.
 */
export async function exportarPanelPdf(payloadPanel, opciones = {}) {
  const doc = generarDocumentoPdf(payloadPanel, opciones);
  const fechaHoy = fechaHoyArchivoUtc3();
  const nombreArchivo = `informe-panel-${fechaHoy}.pdf`;
  doc.save(nombreArchivo);
  return nombreArchivo;
}
