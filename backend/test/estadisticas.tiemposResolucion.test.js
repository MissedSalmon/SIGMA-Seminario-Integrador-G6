/**
 * Pruebas de los tiempos promedio de resolución (Sprint 7).
 *
 * La cuenta (AVG + GROUP BY) la hace la base en estadistica_tiempos_resolucion.
 * Esa parte se prueba con supabase/tests/tiempos_resolucion.sql, contra una base
 * local. Acá se prueba lo que hace la API: validar el período, pasarle los
 * extremos correctos a la función, ordenar y nombrar las filas, el período sin
 * datos y que sólo entre el administrador.
 */
import { jest } from '@jest/globals';
import express from 'express';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerTiemposResolucion } = await import('../src/servicios/estadisticas.servicio.js');
const { default: rutasEstadisticas } = await import('../src/rutas/estadisticas.rutas.js');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const HORA = 3600;
const DIA = 24 * HORA;

/** Lo que contesta la función de la base cuando no hay tickets cerrados. */
const SIN_TICKETS = {
  general: { promedio_segundos: null, cantidad_tickets: 0 },
  por_area: [],
  por_tipo_activo: [],
  por_tecnico: [],
};

/** Lo que contesta la función de la base con tres tickets cerrados. */
const CON_TICKETS = {
  general: { promedio_segundos: 2 * DIA, cantidad_tickets: 3 },
  por_area: [
    { id: null, nombre: 'Sin área', edificio: null, promedio_segundos: 5 * DIA, cantidad_tickets: 1 },
    { id: 1, nombre: 'Laboratorio', edificio: 'Central', promedio_segundos: 1 * DIA, cantidad_tickets: 1 },
    { id: 2, nombre: 'Biblioteca', edificio: 'Anexo', promedio_segundos: 3 * DIA, cantidad_tickets: 2 },
  ],
  por_tipo_activo: [
    { id: 7, nombre: 'Aire acondicionado', promedio_segundos: 2 * DIA, cantidad_tickets: 2 },
    { id: 8, nombre: 'Proyector', promedio_segundos: 2 * DIA, cantidad_tickets: 1 },
  ],
  por_tecnico: [
    { id: null, nombre: 'Sin asignar', promedio_segundos: 10 * DIA, cantidad_tickets: 1 },
    { id: 'T-1', nombre: 'Ana Pérez', promedio_segundos: 4 * HORA, cantidad_tickets: 2 },
  ],
};

function laBaseContesta(datos) {
  supabase.rpc.mockResolvedValue({ data: datos, error: null });
}

beforeEach(() => {
  supabase.rpc.mockReset();
  laBaseContesta(SIN_TICKETS);
});

describe('el período se valida y se aplica sobre la fecha de cierre', () => {
  test('sin período, la función recibe los dos extremos vacíos', async () => {
    await obtenerTiemposResolucion();
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_tiempos_resolucion', {
      p_desde: null,
      p_hasta: null,
    });
  });

  test('con fechas solas, se toma el día entero de Argentina: los dos bordes quedan incluidos', async () => {
    await obtenerTiemposResolucion({ desde: '2026-11-01', hasta: '2026-11-30' });
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_tiempos_resolucion', {
      p_desde: '2026-11-01T03:00:00.000Z', // 01/11 00:00 en Argentina
      p_hasta: '2026-12-01T02:59:59.999Z', // 30/11 23:59:59.999 en Argentina
    });
  });

  test('desde y hasta el mismo día es válido y abarca ese día completo', async () => {
    await obtenerTiemposResolucion({ desde: '2026-11-09', hasta: '2026-11-09' });
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_tiempos_resolucion', {
      p_desde: '2026-11-09T03:00:00.000Z',
      p_hasta: '2026-11-10T02:59:59.999Z',
    });
  });

  test('un instante con zona horaria se pasa tal cual (así manda la pantalla)', async () => {
    await obtenerTiemposResolucion({ desde: '2026-11-01T03:00:00.000Z', hasta: '2026-11-15T10:30:00-03:00' });
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_tiempos_resolucion', {
      p_desde: '2026-11-01T03:00:00.000Z',
      p_hasta: '2026-11-15T13:30:00.000Z',
    });
  });

  test('se puede pasar un solo extremo', async () => {
    await obtenerTiemposResolucion({ hasta: '2026-11-30' });
    expect(supabase.rpc).toHaveBeenCalledWith('estadistica_tiempos_resolucion', {
      p_desde: null,
      p_hasta: '2026-12-01T02:59:59.999Z',
    });
  });

  test.each([
    ['un texto cualquiera', 'ayer'],
    ['el formato de la pantalla', '09/11/2026'],
    ['un día que no existe', '2026-02-31'],
    ['un mes que no existe', '2026-13-01'],
    ['una hora sin zona horaria', '2026-11-09T10:00:00'],
  ])('rechaza %s', async (_caso, valor) => {
    await expect(obtenerTiemposResolucion({ desde: valor })).rejects.toMatchObject({ estado: 400 });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('rechaza un período dado vuelta', async () => {
    await expect(
      obtenerTiemposResolucion({ desde: '2026-11-10', hasta: '2026-11-09' })
    ).rejects.toMatchObject({ estado: 400, message: expect.stringContaining('posterior') });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('la respuesta', () => {
  test('sin tickets cerrados en el período, el promedio es null (no 0) y no hay filas', async () => {
    const resultado = await obtenerTiemposResolucion({ desde: '2026-11-01', hasta: '2026-11-30' });
    expect(resultado.general).toEqual({ promedioSegundos: null, cantidadTickets: 0 });
    expect(resultado.porArea).toEqual([]);
    expect(resultado.porTipoActivo).toEqual([]);
    expect(resultado.porTecnico).toEqual([]);
  });

  test('si la base no devuelve nada, también es un período vacío', async () => {
    laBaseContesta(null);
    const resultado = await obtenerTiemposResolucion();
    expect(resultado.general).toEqual({ promedioSegundos: null, cantidadTickets: 0 });
    expect(resultado.porTecnico).toEqual([]);
  });

  test('devuelve el promedio general y la cantidad de tickets considerados', async () => {
    laBaseContesta(CON_TICKETS);
    const resultado = await obtenerTiemposResolucion({ desde: '2026-11-01' });
    expect(resultado.general).toEqual({ promedioSegundos: 2 * DIA, cantidadTickets: 3 });
    expect(resultado.desde).toBe('2026-11-01T03:00:00.000Z');
    expect(resultado.hasta).toBeNull();
  });

  test('por área: de mayor a menor tiempo, con el edificio, y "Sin área" al final', async () => {
    laBaseContesta(CON_TICKETS);
    const { porArea } = await obtenerTiemposResolucion();
    expect(porArea).toEqual([
      { id: 2, nombre: 'Biblioteca', edificio: 'Anexo', promedioSegundos: 3 * DIA, cantidadTickets: 2 },
      { id: 1, nombre: 'Laboratorio', edificio: 'Central', promedioSegundos: 1 * DIA, cantidadTickets: 1 },
      { id: null, nombre: 'Sin área', edificio: '', promedioSegundos: 5 * DIA, cantidadTickets: 1 },
    ]);
  });

  test('por tipo de activo: con el mismo promedio, primero el que tiene más tickets', async () => {
    laBaseContesta(CON_TICKETS);
    const { porTipoActivo } = await obtenerTiemposResolucion();
    expect(porTipoActivo.map((fila) => fila.nombre)).toEqual(['Aire acondicionado', 'Proyector']);
    expect(porTipoActivo[0]).not.toHaveProperty('edificio');
  });

  test('por técnico: los tickets sin técnico se agrupan en "Sin asignar", al final', async () => {
    laBaseContesta(CON_TICKETS);
    const { porTecnico } = await obtenerTiemposResolucion();
    expect(porTecnico).toEqual([
      { id: 'T-1', nombre: 'Ana Pérez', promedioSegundos: 4 * HORA, cantidadTickets: 2 },
      { id: null, nombre: 'Sin asignar', promedioSegundos: 10 * DIA, cantidadTickets: 1 },
    ]);
  });

  test('la fila sin técnico se llama "Sin asignar" aunque la base mande otro texto', async () => {
    laBaseContesta({
      ...SIN_TICKETS,
      general: { promedio_segundos: HORA, cantidad_tickets: 1 },
      por_tecnico: [{ id: null, nombre: null, promedio_segundos: HORA, cantidad_tickets: 1 }],
    });
    const { porTecnico } = await obtenerTiemposResolucion();
    expect(porTecnico).toEqual([{ id: null, nombre: 'Sin asignar', promedioSegundos: HORA, cantidadTickets: 1 }]);
  });

  test('si falta aplicar la migración, lo dice', async () => {
    supabase.rpc.mockResolvedValue({ data: null, error: { code: 'PGRST202', message: 'Could not find' } });
    await expect(obtenerTiemposResolucion()).rejects.toThrow(/Falta aplicar la migración/);
  });
});

describe('GET /api/estadisticas/tiempos-resolucion: sólo el administrador', () => {
  let servidor;
  let base;

  beforeAll(async () => {
    const app = express();
    app.use(cookieParser());
    app.use('/api/estadisticas', rutasEstadisticas);
    // El mismo formato que el manejador central de errores.
    app.use((err, req, res, _next) => {
      res.status(err.estado ?? 500).json({ ok: false, mensaje: err.message });
    });
    await new Promise((resolver) => {
      servidor = app.listen(0, resolver);
    });
    base = `http://127.0.0.1:${servidor.address().port}/api/estadisticas/tiempos-resolucion`;
  });

  afterAll(() => new Promise((resolver) => servidor.close(resolver)));

  function pedir(rol, consulta = '') {
    const headers = rol
      ? { Authorization: `Bearer ${jwt.sign({ usuarioId: 'u-1', rol, requirePasswordChange: false }, JWT_SECRET)}` }
      : {};
    return fetch(`${base}${consulta}`, { headers });
  }

  test('el administrador recibe los tiempos', async () => {
    laBaseContesta(CON_TICKETS);
    const respuesta = await pedir('administrador', '?desde=2026-11-01&hasta=2026-11-30');
    expect(respuesta.status).toBe(200);
    const cuerpo = await respuesta.json();
    expect(cuerpo.ok).toBe(true);
    expect(cuerpo.datos.general).toEqual({ promedioSegundos: 2 * DIA, cantidadTickets: 3 });
  });

  test.each(['tecnico', 'autorizado'])('un %s recibe 403 y no se consulta la base', async (rol) => {
    const respuesta = await pedir(rol);
    expect(respuesta.status).toBe(403);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('sin sesión recibe 401', async () => {
    const respuesta = await pedir(null);
    expect(respuesta.status).toBe(401);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('una fecha mal escrita devuelve 400', async () => {
    const respuesta = await pedir('administrador', '?desde=2026-11-31');
    expect(respuesta.status).toBe(400);
    expect((await respuesta.json()).mensaje).toMatch(/no es válida/);
  });

  test('un período dado vuelta devuelve 400', async () => {
    const respuesta = await pedir('administrador', '?desde=2026-11-30&hasta=2026-11-01');
    expect(respuesta.status).toBe(400);
  });
});
