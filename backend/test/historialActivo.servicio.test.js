/**
 * Pruebas del historial de intervenciones de un activo (HU-29).
 *
 * La base de mentira responde por tabla. Las dos consultas de orden_trabajo
 * (por ticket y por plan preventivo) se distinguen por lo que piden en el select.
 */
import { jest } from '@jest/globals';

let respuestas = {};
let llamadas = [];

function consulta(tabla) {
  const registro = { tabla, ops: [] };
  llamadas.push(registro);

  const responder = () => {
    if (tabla !== 'orden_trabajo') return respuestas[tabla] ?? { data: [], error: null };
    const columnas = registro.ops.find(([op]) => op === 'select')[1];
    const origen = columnas.includes('ticket!inner') ? 'porTicket' : 'porPlan';
    return respuestas[origen] ?? { data: [], error: null };
  };

  const cadena = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (resolver, rechazar) => Promise.resolve(responder()).then(resolver, rechazar);
        }
        return (...args) => {
          registro.ops.push([prop, ...args]);
          return cadena;
        };
      },
    }
  );

  return cadena;
}

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn((tabla) => consulta(tabla)) },
}));

jest.unstable_mockModule('../src/servicios/activos.servicio.js', () => ({
  obtenerPorId: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/observaciones.servicio.js', () => ({
  observacionesDelActivo: jest.fn(),
}));

const activos = await import('../src/servicios/activos.servicio.js');
const observaciones = await import('../src/servicios/observaciones.servicio.js');
const { obtenerHistorial } = await import('../src/servicios/historialActivo.servicio.js');

/** Una tarea como la devuelve la base: estado y prioridad en numero. */
function tarea(id, { estado = 5, prestador = null, falla = null } = {}) {
  return {
    tarea_id: id,
    tarea_desc: `Tarea ${id}`,
    tarea_estado: estado,
    prestador_serv_id: prestador ? 7 : null,
    prestador_servicio: prestador ? { prestador_serv_nom: prestador } : null,
    falla: falla ? [falla] : [],
  };
}

/** OT 19: correctiva, finalizada el 14/10. */
const OT_CORRECTIVA = {
  ot_id: 19,
  ot_estado: 4,
  ot_fecha_alta: '2026-10-14T19:38:00+00:00',
  ot_fecha_cierre: '2026-10-14T19:50:00+00:00',
  ot_desc: 'No prende',
  ticket: { ticket_id: 24, ticket_desc: 'No prende', activo_codigo: 'LUM-001' },
  tarea_ot: [
    tarea(2, { prestador: 'Electricidad Norte' }),
    tarea(1, { falla: { falla_tipo: 'Eléctrica', falla_desc: 'Portalámpara quemado' } }),
    tarea(3, { estado: 6 }),
  ],
};

/** OT 30: preventiva, abierta el 20/10 y todavia en ejecucion. */
const OT_PREVENTIVA = {
  ot_id: 30,
  ot_estado: 3,
  ot_fecha_alta: '2026-10-20T10:00:00+00:00',
  ot_fecha_cierre: null,
  ot_desc: null,
  mantenimiento_preventivo: { mant_prev_id: 2, mant_prev_nom: 'Revisión semestral', activo_codigo: 'LUM-001' },
  tarea_ot: [tarea(1, { estado: 3 })],
};

/** OT 12: correctiva, finalizada el 01/10. */
const OT_VIEJA = {
  ...OT_CORRECTIVA,
  ot_id: 12,
  ot_fecha_alta: '2026-09-28T09:00:00+00:00',
  ot_fecha_cierre: '2026-10-01T12:00:00+00:00',
  ticket: { ticket_id: 8, ticket_desc: 'Parpadea', activo_codigo: 'LUM-001' },
  tarea_ot: [tarea(1)],
};

function operacionesDe(tabla) {
  return llamadas.filter((llamada) => llamada.tabla === tabla).map((llamada) => llamada.ops);
}

beforeEach(() => {
  respuestas = {};
  llamadas = [];
  jest.clearAllMocks();
  activos.obtenerPorId.mockResolvedValue({ codigo: 'LUM-001' });
  observaciones.observacionesDelActivo.mockResolvedValue([]);
});

describe('obtenerHistorial', () => {
  test('ordena las intervenciones de la más reciente a la más antigua', async () => {
    respuestas.porTicket = { data: [OT_VIEJA, OT_CORRECTIVA], error: null };
    respuestas.porPlan = { data: [OT_PREVENTIVA], error: null };

    const { intervenciones } = await obtenerHistorial('LUM-001');

    expect(intervenciones.map((intervencion) => intervencion.idOt)).toEqual([30, 19, 12]);
  });

  test('la finalizada se fecha por su cierre y la que sigue en curso por su alta', async () => {
    respuestas.porTicket = { data: [OT_CORRECTIVA], error: null };
    respuestas.porPlan = { data: [OT_PREVENTIVA], error: null };

    const { intervenciones } = await obtenerHistorial('LUM-001');
    const [preventiva, correctiva] = intervenciones;

    expect(preventiva.fecha).toBe('2026-10-20T10:00:00+00:00');
    expect(correctiva.fecha).toBe('2026-10-14T19:50:00+00:00');
  });

  test('es correctiva si viene de un ticket y preventiva si viene de un plan', async () => {
    respuestas.porTicket = { data: [OT_CORRECTIVA], error: null };
    respuestas.porPlan = { data: [OT_PREVENTIVA], error: null };

    const { intervenciones } = await obtenerHistorial('LUM-001');
    const [preventiva, correctiva] = intervenciones;

    expect(correctiva).toMatchObject({ tipo: 'Correctiva', idTicket: 24, problemaReportado: 'No prende' });
    expect(preventiva).toMatchObject({ tipo: 'Preventiva', planPreventivo: 'Revisión semestral', idTicket: null });
  });

  test('sólo pide las OT en ejecución o finalizadas', async () => {
    await obtenerHistorial('LUM-001');

    const enEjecucionYFinalizada = [3, 4];
    for (const ops of operacionesDe('orden_trabajo')) {
      expect(ops).toContainEqual(['in', 'ot_estado', enEjecucionYFinalizada]);
    }
  });

  test('busca las OT del activo por su ticket y por su plan preventivo', async () => {
    await obtenerHistorial('LUM-001');

    const condiciones = operacionesDe('orden_trabajo').flat().filter(([op]) => op === 'eq');
    expect(condiciones).toEqual(
      expect.arrayContaining([
        ['eq', 'ticket.activo_codigo', 'LUM-001'],
        ['eq', 'mantenimiento_preventivo.activo_codigo', 'LUM-001'],
      ])
    );
  });

  test('cada tarea trae su falla y quién la hizo, sin las canceladas', async () => {
    respuestas.porTicket = { data: [OT_CORRECTIVA], error: null };
    respuestas.tecnico_asignado_tarea_ot = {
      data: [{ ot_id: 19, tarea_id: 1, tecnico_legajo: '2030', tecnico: { tecnico_nom_ape: 'German Gaona' } }],
      error: null,
    };

    const { intervenciones } = await obtenerHistorial('LUM-001');
    const [tecnico, prestador] = intervenciones[0].tareas;

    expect(intervenciones[0].tareas).toHaveLength(2);
    expect(tecnico).toMatchObject({
      idTarea: 1,
      responsable: { tipo: 'Técnico', nombre: 'German Gaona' },
      falla: { tipo: 'Eléctrica', descripcion: 'Portalámpara quemado' },
    });
    expect(prestador).toMatchObject({
      idTarea: 2,
      responsable: { tipo: 'Prestador', nombre: 'Electricidad Norte' },
      falla: null,
    });
  });

  test('no toma como responsable una asignación cancelada', async () => {
    respuestas.porTicket = { data: [OT_CORRECTIVA], error: null };

    await obtenerHistorial('LUM-001');

    const [ops] = operacionesDe('tecnico_asignado_tarea_ot');
    expect(ops).toContainEqual(['neq', 'tec_asig_estado', 5]);
  });

  test('cada tarea trae sus materiales y sus observaciones', async () => {
    respuestas.porTicket = { data: [OT_CORRECTIVA, OT_VIEJA], error: null };
    respuestas.tarea_ot_consume_material = {
      data: [
        { ot_id: 19, tarea_id: 1, mat_cod: 'MAT-010', tamat_cant: '2', material: { mat_nom: 'Lámpara LED 12 W' } },
        { ot_id: 12, tarea_id: 1, mat_cod: 'MAT-003', tamat_cant: 1, material: { mat_nom: 'Cinta aisladora' } },
      ],
      error: null,
    };
    observaciones.observacionesDelActivo.mockResolvedValue([
      { id: 3, idOt: 19, idTarea: 1, texto: 'Se cambió el portalámpara', autor: 'German Gaona', fecha: '2026-10-14T19:49:00+00:00', idUsuario: 'u1' },
    ]);

    const { intervenciones } = await obtenerHistorial('LUM-001');
    const tareaDeLa19 = intervenciones[0].tareas.find((una) => una.idTarea === 1);
    const tareaDeLa12 = intervenciones[1].tareas[0];

    expect(tareaDeLa19.materiales).toEqual([{ codigo: 'MAT-010', nombre: 'Lámpara LED 12 W', cantidad: 2 }]);
    expect(tareaDeLa19.observaciones).toEqual([
      { id: 3, texto: 'Se cambió el portalámpara', autor: 'German Gaona', fecha: '2026-10-14T19:49:00+00:00' },
    ]);
    expect(tareaDeLa12.materiales).toEqual([{ codigo: 'MAT-003', nombre: 'Cinta aisladora', cantidad: 1 }]);
    expect(tareaDeLa12.observaciones).toEqual([]);
  });

  test('el resumen cuenta las intervenciones y toma el cierre más reciente', async () => {
    respuestas.porTicket = { data: [OT_VIEJA, OT_CORRECTIVA], error: null };
    respuestas.porPlan = { data: [OT_PREVENTIVA], error: null };

    const { resumen } = await obtenerHistorial('LUM-001');

    expect(resumen).toEqual({
      cantidadIntervenciones: 3,
      fechaUltimoMantenimiento: '2026-10-14T19:50:00+00:00',
    });
  });

  test('sin ninguna OT finalizada no hay último mantenimiento', async () => {
    respuestas.porPlan = { data: [OT_PREVENTIVA], error: null };

    const { resumen } = await obtenerHistorial('LUM-001');

    expect(resumen).toEqual({ cantidadIntervenciones: 1, fechaUltimoMantenimiento: null });
  });

  test('un activo sin intervenciones devuelve el historial vacío', async () => {
    const historial = await obtenerHistorial('LUM-001');

    expect(historial).toEqual({
      resumen: { cantidadIntervenciones: 0, fechaUltimoMantenimiento: null },
      intervenciones: [],
    });
    expect(operacionesDe('tarea_ot_consume_material')).toHaveLength(0);
    expect(observaciones.observacionesDelActivo).not.toHaveBeenCalled();
  });

  test('si el activo no existe, avisa y no busca intervenciones', async () => {
    const error = Object.assign(new Error('No existe el activo "XX".'), { status: 404 });
    activos.obtenerPorId.mockRejectedValue(error);

    await expect(obtenerHistorial('XX')).rejects.toBe(error);
    expect(operacionesDe('orden_trabajo')).toHaveLength(0);
  });

  test('si falla la base, avisa con el error', async () => {
    respuestas.porTicket = { data: null, error: { message: 'se cayó la conexión' } };

    await expect(obtenerHistorial('LUM-001')).rejects.toThrow('se cayó la conexión');
  });
});
