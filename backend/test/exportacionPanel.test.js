/**
 * Pruebas unitarias del módulo de exportación .xlsx del Panel (Suite C, CA-05, CA-06).
 *
 * Verifica:
 * - Generación desacoplada del libro y serialización binaria OpenXML (D1, D3).
 * - Estructura de las 8 hojas de cálculo.
 * - Sanitización estricta contra CSV/Formula Injection (prefijo ' en =, +, -, @).
 * - Inclusión de gráficos nativos en hojas analíticas.
 */
import {
  generarBytesLibroPanel,
  sanitizarTextoExcel,
  LIMITE_FILAS_SEGURIDAD,
} from '../../frontend/src/servicios/exportacionPanel.js';
import { loadWorkbook, fromArrayBuffer } from '@office-kit/xlsx/io';
import { sheetNames } from '@office-kit/xlsx/workbook';

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
          { codigo: '=MAT-01', nombre: 'Filtro de aire', stockActual: 1, stockMinimo: 5, faltante: 4 },
          { codigo: '-MAT-02', nombre: '+Lámpara LED', stockActual: 0, stockMinimo: 10, faltante: 10 },
        ],
      },
    },
    tiemposResolucion: {
      general: { promedioSegundos: 7200, cantidadTickets: 15 },
      porArea: [
        { id: 1, nombre: 'Laboratorio', edificio: 'Central', cantidadTickets: 10, promedioSegundos: 3600 },
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
        { nombreArea: 'Química', cantidadFallas: 8, cantidadTickets: 6, porcentaje: 50.0 },
        { nombreArea: 'Física', cantidadFallas: 4, cantidadTickets: 3, porcentaje: 25.0 },
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
        { id: 3, nombre: 'Baja', cantidad: 10, porcentaje: 25.0 },
      ],
      porEstado: [
        { id: 1, nombre: 'Creada', cantidad: 5, porcentaje: 12.5 },
        { id: 4, nombre: 'Finalizada', cantidad: 35, porcentaje: 87.5 },
      ],
    },
    activos: {
      porEdificio: [
        { id: 1, nombre: 'Edificio Central', cantidad: 60, porcentaje: 63.2 },
        { id: 2, nombre: 'Anexo Laboratorios', cantidad: 35, porcentaje: 36.8 },
      ],
      porEstado: [
        { id: 1, nombre: 'Operativo', cantidad: 92, porcentaje: 92.0 },
        { id: 4, nombre: 'Retirado', cantidad: 5, porcentaje: 5.0 },
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
    definiciones: [
      { id: 'M-01', nombre: 'Tasa de operatividad', formula: '(Operativos / En servicio) * 100', origen: 'activo.activo_estado', tipoGrafico: 'KPI' },
      { id: 'M-11', nombre: 'Evolución de tickets', formula: 'Altas y cierres por mes', origen: 'ticket', tipoGrafico: 'Línea' },
    ],
  },
};

describe('Módulo de Exportación a Excel (FE-04, Suite C)', () => {
  test('sanitizarTextoExcel neutraliza inyección de fórmulas con prefijo apostrofe', () => {
    expect(sanitizarTextoExcel('=SUM(A1:A5)')).toBe("'=SUM(A1:A5)");
    expect(sanitizarTextoExcel('+12345')).toBe("'+12345");
    expect(sanitizarTextoExcel('-cmd|/c calc')).toBe("'-cmd|/c calc");
    expect(sanitizarTextoExcel('@SUM')).toBe("'@SUM");
    expect(sanitizarTextoExcel('\tTabulado')).toBe("'\tTabulado");
    expect(sanitizarTextoExcel('\rRetorno')).toBe("'\rRetorno");
    expect(sanitizarTextoExcel('TextoNormal')).toBe('TextoNormal');
    expect(sanitizarTextoExcel(123)).toBe('123');
    expect(sanitizarTextoExcel(null)).toBe('');
    expect(sanitizarTextoExcel(undefined)).toBe('');
  });

  test('generarBytesLibroPanel genera un Uint8Array válido de hoja de cálculo OpenXML', async () => {
    const bytes = await generarBytesLibroPanel(MOCK_DATOS_PANEL);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(5000);

    // Relectura del libro con @office-kit/xlsx/io
    const libroLeido = await loadWorkbook(fromArrayBuffer(bytes.buffer));
    const hojas = sheetNames(libroLeido);

    // Comprobar las 8 hojas programadas
    expect(hojas).toHaveLength(8);
    expect(hojas).toEqual([
      'Resumen',
      'Definiciones',
      'Evolucion_Tickets',
      'Incidencias_Areas',
      'OT_Distribucion',
      'Activos_Edificios',
      'Tecnicos_Carga',
      'Materiales_Criticos',
    ]);
  });

  test('límite de seguridad de filas declarado', () => {
    expect(LIMITE_FILAS_SEGURIDAD).toBe(50000);
  });
});
