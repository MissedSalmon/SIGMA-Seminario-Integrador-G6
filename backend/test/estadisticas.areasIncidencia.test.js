/**
 * Pruebas del ranking de áreas con mayor incidencia (HU-34, issue #29).
 *
 * El ranking se arma en el servicio a partir de las fallas, así que alcanza
 * con que la tabla falla conteste distintas filas y mirar cómo quedan las áreas.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerAreasConMayorIncidencia } = await import('../src/servicios/estadisticas.servicio.js');

const LABORATORIO = { area_id: 1, area_nom: 'Laboratorio' };
const BIBLIOTECA = { area_id: 2, area_nom: 'Biblioteca' };
const BEDELIA = { area_id: 3, area_nom: 'Bedelía' };

let siguienteId = 1;

/** Una fila de la tabla falla como la devuelve Supabase. */
function falla({ tipo, areas = [], ticket = null, plan = null, ot = 10, fecha = '2026-10-01T12:00:00Z' }) {
  return {
    falla_id: siguienteId++,
    ot_id: ot,
    tarea_id: 1,
    falla_tipo: tipo,
    falla_desc: 'Descripción',
    falla_fecha: fecha,
    activo_codigo: 'AC-1',
    activo: {
      activo_codigo: 'AC-1',
      tipo_activo: { tipo_activo_nom: 'Aire acondicionado' },
      espacio: { espacio_id: 5, espacio_num: '101', edificio: { edificio_nom: 'Central' }, area: areas },
    },
    orden_trabajo: {
      ot_id: ot,
      ticket_id: ticket,
      mant_prev_id: plan,
      ticket: ticket ? { ticket_id: ticket, ticket_fecha_alta: fecha, ticket_estado: 6 } : null,
    },
  };
}

/** Hace que from('falla').select(...)... devuelva esas filas y guarda los filtros pedidos. */
let consulta;
function fallasRegistradas(filas) {
  consulta = {
    select: jest.fn(() => consulta),
    not: jest.fn(() => consulta),
    order: jest.fn(() => consulta),
    gte: jest.fn(() => consulta),
    lte: jest.fn(() => consulta),
    eq: jest.fn(() => consulta),
    then: (resolver, rechazar) => Promise.resolve({ data: filas, error: null }).then(resolver, rechazar),
  };
  supabase.from.mockImplementation(() => consulta);
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('obtenerAreasConMayorIncidencia', () => {
  test('ordena las áreas por cantidad de fallas, de mayor a menor', async () => {
    fallasRegistradas([
      falla({ tipo: 'Eléctrica', areas: [BIBLIOTECA], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 2 }),
      falla({ tipo: 'Sanitaria', areas: [LABORATORIO], ticket: 3 }),
    ]);

    const ranking = await obtenerAreasConMayorIncidencia();

    expect(ranking.map((area) => [area.posicion, area.nombreArea, area.cantidadFallas])).toEqual([
      [1, 'Laboratorio', 2],
      [2, 'Biblioteca', 1],
    ]);
    expect(supabase.from).toHaveBeenCalledWith('falla');
    // Las fallas viejas sin activo no se pueden ubicar en un área.
    expect(consulta.not).toHaveBeenCalledWith('activo_codigo', 'is', null);
  });

  test('cuenta tickets distintos y desglosa por tipo de falla', async () => {
    fallasRegistradas([
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 1 }),
      falla({ tipo: 'Sanitaria', areas: [LABORATORIO], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 2 }),
      falla({ tipo: 'Mecánica', areas: [LABORATORIO], plan: 7, ot: 20 }),
    ]);

    const [area] = await obtenerAreasConMayorIncidencia();

    expect(area.cantidadFallas).toBe(4);
    // La falla del preventivo no tiene ticket; el ticket 1 tiene dos fallas.
    expect(area.cantidadTickets).toBe(2);
    expect(area.desglose).toEqual([
      { tipo: 'Eléctrica', cantidad: 2 },
      { tipo: 'Mecánica', cantidad: 1 },
      { tipo: 'Sanitaria', cantidad: 1 },
    ]);
    expect(area.incidencias).toHaveLength(4);
    expect(area.incidencias.find((una) => una.idPlan === 7).ticket).toBeNull();
    expect(area.incidencias[0].ticket).toEqual({ id: 1, fechaAlta: '2026-10-01T12:00:00Z', estado: 'Cerrado' });
  });

  test('un empate en fallas se desempata por tickets y después por nombre', async () => {
    fallasRegistradas([
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [BIBLIOTECA], ticket: 2 }),
      falla({ tipo: 'Eléctrica', areas: [BIBLIOTECA], ticket: 3 }),
      falla({ tipo: 'Eléctrica', areas: [BEDELIA], ticket: 4 }),
      falla({ tipo: 'Eléctrica', areas: [BEDELIA], ticket: 5 }),
    ]);

    const ranking = await obtenerAreasConMayorIncidencia();

    expect(ranking.map((area) => area.nombreArea)).toEqual(['Bedelía', 'Biblioteca', 'Laboratorio']);
  });

  test('las fallas de un espacio sin área van a "Sin área", siempre al final', async () => {
    fallasRegistradas([
      falla({ tipo: 'Eléctrica', areas: [], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [], ticket: 2 }),
      falla({ tipo: 'Eléctrica', areas: [BIBLIOTECA], ticket: 3 }),
    ]);

    const ranking = await obtenerAreasConMayorIncidencia();

    expect(ranking.map((area) => [area.idArea, area.nombreArea])).toEqual([
      [2, 'Biblioteca'],
      [null, 'Sin área'],
    ]);
  });

  test('si dos áreas comparten el espacio, la falla cuenta para las dos', async () => {
    fallasRegistradas([falla({ tipo: 'Eléctrica', areas: [LABORATORIO, BIBLIOTECA], ticket: 1 })]);

    const ranking = await obtenerAreasConMayorIncidencia();

    expect(ranking.map((area) => [area.nombreArea, area.cantidadFallas])).toEqual([
      ['Biblioteca', 1],
      ['Laboratorio', 1],
    ]);
  });

  test('el porcentaje es sobre el total de fallas, con un decimal', async () => {
    fallasRegistradas([
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 1 }),
      falla({ tipo: 'Eléctrica', areas: [LABORATORIO], ticket: 2 }),
      falla({ tipo: 'Eléctrica', areas: [BIBLIOTECA], ticket: 3 }),
    ]);

    const ranking = await obtenerAreasConMayorIncidencia();

    expect(ranking.map((area) => area.porcentaje)).toEqual([66.7, 33.3]);
  });

  test('filtra por período y por tipo de falla', async () => {
    fallasRegistradas([]);

    await obtenerAreasConMayorIncidencia({
      desde: '2026-05-01T00:00:00.000Z',
      hasta: '2026-11-01T00:00:00.000Z',
      tipoFalla: 'Sanitaria',
    });

    expect(consulta.gte).toHaveBeenCalledWith('falla_fecha', '2026-05-01T00:00:00.000Z');
    expect(consulta.lte).toHaveBeenCalledWith('falla_fecha', '2026-11-01T00:00:00.000Z');
    expect(consulta.eq).toHaveBeenCalledWith('falla_tipo', 'Sanitaria');
  });

  test('sin filtros no acota la consulta', async () => {
    fallasRegistradas([]);

    expect(await obtenerAreasConMayorIncidencia()).toEqual([]);
    expect(consulta.gte).not.toHaveBeenCalled();
    expect(consulta.lte).not.toHaveBeenCalled();
    expect(consulta.eq).not.toHaveBeenCalled();
  });

  test('rechaza una fecha inválida o un rango dado vuelta', async () => {
    fallasRegistradas([]);

    await expect(obtenerAreasConMayorIncidencia({ desde: 'ayer' })).rejects.toThrow('no es válida');
    await expect(
      obtenerAreasConMayorIncidencia({ desde: '2026-11-01', hasta: '2026-05-01' })
    ).rejects.toThrow('no puede ser posterior');
  });
});
