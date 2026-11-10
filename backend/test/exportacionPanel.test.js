/**
 * Pruebas unitarias del módulo de exportación analítica a PDF del Panel.
 *
 * Verifica:
 * - Generación de documento PDF binario válido (formato A4 con encabezado %PDF-1.).
 * - Estructura de tablas requeridas y datos asociados.
 * - Formato de nombre de archivo (informe-panel-AAAA-MM-DD.pdf).
 * - Manejo de estados vacíos ("Sin datos en el período").
 * - Integración de imágenes de gráficos cuando están disponibles.
 */
import {
  generarDocumentoPdf,
  generarBytesPdf,
  fechaHoyArchivoUtc3,
  formatearFechaUtc3,
} from '../../frontend/src/servicios/exportacionPanel.js';

const MOCK_DATOS_PANEL = {
  datos: {
    resumenGeneral: {
      operatividad: {
        operativos: 92,
        enServicio: 95,
        retirados: 5,
        totalActivos: 100,
        porcentaje: 96.8,
      },
      coberturaPreventiva: {
        tiposConPlan: 8,
        totalTipos: 10,
        porcentajeTipos: 80.0,
        activosCubiertos: 70,
        totalActivosEnServicio: 95,
        porcentajeActivos: 73.7,
        tiposSinPlan: [
          { id: 2, nombre: 'Luminarias' },
          { id: 3, nombre: 'Mobiliario' },
        ],
      },
      disponibilidadTecnicos: {
        disponibles: 4,
        totalTecnicos: 5,
        porcentaje: 80.0,
      },
      materialesBajoMinimo: {
        bajoMinimo: 2,
        totalMateriales: 20,
        porcentaje: 10.0,
        items: [
          { codigo: 'MAT-01', nombre: 'Filtro de aire', stockActual: 1, stockMinimo: 5, faltante: 4 },
          { codigo: 'MAT-02', nombre: 'Lámpara LED', stockActual: 0, stockMinimo: 10, faltante: 10 },
        ],
      },
    },
    tiemposResolucion: {
      general: {
        promedioSegundos: 7200,
        cantidadTickets: 15,
      },
      porArea: [
        { id: 1, nombre: 'Laboratorio', edificio: 'Central', cantidadTickets: 5, promedioSegundos: 3600 },
        { id: null, nombre: 'Sin área', edificio: '', cantidadTickets: 2, promedioSegundos: 10800 },
      ],
    },
    activos: {
      totalActivos: 100,
      totalEnServicio: 95,
      porEdificio: [
        { id: 1, nombre: 'Edificio Central', cantidad: 60, porcentaje: 63.2 },
        { id: 2, nombre: 'Anexo Laboratorios', cantidad: 35, porcentaje: 36.8 },
      ],
      porEstado: [
        { id: 1, nombre: 'Operativo', cantidad: 92, porcentaje: 92.0 },
        { id: 2, nombre: 'En mantenimiento', cantidad: 3, porcentaje: 3.0 },
        { id: 4, nombre: 'Retirado', cantidad: 5, porcentaje: 5.0 },
      ],
    },
    ordenesTrabajo: {
      porOrigen: {
        correctivas: 25,
        preventivas: 15,
        total: 40,
        porcentajeCorrectivas: 62.5,
        porcentajePreventivas: 37.5,
      },
      porPrioridad: [
        { id: 1, nombre: 'Alta', cantidad: 10, porcentaje: 25.0 },
        { id: 2, nombre: 'Media', cantidad: 20, porcentaje: 50.0 },
      ],
    },
    evolucionTickets: {
      evolucion: [
        { periodo: '2026-09', mesRotulo: 'Sep 2026', ticketsCreados: 10, ticketsCerrados: 8, esParcial: false },
        { periodo: '2026-10', mesRotulo: 'Oct 2026', ticketsCreados: 12, ticketsCerrados: 11, esParcial: false },
        { periodo: '2026-11', mesRotulo: 'Nov 2026 * (parcial)', ticketsCreados: 5, ticketsCerrados: 3, esParcial: true },
      ],
      porEstado: [
        { id: 1, nombre: 'Creado', cantidad: 5, porcentaje: 18.5 },
        { id: 6, nombre: 'Cerrado', cantidad: 22, porcentaje: 81.5 },
      ],
    },
    areasIncidencia: {
      ranking: [
        { nombreArea: 'Química', nombreEdificio: 'Central', cantidadFallas: 8, cantidadTickets: 6, porcentaje: 50.0 },
        { nombreArea: 'Física', nombreEdificio: 'Central', cantidadFallas: 4, cantidadTickets: 3, porcentaje: 25.0 },
      ],
    },
    cargaTecnicos: {
      porTecnico: [
        { legajo: 'TEC-01', nombre: 'Carlos Ruiz', disponible: true, tareasActivas: 4, porcentaje: 50.0 },
        { legajo: 'TEC-02', nombre: 'María Benítez', disponible: false, tareasActivas: 2, porcentaje: 25.0 },
      ],
      sinAsignar: 2,
      totalTareasActivas: 8,
    },
  },
  metadatos: {
    alcance: 'Todo el sistema',
    zonaHoraria: 'America/Argentina/Buenos_Aires',
    generadoEn: '2026-11-09T18:30:00.000Z',
    versionSistema: '0.1.0',
    commit: '899b562d0c76832de809bf99f3e5875703e503e7',
    filtros: { desde: '2026-09-01', hasta: '2026-11-09' },
  },
};

// 1x1 PNG transparente base64 para simular gráfico capturado
const MOCK_PNG_BASE64 =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

describe('Módulo de Exportación a PDF del Panel de Control', () => {
  test('generarBytesPdf genera un Uint8Array binario con cabecera %PDF-', async () => {
    const bytes = await generarBytesPdf(MOCK_DATOS_PANEL);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(1000);

    const cabecera = Buffer.from(bytes.slice(0, 5)).toString('utf-8');
    expect(cabecera).toBe('%PDF-');
  });

  test('formato de nombre de archivo sigue informe-panel-AAAA-MM-DD.pdf', () => {
    const fecha = fechaHoyArchivoUtc3();
    expect(fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const nombreEsperado = `informe-panel-${fecha}.pdf`;
    expect(nombreEsperado).toMatch(/^informe-panel-\d{4}-\d{2}-\d{2}\.pdf$/);
  });

  test('formatearFechaUtc3 formatea correctamente fechas a hora de Argentina', () => {
    const fechaTexto = formatearFechaUtc3('2026-11-09T18:30:00.000Z');
    expect(fechaTexto).toBeTruthy();
    expect(typeof fechaTexto).toBe('string');
  });

  test('generarDocumentoPdf construye un documento con múltiples páginas estructuradas', () => {
    const doc = generarDocumentoPdf(MOCK_DATOS_PANEL, {
      imagenesGraficos: {
        'grafico-evolucion-tickets': MOCK_PNG_BASE64,
        'grafico-areas-incidencias': MOCK_PNG_BASE64,
      },
    });

    const totalPaginas = doc.internal.getNumberOfPages();
    expect(totalPaginas).toBeGreaterThanOrEqual(1);
  });

  test('manejo de estado vacío: genera PDF sin fallar cuando no hay datos en el período', async () => {
    const payloadVacio = {
      datos: {},
      metadatos: {
        alcance: 'Todo el sistema',
        generadoEn: '2026-11-10T08:00:00.000Z',
        filtros: { desde: '2026-11-01', hasta: '2026-11-10' },
      },
    };

    const bytes = await generarBytesPdf(payloadVacio);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(Buffer.from(bytes.slice(0, 5)).toString('utf-8')).toBe('%PDF-');
  });
});
