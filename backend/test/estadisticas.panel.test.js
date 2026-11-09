/**
 * Pruebas integrales del panel de estadísticas del administrador (Sprint 7).
 *
 * Cubre:
 * - Suites de agregación y conciliación (S6, S12, S15)
 * - Protección por rol administrador en todas las rutas (D4)
 * - Validación de períodos temporales y manejo de nulos (S6, S7)
 * - Metadatos de frescura, alcance y catálogo de métricas (S13, S14, S15)
 */
import { jest } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  obtenerResumenGeneral,
  obtenerDistribucionActivos,
  obtenerOrdenesTrabajo,
  obtenerEvolucionTickets,
  obtenerCargaTecnicos,
  obtenerPanelCompleto,
  DEFINICIONES_METRICAS,
} = await import('../src/servicios/estadisticas.servicio.js');
const { default: rutasEstadisticas } = await import('../src/rutas/estadisticas.rutas.js');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const MOCK_RESUMEN_GENERAL = {
  operatividad: {
    operativos: 90,
    enServicio: 95,
    retirados: 5,
    totalActivos: 100,
    porcentaje: 94.7,
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
      { codigo: 'MAT-01', nombre: 'Filtro de aire', stockActual: 1, stockMinimo: 5, faltante: 4 },
      { codigo: 'MAT-02', nombre: 'Lámpara LED', stockActual: 0, stockMinimo: 10, faltante: 10 },
    ],
  },
};

const MOCK_DISTRIBUCION_ACTIVOS = {
  porEstado: [
    { id: 1, nombre: 'Operativo', cantidad: 90, porcentaje: 90.0 },
    { id: 2, nombre: 'En mantenimiento', cantidad: 3, porcentaje: 3.0 },
    { id: 3, nombre: 'Fuera de servicio', cantidad: 2, porcentaje: 2.0 },
    { id: 4, nombre: 'Retirado', cantidad: 5, porcentaje: 5.0 },
  ],
  porEdificio: [
    { id: 1, nombre: 'Edificio Central', cantidad: 60, porcentaje: 63.2 },
    { id: 2, nombre: 'Anexo Laboratorios', cantidad: 35, porcentaje: 36.8 },
  ],
  totalActivos: 100,
  totalEnServicio: 95,
};

const MOCK_ORDENES_TRABAJO = {
  porOrigen: {
    correctivas: 30,
    preventivas: 20,
    total: 50,
    porcentajeCorrectivas: 60.0,
    porcentajePreventivas: 40.0,
  },
  porEstado: [
    { id: 1, nombre: 'Creada', cantidad: 5, porcentaje: 10.0 },
    { id: 2, nombre: 'Asignada', cantidad: 10, porcentaje: 20.0 },
    { id: 3, nombre: 'En ejecución', cantidad: 15, porcentaje: 30.0 },
    { id: 4, nombre: 'Finalizada', cantidad: 18, porcentaje: 36.0 },
    { id: 5, nombre: 'Cancelada', cantidad: 2, porcentaje: 4.0 },
  ],
  porPrioridad: [
    { id: 1, nombre: 'Alta', cantidad: 12, porcentaje: 25.0 },
    { id: 2, nombre: 'Media', cantidad: 24, porcentaje: 50.0 },
    { id: 3, nombre: 'Baja', cantidad: 12, porcentaje: 25.0 },
  ],
  cumplimientoTareas: [
    { id: 5, nombre: 'Finalizada', cantidad: 45, porcentaje: 75.0 },
    { id: 3, nombre: 'En ejecución', cantidad: 15, porcentaje: 25.0 },
  ],
  totalOt: 50,
  totalTareas: 60,
};

const MOCK_EVOLUCION_TICKETS = {
  evolucion: [
    { periodo: '2026-05', mesRotulo: 'May 2026', ticketsCreados: 15, ticketsCerrados: 12, esParcial: false },
    { periodo: '2026-06', mesRotulo: 'Jun 2026', ticketsCreados: 0, ticketsCerrados: 0, esParcial: false },
    { periodo: '2026-07', mesRotulo: 'Jul 2026', ticketsCreados: 20, ticketsCerrados: 18, esParcial: false },
    { periodo: '2026-11', mesRotulo: 'Nov 2026 * (parcial)', ticketsCreados: 5, ticketsCerrados: 3, esParcial: true },
  ],
  porEstado: [
    { id: 1, nombre: 'Creado', cantidad: 5, porcentaje: 12.5 },
    { id: 6, nombre: 'Cerrado', cantidad: 33, porcentaje: 82.5 },
    { id: 7, nombre: 'Rechazado', cantidad: 2, porcentaje: 5.0 },
  ],
  totalTicketsPeriodo: 40,
};

const MOCK_CARGA_TECNICOS = {
  porTecnico: [
    { legajo: 'TEC-01', nombre: 'Carlos Ruiz', disponible: true, tareasActivas: 5, porcentaje: 50.0 },
    { legajo: 'TEC-02', nombre: 'María Benítez', disponible: false, tareasActivas: 3, porcentaje: 30.0 },
    { legajo: 'TEC-03', nombre: 'Pedro González', disponible: true, tareasActivas: 0, porcentaje: 0.0 },
  ],
  sinAsignar: 2,
  totalTareasActivas: 10,
};

beforeEach(() => {
  supabase.rpc.mockReset();
  supabase.from.mockReset();
});

describe('Servicios analíticos del Panel (BE-03)', () => {
  test('obtenerResumenGeneral devuelve KPIs y lista de materiales críticos', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: MOCK_RESUMEN_GENERAL, error: null });
    const res = await obtenerResumenGeneral();
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_resumen_general');
    expect(res.operatividad.porcentaje).toBe(94.7);
    expect(res.materialesBajoMinimo.items).toHaveLength(2);
  });

  test('obtenerDistribucionActivos devuelve estados y edificios con totales', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: MOCK_DISTRIBUCION_ACTIVOS, error: null });
    const res = await obtenerDistribucionActivos();
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_distribucion_activos');
    expect(res.totalActivos).toBe(100);
    expect(res.porEstado).toHaveLength(4);
    // Conciliación de estados
    const sumaCantidades = res.porEstado.reduce((acc, curr) => acc + curr.cantidad, 0);
    expect(sumaCantidades).toBe(res.totalActivos);
  });

  test('obtenerOrdenesTrabajo valida fechas y concilia totales de origen y estado', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: MOCK_ORDENES_TRABAJO, error: null });
    const res = await obtenerOrdenesTrabajo({ desde: '2026-01-01', hasta: '2026-11-09' });
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_ordenes_trabajo', expect.any(Object));
    expect(res.porOrigen.total).toBe(50);
    expect(res.porOrigen.correctivas + res.porOrigen.preventivas).toBe(res.porOrigen.total);
    const sumaEstados = res.porEstado.reduce((acc, curr) => acc + curr.cantidad, 0);
    expect(sumaEstados).toBe(res.totalOt);
  });

  test('obtenerEvolucionTickets respeta meses con 0 (S6) y marca mes parcial (S5)', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: MOCK_EVOLUCION_TICKETS, error: null });
    const res = await obtenerEvolucionTickets({ desde: '2026-05-01', hasta: '2026-11-09' });
    const mesVacio = res.evolucion.find((e) => e.periodo === '2026-06');
    expect(mesVacio.ticketsCreados).toBe(0);
    expect(mesVacio.ticketsCerrados).toBe(0);
    const mesParcial = res.evolucion.find((e) => e.periodo === '2026-11');
    expect(mesParcial.esParcial).toBe(true);
    expect(mesParcial.mesRotulo).toContain('* (parcial)');
  });

  test('obtenerCargaTecnicos expone técnicos con 0 tareas y tareas sin asignar (S6)', async () => {
    supabase.rpc.mockResolvedValueOnce({ data: MOCK_CARGA_TECNICOS, error: null });
    const res = await obtenerCargaTecnicos();
    const tecSinTareas = res.porTecnico.find((t) => t.legajo === 'TEC-03');
    expect(tecSinTareas.tareasActivas).toBe(0);
    expect(res.sinAsignar).toBe(2);
  });

  test('obtenerPanelCompleto integra todas las secciones y adjunta metadatos S13, S14, S15', async () => {
    supabase.rpc.mockImplementation((nombre) => {
      if (nombre === 'estadistica_resumen_general') return Promise.resolve({ data: MOCK_RESUMEN_GENERAL, error: null });
      if (nombre === 'estadistica_distribucion_activos') return Promise.resolve({ data: MOCK_DISTRIBUCION_ACTIVOS, error: null });
      if (nombre === 'estadistica_ordenes_trabajo') return Promise.resolve({ data: MOCK_ORDENES_TRABAJO, error: null });
      if (nombre === 'estadistica_evolucion_tickets') return Promise.resolve({ data: MOCK_EVOLUCION_TICKETS, error: null });
      if (nombre === 'estadistica_carga_tecnicos') return Promise.resolve({ data: MOCK_CARGA_TECNICOS, error: null });
      if (nombre === 'estadistica_tiempos_resolucion') {
        return Promise.resolve({
          data: { general: { promedio_segundos: 3600, cantidad_tickets: 5 }, por_area: [], por_tipo_activo: [], por_tecnico: [] },
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });

    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (resolve) => resolve({ data: [], error: null }),
    });

    const resultado = await obtenerPanelCompleto({ desde: '2026-01-01', hasta: '2026-11-09' });
    expect(resultado.datos.resumenGeneral).toBeDefined();
    expect(resultado.datos.activos).toBeDefined();
    expect(resultado.datos.ordenesTrabajo).toBeDefined();
    expect(resultado.datos.evolucionTickets).toBeDefined();
    expect(resultado.datos.cargaTecnicos).toBeDefined();
    expect(resultado.datos.tiemposResolucion).toBeDefined();

    // Metadatos
    expect(resultado.metadatos.alcance).toBe('Todo el sistema');
    expect(resultado.metadatos.zonaHoraria).toBe('America/Argentina/Buenos_Aires');
    expect(resultado.metadatos.versionSistema).toBe('0.1.0');
    expect(resultado.metadatos.commit).toBe('899b562d0c76832de809bf99f3e5875703e503e7');
    expect(resultado.metadatos.definiciones).toHaveLength(DEFINICIONES_METRICAS.length);
  });

  test('validación: fechas invertidas (desde > hasta) rechazan con 400', async () => {
    await expect(obtenerOrdenesTrabajo({ desde: '2026-12-01', hasta: '2026-01-01' })).rejects.toThrow(
      /no puede ser posterior/
    );
  });
});

describe('Rutas HTTP del Panel (BE-01, BE-02): Autorización exclusiva administrador (D4)', () => {
  let servidor;
  let baseUrl;

  beforeAll(async () => {
    const app = express();
    app.use(cookieParser());
    app.use('/api/estadisticas', rutasEstadisticas);
    app.use((err, req, res, _next) => {
      res.status(err.estado ?? 500).json({ ok: false, mensaje: err.message });
    });
    await new Promise((resolve) => {
      servidor = app.listen(0, resolve);
    });
    baseUrl = `http://127.0.0.1:${servidor.address().port}/api/estadisticas`;
  });

  afterAll(() => new Promise((resolve) => servidor.close(resolve)));

  function pedir(ruta, rol, query = '') {
    const headers = rol
      ? { Authorization: `Bearer ${jwt.sign({ usuarioId: 'usr-1', rol, requirePasswordChange: false }, JWT_SECRET)}` }
      : {};
    return fetch(`${baseUrl}${ruta}${query}`, { headers });
  }

  const RUTAS_A_PROBAR = [
    '/resumen-general',
    '/activos',
    '/ordenes-trabajo',
    '/tickets-evolucion',
    '/tecnicos-carga',
    '/panel-completo',
  ];

  test.each(RUTAS_A_PROBAR)('administrador tiene acceso 200 a %s', async (ruta) => {
    supabase.rpc.mockResolvedValue({
      data: MOCK_RESUMEN_GENERAL,
      error: null,
    });
    supabase.from.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      not: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      gte: jest.fn().mockReturnThis(),
      lte: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      then: (resolve) => resolve({ data: [], error: null }),
    });

    const res = await pedir(ruta, 'administrador');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.datos).toBeDefined();
  });

  test.each(RUTAS_A_PROBAR)('usuario no administrador (técnico) recibe 403 en %s sin tocar la base', async (ruta) => {
    const res = await pedir(ruta, 'tecnico');
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test.each(RUTAS_A_PROBAR)('usuario no autenticado (sin sesión) recibe 401 en %s sin tocar la base', async (ruta) => {
    const res = await pedir(ruta, null);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});
