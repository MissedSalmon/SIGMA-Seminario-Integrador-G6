import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { generarOtsPreventivas, listarPorVencer, listarProgramacion, proximoMantenimiento } =
  await import('../src/servicios/programacionPreventiva.servicio.js');
const { msHastaLaProximaCorrida } = await import('../src/tareasProgramadas/generacionPreventiva.js');
const { ENUM_ESTADO_ACTIVO, ENUM_ESTADO_OT, ENUM_ESTADO_TAREA } = await import('../src/utiles/enumerados.js');

/*
 * Base falsa: cada pedido a supabase queda anotado (tabla, operación, datos) y
 * lo que devuelve sale de `responder`. Los filtros (.eq, .in) no se aplican.
 */
function baseFalsa(responder) {
  const pedidos = [];
  supabase.from.mockImplementation((tabla) => {
    const pedido = { tabla, op: 'select', datos: null };
    pedidos.push(pedido);
    const respuesta = () => Promise.resolve(responder(pedido) ?? { data: null, error: null });
    const cadena = {
      select: () => cadena,
      eq: () => cadena,
      neq: () => cadena,
      in: () => cadena,
      insert: (datos) => {
        pedido.op = 'insert';
        pedido.datos = datos;
        return cadena;
      },
      delete: () => {
        pedido.op = 'delete';
        return cadena;
      },
      single: respuesta,
      maybeSingle: respuesta,
      then: (ok, mal) => respuesta().then(ok, mal),
    };
    return cadena;
  });
  return pedidos;
}

const OPERATIVO = ENUM_ESTADO_ACTIVO.codigo('Operativo');

function filaPlan({ tareas = [], ...resto } = {}) {
  return {
    mant_prev_id: 1,
    mant_prev_nom: 'Limpieza de filtros',
    activo_codigo: null,
    tipo_activo_id: 1,
    mant_prev_intervalo: 6,
    mant_prev_unidad_frec: 'meses',
    mant_prev_fecha_alta: '2026-01-01',
    mant_prev_activo: true,
    mant_prev_tarea: tareas.map(([id, nombre, especialidad]) => ({
      plantilla_de_tarea: { tarea_plan_id: id, tarea_plan_nom: nombre, especialidad_id: especialidad },
    })),
    ...resto,
  };
}

function filaActivo(codigo, alta, estado = OPERATIVO) {
  return { activo_codigo: codigo, activo_desc: null, tipo_activo_id: 1, activo_fecha_alta: alta, activo_estado: estado };
}

/** Responde las lecturas con los datos dados y las inserciones con éxito. */
function escenario({ planes, activos, ordenes = [], alInsertarOt }) {
  let proximaOt = 500;
  return baseFalsa((pedido) => {
    if (pedido.op === 'select') {
      const datos = {
        mantenimiento_preventivo: planes,
        activo: activos,
        orden_trabajo: ordenes,
      }[pedido.tabla];
      return { data: datos, error: null };
    }
    if (pedido.op === 'insert' && pedido.tabla === 'orden_trabajo') {
      return alInsertarOt?.(pedido) ?? { data: { ot_id: proximaOt++ }, error: null };
    }
    return { data: null, error: null };
  });
}

const insercionesDe = (pedidos, tabla) => pedidos.filter((p) => p.op === 'insert' && p.tabla === tabla);

afterEach(() => {
  jest.resetAllMocks();
});

describe('proximoMantenimiento (reglas de negocio)', () => {
  const base = { hoy: '2026-11-06', intervalo: 6, unidad: 'meses' };

  test('ejemplo de la consigna: cada aire cuenta desde su propia alta', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-06-13' }).fecha).toBe('2026-12-13');
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-08-20' }).fecha).toBe('2027-02-20');
  });

  test('cuenta desde la alta del activo aunque el plan se haya creado después', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-05-10' }).fecha).toBe('2026-11-10');
  });

  test('si el vencimiento ya pasó, queda ese y no el siguiente', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-04-11' }).fecha).toBe('2026-10-11');
  });

  test('un activo de hace dos años con plan trimestral debe sólo el último vencimiento', () => {
    const resultado = proximoMantenimiento({ ...base, intervalo: 3, altaActivo: '2024-11-20' });
    expect(resultado.fecha).toBe('2026-08-20');
  });

  test('una OT cancelada hace mucho tampoco arrastra los ciclos atrasados', () => {
    const resultado = proximoMantenimiento({
      ...base,
      altaActivo: '2024-07-10',
      ordenes: [{ id: 1, estado: 'Cancelada', fechaProgramada: '2025-01-10' }],
    });
    expect(resultado.fecha).toBe('2026-07-10');
  });

  test('fin de mes: los atrasados se suman desde la alta y no se corren al 28', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2025-08-31' }).fecha).toBe('2026-08-31');
  });

  test('con una OT finalizada, cuenta desde su cierre aunque se haya cerrado tarde', () => {
    const resultado = proximoMantenimiento({
      ...base,
      altaActivo: '2026-06-13',
      ordenes: [{ id: 1, estado: 'Finalizada', fechaProgramada: '2026-12-13', fechaCierre: '2027-01-10T15:00:00+00:00' }],
    });
    expect(resultado.fecha).toBe('2027-07-10');
    expect(resultado.ultimaRealizada).toBe('2027-01-10');
  });

  test('toma la última de varias OT finalizadas', () => {
    const resultado = proximoMantenimiento({
      ...base,
      altaActivo: '2026-01-01',
      ordenes: [
        { id: 2, estado: 'Finalizada', fechaCierre: '2027-01-05' },
        { id: 1, estado: 'Finalizada', fechaCierre: '2026-07-02' },
      ],
    });
    expect(resultado.fecha).toBe('2027-07-05');
  });

  test('mientras haya una OT abierta no hay próxima fecha', () => {
    const resultado = proximoMantenimiento({
      ...base,
      altaActivo: '2026-06-13',
      ordenes: [{ id: 9, estado: 'En ejecución', fechaProgramada: '2026-12-13' }],
    });
    expect(resultado.fecha).toBeNull();
    expect(resultado.otAbierta.id).toBe(9);
  });

  test('una OT cancelada saltea el ciclo: se cuenta desde su fecha programada', () => {
    const resultado = proximoMantenimiento({
      ...base,
      altaActivo: '2026-06-13',
      ordenes: [
        { id: 1, estado: 'Finalizada', fechaCierre: '2026-12-15' },
        { id: 2, estado: 'Cancelada', fechaProgramada: '2027-06-15' },
      ],
    });
    expect(resultado.fecha).toBe('2027-12-15');
    expect(resultado.ultimaRealizada).toBe('2026-12-15');
  });

  test('fin de mes: un aire dado de alta el 31/08 vence el último día de febrero', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-08-31' }).fecha).toBe('2027-02-28');
    expect(proximoMantenimiento({ ...base, altaActivo: '2027-08-31' }).fecha).toBe('2028-02-29');
  });
});

describe('generarOtsPreventivas', () => {
  test('genera sólo los activos cuya fecha llegó, con la fecha del ciclo', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2], [11, 'Revisar tablero', 1]] })],
      activos: [filaActivo('AC-A', '2026-06-13'), filaActivo('AC-B', '2026-08-20')],
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(resultado.otsGeneradas).toBe(1);
    const [ot] = insercionesDe(pedidos, 'orden_trabajo');
    expect(ot.datos).toMatchObject({
      mant_prev_id: 1,
      activo_codigo: 'AC-A',
      ticket_id: null,
      ot_fecha_programada: '2026-12-13',
      ot_estado: ENUM_ESTADO_OT.codigo('Creada'),
    });
  });

  test('las tareas del plan van sin responsable: los técnicos se asignan después', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2], [11, 'Revisar tablero', 1]] })],
      activos: [filaActivo('AC-A', '2026-06-13')],
    });

    await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    const tareas = insercionesDe(pedidos, 'tarea_ot')[0].datos;
    expect(tareas.map((t) => t.tarea_desc)).toEqual(['Limpiar filtros', 'Revisar tablero']);
    expect(tareas.every((t) => t.tarea_estado === ENUM_ESTADO_TAREA.codigo('Creada'))).toBe(true);
    expect(insercionesDe(pedidos, 'tecnico_asignado_tarea_ot')).toHaveLength(0);
  });

  test('con un día de anticipación la OT se crea el día anterior, y no antes', async () => {
    const plan = filaPlan({ mant_prev_intervalo: 1, mant_prev_unidad_frec: 'semanas' });
    const antes = escenario({ planes: [plan], activos: [filaActivo('AC-A', '2026-11-02')] });
    await generarOtsPreventivas({ fechaCorte: '2026-11-07', diasAnticipacion: 1 });
    expect(insercionesDe(antes, 'orden_trabajo')).toHaveLength(0);

    jest.resetAllMocks();
    const elDiaAnterior = escenario({ planes: [plan], activos: [filaActivo('AC-A', '2026-11-02')] });
    await generarOtsPreventivas({ fechaCorte: '2026-11-08', diasAnticipacion: 1 });
    expect(insercionesDe(elDiaAnterior, 'orden_trabajo')[0].datos.ot_fecha_programada).toBe('2026-11-09');
  });

  test('un activo viejo con varios ciclos atrasados genera una sola OT', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ mant_prev_intervalo: 3, mant_prev_fecha_alta: '2026-11-04' })],
      activos: [filaActivo('PC-VIEJA', '2024-11-20')],
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-11-06', diasAnticipacion: 1 });

    expect(resultado.otsGeneradas).toBe(1);
    const ots = insercionesDe(pedidos, 'orden_trabajo');
    expect(ots).toHaveLength(1);
    expect(ots[0].datos.ot_fecha_programada).toBe('2026-08-20');
  });

  test('la anticipación configurada adelanta la generación', async () => {
    const pedidos = escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-B', '2026-08-20')],
    });

    await generarOtsPreventivas({ fechaCorte: '2027-02-13', diasAnticipacion: 7 });

    expect(insercionesDe(pedidos, 'orden_trabajo')[0].datos.ot_fecha_programada).toBe('2027-02-20');
  });

  test('es idempotente: un par con OT abierta no genera otra', async () => {
    const pedidos = escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-A', '2026-06-13')],
      ordenes: [{ ot_id: 7, mant_prev_id: 1, activo_codigo: 'AC-A', ot_estado: ENUM_ESTADO_OT.codigo('Asignada'), ot_fecha_programada: '2026-12-13' }],
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-12-20', diasAnticipacion: 0 });

    expect(resultado.otsGeneradas).toBe(0);
    expect(insercionesDe(pedidos, 'orden_trabajo')).toHaveLength(0);
  });

  test('es idempotente: si el índice único rechaza el ciclo, no carga tareas ni cuenta la OT', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]] })],
      activos: [filaActivo('AC-A', '2026-06-13')],
      alInsertarOt: () => ({ data: null, error: { code: '23505', message: 'duplicate key' } }),
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(resultado.otsGeneradas).toBe(0);
    expect(resultado.yaExistian).toBe(1);
    expect(insercionesDe(pedidos, 'tarea_ot')).toHaveLength(0);
  });

  test('no genera para un activo retirado', async () => {
    const pedidos = escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-A', '2026-06-13', ENUM_ESTADO_ACTIVO.codigo('Retirado'))],
    });

    await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(insercionesDe(pedidos, 'orden_trabajo')).toHaveLength(0);
  });

  test('si fallan las tareas, borra la OT recién creada y lo informa', async () => {
    const pedidos = baseFalsa((pedido) => {
      if (pedido.op === 'select') {
        const datos = {
          mantenimiento_preventivo: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]] })],
          activo: [filaActivo('AC-A', '2026-06-13')],
        }[pedido.tabla];
        return { data: datos ?? [], error: null };
      }
      if (pedido.op === 'insert' && pedido.tabla === 'orden_trabajo') return { data: { ot_id: 77 }, error: null };
      if (pedido.op === 'insert' && pedido.tabla === 'tarea_ot') return { data: null, error: { message: 'falló' } };
      return { data: null, error: null };
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(resultado.otsGeneradas).toBe(0);
    expect(resultado.detalles[0].estado).toBe('error');
    expect(pedidos.some((p) => p.op === 'delete' && p.tabla === 'orden_trabajo')).toBe(true);
  });
});

describe('consultas de programación', () => {
  test('listarPorVencer trae los mantenimientos de los próximos días, con el día en que se genera la OT', async () => {
    escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-A', '2026-06-13'), filaActivo('AC-B', '2026-08-20')],
    });

    const lista = await listarPorVencer(7, '2026-12-08');

    expect(lista).toEqual([
      { idPlan: 1, nombre: 'Limpieza de filtros', codigoActivo: 'AC-A', fecha: '2026-12-13', fechaGeneracion: '2026-12-12', diasRestantes: 5 },
    ]);
  });

  test('listarPorVencer no pasa de los días pedidos', async () => {
    escenario({ planes: [filaPlan()], activos: [filaActivo('AC-A', '2026-06-13')] });

    expect(await listarPorVencer(7, '2026-12-05')).toHaveLength(0);
    expect(await listarPorVencer(7, '2026-12-06')).toHaveLength(1);
  });

  test('listarProgramacion devuelve cada activo con su última y próxima fecha', async () => {
    escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-B', '2026-08-20'), filaActivo('AC-A', '2026-06-13')],
      ordenes: [{ ot_id: 3, mant_prev_id: 1, activo_codigo: 'AC-A', ot_estado: ENUM_ESTADO_OT.codigo('Finalizada'), ot_fecha_cierre: '2026-12-14' }],
    });

    const lista = await listarProgramacion(1, '2026-11-06');

    expect(lista).toEqual([
      expect.objectContaining({ codigoActivo: 'AC-B', ultimaRealizada: null, proxima: '2027-02-20', otAbierta: null }),
      expect.objectContaining({ codigoActivo: 'AC-A', ultimaRealizada: '2026-12-14', proxima: '2027-06-14' }),
    ]);
  });

});

describe('msHastaLaProximaCorrida', () => {
  test('cuenta hasta la hora pedida en Argentina (UTC-3)', () => {
    // 08:00 UTC son las 05:00 en Argentina: faltan 1 h para las 6.
    expect(msHastaLaProximaCorrida(6, new Date('2026-11-03T08:00:00Z'))).toBe(60 * 60 * 1000);
    // 10:00 UTC son las 07:00: la próxima es mañana, en 23 h.
    expect(msHastaLaProximaCorrida(6, new Date('2026-11-03T10:00:00Z'))).toBe(23 * 60 * 60 * 1000);
  });
});
