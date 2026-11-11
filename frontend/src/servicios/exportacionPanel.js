/**
 * Informe PDF del panel del administrador (A4, se arma en el navegador).
 *
 * Portada con los indicadores clave y el índice; después una sección por tema.
 * Cada bloque dice su base: «Período» (lo que pasó entre las fechas elegidas) o
 * «Estado actual» (la situación al momento de generar el informe).
 * Los gráficos se dibujan acá con vectores: no dependen del tamaño ni del tema de la pantalla.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { textoTiempo } from '../utils/duracion.js';

const COLOR = {
  azul: [31, 59, 77],
  azulMedio: [74, 107, 130],
  azulClaro: [160, 180, 195],
  arena: [238, 236, 231],
  linea: [217, 214, 207],
  texto: [34, 48, 58],
  gris: [107, 119, 128],
  blanco: [255, 255, 255],
};

const PAGINA = { ancho: 210, alto: 297, margen: 18, arriba: 26, abajo: 276 };
const ANCHO_UTIL = PAGINA.ancho - 2 * PAGINA.margen;
const M = PAGINA.margen;

const BASE = { periodo: 'Período', actual: 'Estado actual' };

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Formatea una fecha ISO (o la actual) en la hora de Argentina (UTC-3). */
export function formatearFechaUtc3(fechaIso) {
  const d = fechaIso ? new Date(fechaIso) : new Date();
  return new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(d);
}

/** La fecha de hoy en Argentina como AAAA-MM-DD, para el nombre del archivo. */
export function fechaHoyArchivoUtc3() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/** autoTable se exporta distinto en el navegador (ESM) y en Jest (CJS). */
function aplicarAutoTable(doc, opciones) {
  if (typeof doc.autoTable === 'function') {
    doc.autoTable(opciones);
  } else if (typeof autoTable === 'function') {
    autoTable(doc, opciones);
  } else if (autoTable?.default) {
    autoTable.default(doc, opciones);
  }
}

const numero = (valor) => Number(valor ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 1 });
const porcentaje = (valor) => `${numero(valor)} %`;

/** "2026-11-09" -> "09/11/2026". */
function fechaCorta(iso) {
  if (!iso) return null;
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

function textoPeriodo(filtros = {}) {
  const desde = fechaCorta(filtros.desde);
  const hasta = fechaCorta(filtros.hasta);
  if (desde && hasta) return `${desde} al ${hasta}`;
  if (desde) return `Desde el ${desde}`;
  if (hasta) return `Hasta el ${hasta}`;
  return 'Histórico completo';
}

/** El rótulo del mes sale de "2026-11" y no del texto de la base, que depende del idioma del servidor. */
function rotuloMes(fila) {
  const [anio, mes] = String(fila.periodo ?? '').split('-');
  const nombre = MESES[Number(mes) - 1];
  return nombre ? `${nombre} ${anio}` : String(fila.mesRotulo ?? fila.periodo ?? '');
}

/** El paso de la escala del eje: 1, 2 o 5 por una potencia de 10. */
function pasoRedondo(valor) {
  const potencia = 10 ** Math.floor(Math.log10(valor));
  const base = valor / potencia;
  const factor = base <= 1 ? 1 : base <= 2 ? 2 : base <= 5 ? 5 : 10;
  return Math.max(1, factor * potencia);
}

function indicadoresClave(datos) {
  const resumen = datos.resumenGeneral ?? {};
  const operatividad = resumen.operatividad ?? {};
  const cobertura = resumen.coberturaPreventiva ?? {};
  const tecnicos = resumen.disponibilidadTecnicos ?? {};
  const materiales = resumen.materialesBajoMinimo ?? {};
  const tiempos = datos.tiemposResolucion?.general ?? {};

  return [
    {
      rotulo: 'Operatividad de activos',
      valor: porcentaje(operatividad.porcentaje),
      detalle: `${numero(operatividad.operativos)} de ${numero(operatividad.enServicio)} activos en servicio están operativos`,
      base: BASE.actual,
    },
    {
      rotulo: 'Tiempo promedio de resolución',
      valor: tiempos.promedioSegundos != null ? textoTiempo(tiempos.promedioSegundos) : 'Sin datos',
      detalle: `Sobre ${numero(tiempos.cantidadTickets)} tickets cerrados`,
      base: BASE.periodo,
    },
    {
      rotulo: 'Cobertura preventiva',
      valor: porcentaje(cobertura.porcentajeActivos),
      detalle: `${numero(cobertura.activosCubiertos)} de ${numero(cobertura.totalActivosEnServicio)} activos en servicio con plan; ${numero(cobertura.tiposConPlan)} tipos con plan`,
      base: BASE.actual,
    },
    {
      rotulo: 'Disponibilidad técnica',
      valor: porcentaje(tecnicos.porcentaje),
      detalle: `${numero(tecnicos.disponibles)} de ${numero(tecnicos.totalTecnicos)} técnicos disponibles`,
      base: BASE.actual,
    },
    {
      rotulo: 'Materiales bajo stock mínimo',
      valor: numero(materiales.bajoMinimo),
      detalle: `De ${numero(materiales.totalMateriales)} materiales registrados`,
      base: BASE.actual,
    },
  ];
}

/**
 * Construye el documento con la portada, las secciones y la numeración.
 *
 * @param {object} payloadPanel - { datos, metadatos } tal como los devuelve /estadisticas/panel-completo.
 * @returns {jsPDF}
 */
export function generarDocumentoPdf(payloadPanel) {
  const datos = payloadPanel?.datos ?? {};
  const metadatos = payloadPanel?.metadatos ?? {};
  const periodo = textoPeriodo(metadatos.filtros);
  const generado = `${formatearFechaUtc3(metadatos.generadoEn)} (UTC-3)`;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const indice = [];
  let y = 0;

  const paginaActual = () => doc.getCurrentPageInfo().pageNumber;

  function escribir(texto, x, yTexto, { tam = 8, estilo = 'normal', fuente = 'helvetica', color = COLOR.texto, ...opciones } = {}) {
    doc.setFont(fuente, estilo);
    doc.setFontSize(tam);
    doc.setTextColor(...color);
    doc.text(texto, x, yTexto, opciones);
  }

  function envolver(texto, ancho, { tam = 8, estilo = 'normal', fuente = 'helvetica' } = {}) {
    doc.setFont(fuente, estilo);
    doc.setFontSize(tam);
    return doc.splitTextToSize(texto, ancho);
  }

  function linea(x1, y1, x2, y2, color = COLOR.linea, grosor = 0.2) {
    doc.setDrawColor(...color);
    doc.setLineWidth(grosor);
    doc.line(x1, y1, x2, y2);
  }

  function rectangulo(x, yRect, ancho, alto, color) {
    doc.setFillColor(...color);
    doc.rect(x, yRect, ancho, alto, 'F');
  }

  function asegurarEspacio(alto) {
    if (y + alto > PAGINA.abajo) {
      doc.addPage();
      y = PAGINA.arriba;
    }
  }

  function tituloPortada(texto, yTitulo) {
    escribir(texto.toUpperCase(), M, yTitulo, { fuente: 'times', tam: 13, color: COLOR.azul, charSpace: 0.5 });
    linea(M, yTitulo + 3, M + ANCHO_UTIL, yTitulo + 3, COLOR.azul, 0.3);
  }

  function abrirSeccion(titulo, base) {
    const numeroSeccion = String(indice.length + 1).padStart(2, '0');
    if (indice.length === 0) {
      doc.addPage();
      y = PAGINA.arriba;
    } else {
      y += 6;
      asegurarEspacio(80);
    }
    indice.push({ numero: numeroSeccion, titulo, base, pagina: paginaActual() });

    escribir(numeroSeccion, M, y + 6, { fuente: 'times', tam: 20, color: COLOR.azulClaro });
    escribir(titulo.toUpperCase(), M + 14, y + 6, { fuente: 'times', tam: 15, color: COLOR.azul, charSpace: 0.4 });
    escribir(base.toUpperCase(), M + ANCHO_UTIL, y + 6, { tam: 6.5, estilo: 'bold', color: COLOR.azulMedio, align: 'right' });
    linea(M, y + 9.5, M + ANCHO_UTIL, y + 9.5, COLOR.azul, 0.4);
    y += 19;
  }

  function tituloBloque(titulo, detalle, x = M, ancho = ANCHO_UTIL) {
    escribir(titulo, x, y, { tam: 9.5, estilo: 'bold' });
    y += 1.5;
    if (detalle) {
      const lineas = envolver(detalle, ancho, { tam: 7 });
      escribir(lineas, x, y + 3.5, { tam: 7, color: COLOR.gris, lineHeightFactor: 1.35 });
      y += 3.5 + lineas.length * 3.3;
    }
    y += 2;
  }

  /**
   * Tabla sin grilla, con líneas finas entre filas. Si una columna tiene `barra`,
   * en esa celda se dibuja una barra proporcional a `valorBarra` de cada fila.
   */
  function tabla({ columnas, filas, pie, x = M, ancho = ANCHO_UTIL, vacio = 'Sin datos en el período.' }) {
    if (!filas.length) {
      escribir(vacio, x, y + 3, { tam: 8, estilo: 'italic', color: COLOR.gris });
      y += 13;
      return;
    }

    const indiceBarra = columnas.findIndex((c) => c.barra);
    const maximo = Math.max(0, ...filas.map((f) => Number(f.valorBarra) || 0)) || 1;

    aplicarAutoTable(doc, {
      startY: y,
      margin: { left: x, right: PAGINA.ancho - x - ancho, top: PAGINA.arriba, bottom: PAGINA.alto - PAGINA.abajo },
      tableWidth: ancho,
      head: [columnas.map((c) => c.titulo.toUpperCase())],
      body: filas.map((f) => f.celdas),
      foot: pie ? [pie] : undefined,
      theme: 'plain',
      showHead: 'everyPage',
      showFoot: 'lastPage',
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: COLOR.texto,
        cellPadding: { top: 2.1, bottom: 2.1, left: 1.5, right: 1.5 },
        lineColor: COLOR.linea,
        lineWidth: { bottom: 0.1 },
        valign: 'middle',
      },
      headStyles: {
        fontSize: 6.5,
        fontStyle: 'bold',
        textColor: COLOR.gris,
        lineColor: COLOR.azul,
        lineWidth: { bottom: 0.35 },
      },
      footStyles: {
        fontStyle: 'bold',
        textColor: COLOR.texto,
        lineColor: COLOR.azul,
        lineWidth: { top: 0.35 },
      },
      columnStyles: Object.fromEntries(
        columnas.map((c, i) => [i, { cellWidth: c.ancho ?? 'auto', halign: c.alinear ?? 'left' }])
      ),
      didParseCell: (celda) => {
        celda.cell.styles.halign = columnas[celda.column.index]?.alinear ?? 'left';
      },
      didDrawCell: (celda) => {
        if (celda.section !== 'body' || celda.column.index !== indiceBarra) return;
        const valor = Number(filas[celda.row.index]?.valorBarra) || 0;
        const { x: xCelda, y: yCelda, width, height } = celda.cell;
        const altoBarra = 2.6;
        const yBarra = yCelda + (height - altoBarra) / 2;
        const anchoPista = width - 3;
        rectangulo(xCelda + 1.5, yBarra, anchoPista, altoBarra, COLOR.arena);
        if (valor > 0) {
          rectangulo(xCelda + 1.5, yBarra, Math.max(0.6, (anchoPista * valor) / maximo), altoBarra, COLOR.azul);
        }
      },
    });

    y = (doc.lastAutoTable?.finalY ?? y) + 11;
  }

  function bloque({ titulo, detalle, ...opcionesTabla }) {
    asegurarEspacio(Math.min(opcionesTabla.filas.length, 4) * 7.5 + 30);
    tituloBloque(titulo, detalle);
    tabla(opcionesTabla);
  }

  /** Dos bloques lado a lado; sigue abajo del que termine más lejos. */
  function dosColumnas(bloques) {
    const anchoColumna = (ANCHO_UTIL - 10) / 2;
    const filasMax = Math.max(...bloques.map((b) => b.filas.length));
    asegurarEspacio(Math.min(filasMax, 6) * 7.5 + 34);

    const inicio = { pagina: paginaActual(), y };
    let fin = { ...inicio };

    bloques.forEach(({ titulo, detalle, ...opcionesTabla }, i) => {
      doc.setPage(inicio.pagina);
      y = inicio.y;
      const x = M + i * (anchoColumna + 10);
      tituloBloque(titulo, detalle, x, anchoColumna);
      tabla({ ...opcionesTabla, x, ancho: anchoColumna });
      const pagina = paginaActual();
      if (pagina > fin.pagina || (pagina === fin.pagina && y > fin.y)) fin = { pagina, y };
    });

    doc.setPage(fin.pagina);
    y = fin.y;
  }

  /** Barras agrupadas por mes: creados y cerrados, con el valor arriba de cada barra. */
  function graficoMensual(meses) {
    const SERIES = [
      { clave: 'ticketsCreados', nombre: 'Creados', color: COLOR.azul },
      { clave: 'ticketsCerrados', nombre: 'Cerrados', color: COLOR.azulClaro },
    ];
    const altoGrafico = 42;
    asegurarEspacio(altoGrafico + 40);

    tituloBloque(
      'Tickets creados y cerrados por mes',
      'Los creados se cuentan por su fecha de alta y los cerrados por su fecha de cierre.'
    );

    if (!meses.length) {
      tabla({ columnas: [], filas: [] });
      return;
    }

    let xLeyenda = M + ANCHO_UTIL;
    [...SERIES].reverse().forEach((serie) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      const anchoTexto = doc.getTextWidth(serie.nombre);
      escribir(serie.nombre, xLeyenda, y, { tam: 7, color: COLOR.texto, align: 'right' });
      rectangulo(xLeyenda - anchoTexto - 4, y - 2.4, 2.6, 2.6, serie.color);
      xLeyenda -= anchoTexto + 10;
    });

    const xEje = M + 8;
    const anchoGrafico = ANCHO_UTIL - 8;
    const yTope = y + 6;
    const yBase = yTope + altoGrafico;

    const maximo = Math.max(1, ...meses.flatMap((m) => SERIES.map((s) => Number(m[s.clave]) || 0)));
    const paso = pasoRedondo(maximo / 4);
    const tope = Math.ceil(maximo / paso) * paso;

    for (let valor = 0; valor <= tope; valor += paso) {
      const yLinea = yBase - (valor / tope) * altoGrafico;
      linea(xEje, yLinea, xEje + anchoGrafico, yLinea, valor === 0 ? COLOR.azulMedio : COLOR.linea, valor === 0 ? 0.3 : 0.1);
      escribir(numero(valor), xEje - 2, yLinea + 1, { tam: 6.5, color: COLOR.gris, align: 'right' });
    }

    const anchoGrupo = anchoGrafico / meses.length;
    const anchoBarra = Math.min(9, anchoGrupo * 0.3);
    const tamRotulo = meses.length > 8 ? 6 : 7;

    meses.forEach((mes, i) => {
      const centro = xEje + anchoGrupo * (i + 0.5);
      SERIES.forEach((serie, j) => {
        const valor = Number(mes[serie.clave]) || 0;
        const alto = (valor / tope) * altoGrafico;
        const xBarra = centro + (j === 0 ? -anchoBarra - 0.4 : 0.4);
        if (alto > 0) rectangulo(xBarra, yBase - alto, anchoBarra, alto, serie.color);
        if (meses.length <= 12) {
          escribir(numero(valor), xBarra + anchoBarra / 2, yBase - alto - 1.3, { tam: 6.5, align: 'center' });
        }
      });
      escribir(rotuloMes(mes), centro, yBase + 4.5, { tam: tamRotulo, align: 'center' });
      if (mes.esParcial) {
        escribir('(parcial)', centro, yBase + 8, { tam: 6, color: COLOR.gris, align: 'center' });
      }
    });

    y = yBase + 19;
  }

  // Portada: banda, datos del informe, indicadores clave e índice.
  rectangulo(0, 0, PAGINA.ancho, 60, COLOR.azul);
  escribir('SIGMA', M, 20, { tam: 9, estilo: 'bold', color: COLOR.azulClaro, charSpace: 1.2 });
  escribir('INFORME DEL PANEL', M, 34, { fuente: 'times', tam: 24, color: COLOR.blanco, charSpace: 0.4 });
  escribir('DE CONTROL', M, 44, { fuente: 'times', tam: 24, color: COLOR.blanco, charSpace: 0.4 });
  escribir('Sistema Integral de Gestión de Mantenimiento de Activos · UTN Facultad Regional Resistencia', M, 52, {
    tam: 8,
    color: COLOR.azulClaro,
  });

  rectangulo(0, 60, PAGINA.ancho, 20, COLOR.arena);
  const cabecera = [
    ['Período', periodo],
    ['Generado', generado],
    ['Alcance', metadatos.alcance ?? 'Todo el sistema'],
  ];
  cabecera.forEach(([rotulo, valor], i) => {
    const x = M + (i * ANCHO_UTIL) / 3;
    escribir(rotulo.toUpperCase(), x, 67.5, { tam: 6.5, estilo: 'bold', color: COLOR.gris, charSpace: 0.4 });
    escribir(valor, x, 73.5, { tam: 9 });
  });

  tituloPortada('Indicadores clave', 94);
  const kpis = indicadoresClave(datos);
  const anchoKpi = ANCHO_UTIL / kpis.length;
  const yKpi = 102;
  const altoKpi = 50;
  rectangulo(M, yKpi, ANCHO_UTIL, altoKpi, COLOR.arena);
  kpis.forEach((kpi, i) => {
    const x = M + i * anchoKpi + 4;
    const anchoTexto = anchoKpi - 8;
    if (i > 0) linea(M + i * anchoKpi, yKpi + 5, M + i * anchoKpi, yKpi + altoKpi - 5, COLOR.linea, 0.3);

    const rotulo = envolver(kpi.rotulo.toUpperCase(), anchoTexto, { tam: 6.5, estilo: 'bold' }).slice(0, 2);
    escribir(rotulo, x, yKpi + 8, { tam: 6.5, estilo: 'bold', color: COLOR.gris, lineHeightFactor: 1.3 });
    escribir(kpi.valor, x, yKpi + 23, { tam: 17, estilo: 'bold', color: COLOR.azul });
    const detalle = envolver(kpi.detalle, anchoTexto, { tam: 7 }).slice(0, 3);
    escribir(detalle, x, yKpi + 29.5, { tam: 7, lineHeightFactor: 1.35 });
    escribir(kpi.base.toUpperCase(), x, yKpi + altoKpi - 5, { tam: 6, estilo: 'bold', color: COLOR.azulMedio });
  });

  escribir(
    'Período: lo que pasó entre las fechas del informe.   Estado actual: la situación al momento de generarlo.',
    M,
    yKpi + altoKpi + 6,
    { tam: 7, color: COLOR.gris }
  );

  tituloPortada('Contenido', 176);
  const yIndice = 186;

  // 01 · Tickets e incidencias
  const evolucion = datos.evolucionTickets ?? {};
  abrirSeccion('Tickets e incidencias', BASE.periodo);
  graficoMensual(evolucion.evolucion ?? []);

  const ticketsPorEstado = evolucion.porEstado ?? [];
  const totalTickets =
    evolucion.totalTicketsPeriodo ?? ticketsPorEstado.reduce((suma, e) => suma + (Number(e.cantidad) || 0), 0);
  bloque({
    titulo: 'Tickets según su estado',
    detalle: `Tickets dados de alta en el período (${numero(totalTickets)}), según el estado en que están hoy.`,
    columnas: [
      { titulo: 'Estado', ancho: 52 },
      { titulo: '', barra: true },
      { titulo: 'Cantidad', ancho: 20, alinear: 'right' },
      { titulo: '%', ancho: 20, alinear: 'right' },
    ],
    filas: ticketsPorEstado.map((e) => ({
      valorBarra: e.cantidad,
      celdas: [e.nombre, '', numero(e.cantidad), porcentaje(e.porcentaje)],
    })),
    pie: ['Total', '', numero(totalTickets), ''],
  });

  const rawAreas = datos.areasIncidencia;
  const areas = Array.isArray(rawAreas) ? rawAreas : (rawAreas?.ranking ?? []);
  bloque({
    titulo: 'Áreas con más incidencias',
    detalle: 'Fallas registradas en el período, según el área del activo. Si dos áreas comparten un espacio, la falla cuenta para las dos.',
    columnas: [
      { titulo: 'Área', ancho: 50 },
      { titulo: 'Edificio', ancho: 32 },
      { titulo: '', barra: true },
      { titulo: 'Fallas', ancho: 15, alinear: 'right' },
      { titulo: 'Tickets', ancho: 15, alinear: 'right' },
      { titulo: '%', ancho: 17, alinear: 'right' },
    ],
    filas: areas.map((a) => ({
      valorBarra: a.cantidadFallas ?? a.fallas,
      celdas: [
        a.nombreArea ?? a.nombre ?? 'Sin área',
        a.nombreEdificio || '-',
        '',
        numero(a.cantidadFallas ?? a.fallas),
        numero(a.cantidadTickets ?? a.tickets),
        porcentaje(a.porcentaje),
      ],
    })),
  });

  const tiempos = datos.tiemposResolucion ?? {};
  const promedioGeneral = tiempos.general?.promedioSegundos;
  bloque({
    titulo: 'Tiempo promedio de resolución por área',
    detalle: `Desde el alta hasta el cierre de los tickets cerrados en el período (${numero(tiempos.general?.cantidadTickets)}). Promedio general: ${promedioGeneral != null ? textoTiempo(promedioGeneral) : 'sin datos'}.`,
    columnas: [
      { titulo: 'Área', ancho: 50 },
      { titulo: 'Edificio', ancho: 32 },
      { titulo: '', barra: true },
      { titulo: 'Tickets', ancho: 16, alinear: 'right' },
      { titulo: 'Promedio', ancho: 22, alinear: 'right' },
    ],
    filas: (tiempos.porArea ?? []).map((a) => ({
      valorBarra: a.promedioSegundos,
      celdas: [a.nombre ?? 'Sin área', a.edificio || '-', '', numero(a.cantidadTickets), textoTiempo(a.promedioSegundos)],
    })),
  });

  // 02 · Órdenes de trabajo
  const ordenes = datos.ordenesTrabajo ?? {};
  const origen = ordenes.porOrigen ?? {};
  const totalOt = origen.total ?? (Number(origen.correctivas) || 0) + (Number(origen.preventivas) || 0);
  const prioridades = ordenes.porPrioridad ?? [];
  const totalPrioridad =
    ordenes.totalNoCanceladas ?? prioridades.reduce((suma, p) => suma + (Number(p.cantidad) || 0), 0);
  const filasPrioridad = prioridades.map((p) => ({
    valorBarra: p.cantidad,
    celdas: [p.nombre, '', numero(p.cantidad), porcentaje(p.porcentaje)],
  }));

  const columnasAngostas = (rotulo) => [
    { titulo: rotulo, ancho: 27 },
    { titulo: '', barra: true },
    { titulo: 'Cant.', ancho: 13, alinear: 'right' },
    { titulo: '%', ancho: 16, alinear: 'right' },
  ];

  abrirSeccion('Órdenes de trabajo', BASE.periodo);
  dosColumnas([
    {
      titulo: 'Por origen',
      detalle: `OT dadas de alta en el período (${numero(totalOt)}).`,
      columnas: columnasAngostas('Origen'),
      filas:
        totalOt > 0
          ? [
              { valorBarra: origen.correctivas, celdas: ['Correctivas', '', numero(origen.correctivas), porcentaje(origen.porcentajeCorrectivas)] },
              { valorBarra: origen.preventivas, celdas: ['Preventivas', '', numero(origen.preventivas), porcentaje(origen.porcentajePreventivas)] },
            ]
          : [],
      pie: ['Total', '', numero(totalOt), ''],
    },
    {
      titulo: 'Por prioridad',
      detalle: `OT no canceladas del período (${numero(totalPrioridad)}).`,
      columnas: columnasAngostas('Prioridad'),
      filas: totalPrioridad > 0 ? filasPrioridad : [],
      pie: ['Total', '', numero(totalPrioridad), ''],
    },
  ]);

  // 03 · Activos
  const activos = datos.activos ?? {};
  abrirSeccion('Activos', BASE.actual);
  bloque({
    titulo: 'Activos según su estado',
    detalle: `Todos los activos registrados (${numero(activos.totalActivos)}), incluidos los retirados.`,
    columnas: [
      { titulo: 'Estado', ancho: 52 },
      { titulo: '', barra: true },
      { titulo: 'Cantidad', ancho: 20, alinear: 'right' },
      { titulo: '%', ancho: 20, alinear: 'right' },
    ],
    filas: (activos.porEstado ?? []).map((e) => ({
      valorBarra: e.cantidad,
      celdas: [e.nombre, '', numero(e.cantidad), porcentaje(e.porcentaje)],
    })),
    pie: ['Total', '', numero(activos.totalActivos), ''],
    vacio: 'Sin activos registrados.',
  });

  bloque({
    titulo: 'Activos en servicio por edificio',
    detalle: `Activos operativos, en mantenimiento o fuera de servicio (${numero(activos.totalEnServicio)}). No incluye los retirados.`,
    columnas: [
      { titulo: 'Edificio', ancho: 52 },
      { titulo: '', barra: true },
      { titulo: 'Cantidad', ancho: 20, alinear: 'right' },
      { titulo: '%', ancho: 20, alinear: 'right' },
    ],
    filas: (activos.porEdificio ?? []).map((e) => ({
      valorBarra: e.cantidad,
      celdas: [e.nombre, '', numero(e.cantidad), porcentaje(e.porcentaje)],
    })),
    pie: ['Total', '', numero(activos.totalEnServicio), ''],
    vacio: 'Sin activos en servicio.',
  });

  // 04 · Personal técnico
  const carga = datos.cargaTecnicos ?? {};
  const sinAsignar = Number(carga.sinAsignar) || 0;
  abrirSeccion('Personal técnico', BASE.actual);
  bloque({
    titulo: 'Tareas pendientes por técnico',
    detalle: `Tareas sin terminar con un técnico asignado (${numero(carga.totalTareasActivas)}). Tareas abiertas que todavía no tienen técnico: ${numero(sinAsignar)}.`,
    columnas: [
      { titulo: 'Técnico', ancho: 52 },
      { titulo: '', barra: true },
      { titulo: 'Tareas', ancho: 16, alinear: 'right' },
      { titulo: '% del total', ancho: 20, alinear: 'right' },
      { titulo: 'Disponibilidad', ancho: 26 },
    ],
    filas: (carga.porTecnico ?? []).map((t) => ({
      valorBarra: t.tareasActivas,
      celdas: [t.nombre, '', numero(t.tareasActivas), porcentaje(t.porcentaje), t.disponible ? 'Disponible' : 'No disponible'],
    })),
    vacio: 'Sin técnicos registrados.',
  });

  // 05 · Inventario
  const materiales = datos.resumenGeneral?.materialesBajoMinimo ?? {};
  abrirSeccion('Inventario', BASE.actual);
  bloque({
    titulo: 'Materiales por debajo del stock mínimo',
    detalle: `${numero(materiales.bajoMinimo)} de ${numero(materiales.totalMateriales)} materiales registrados (${porcentaje(materiales.porcentaje)}), ordenados por faltante.`,
    columnas: [
      { titulo: 'Código', ancho: 26 },
      { titulo: 'Material' },
      { titulo: 'Stock actual', ancho: 24, alinear: 'right' },
      { titulo: 'Stock mínimo', ancho: 24, alinear: 'right' },
      { titulo: 'Faltante', ancho: 22, alinear: 'right' },
    ],
    filas: (materiales.items ?? []).map((m) => ({
      celdas: [m.codigo, m.nombre, numero(m.stockActual), numero(m.stockMinimo), numero(m.faltante)],
    })),
    vacio: 'Ningún material está por debajo de su stock mínimo.',
  });

  // El índice se completa al final, cuando ya se sabe en qué página quedó cada sección.
  doc.setPage(1);
  indice.forEach((entrada, i) => {
    const yEntrada = yIndice + i * 10;
    escribir(entrada.numero, M, yEntrada, { fuente: 'times', tam: 13, color: COLOR.azulClaro });
    escribir(entrada.titulo, M + 13, yEntrada, { tam: 10 });
    escribir(entrada.base.toUpperCase(), M + 120, yEntrada, { tam: 6.5, estilo: 'bold', color: COLOR.azulMedio });
    escribir(String(entrada.pagina), M + ANCHO_UTIL, yEntrada, { tam: 10, align: 'right' });
    linea(M, yEntrada + 3.8, M + ANCHO_UTIL, yEntrada + 3.8, COLOR.linea, 0.15);
  });

  const totalPaginas = doc.internal.getNumberOfPages();
  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    if (pagina > 1) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      const anchoMarca = doc.getTextWidth('SIGMA');
      escribir('SIGMA', M, 13, { tam: 7, estilo: 'bold', color: COLOR.azul });
      escribir('Informe del Panel de Control', M + anchoMarca + 3, 13, { tam: 7, color: COLOR.gris });
      escribir(periodo, M + ANCHO_UTIL, 13, { tam: 7, color: COLOR.gris, align: 'right' });
      linea(M, 16, M + ANCHO_UTIL, 16);
    }
    linea(M, 283, M + ANCHO_UTIL, 283);
    escribir(`Generado el ${generado}`, M, 288, { tam: 6.5, color: COLOR.gris });
    escribir(`${pagina} / ${totalPaginas}`, M + ANCHO_UTIL, 288, { tam: 6.5, color: COLOR.gris, align: 'right' });
  }

  return doc;
}

/** El PDF como Uint8Array, sin depender del navegador (lo usan las pruebas). */
export async function generarBytesPdf(payloadPanel) {
  const doc = generarDocumentoPdf(payloadPanel);
  return new Uint8Array(doc.output('arraybuffer'));
}

/** Descarga el informe como informe-panel-AAAA-MM-DD.pdf. */
export async function exportarPanelPdf(payloadPanel) {
  const doc = generarDocumentoPdf(payloadPanel);
  const nombreArchivo = `informe-panel-${fechaHoyArchivoUtc3()}.pdf`;
  doc.save(nombreArchivo);
  return nombreArchivo;
}
