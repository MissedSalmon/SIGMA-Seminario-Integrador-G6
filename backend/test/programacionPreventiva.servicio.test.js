import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { elegirTecnico, generarOtsPreventivas, listarPorVencer, listarProgramacion, proximoMantenimiento } =
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

function filaPlan({ tareas = [], tecnicos = [], ...resto } = {}) {
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
    mant_prev_tecnico: tecnicos.map(([legajo, especialidades, disponible = true]) => ({
      tecnico: {
        tecnico_legajo: legajo,
        tecnico_nom_ape: `Técnico ${legajo}`,
        tecnico_disponibilidad: disponible,
        tecnico_especialidad: especialidades.map((id) => ({ especialidad_id: id })),
      },
    })),
    ...resto,
  };
}

function filaActivo(codigo, alta, estado = OPERATIVO) {
  return { activo_codigo: codigo, activo_desc: null, tipo_activo_id: 1, activo_fecha_alta: alta, activo_estado: estado };
}

/** Responde las lecturas con los datos dados y las inserciones con éxito. */
function escenario({ planes, activos, ordenes = [], asignaciones = [], alInsertarOt }) {
  let proximaOt = 500;
  return baseFalsa((pedido) => {
    if (pedido.op === 'select') {
      const datos = {
        mantenimiento_preventivo: planes,
        activo: activos,
        orden_trabajo: ordenes,
        tecnico_asignado_tarea_ot: asignaciones,
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
  const base = { altaPlan: '2026-01-01', intervalo: 6, unidad: 'meses' };

  test('ejemplo de la consigna: cada aire cuenta desde su propia alta', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-06-13' }).fecha).toBe('2026-12-13');
    expect(proximoMantenimiento({ ...base, altaActivo: '2026-08-20' }).fecha).toBe('2027-02-20');
  });

  test('un activo anterior al plan cuenta desde la alta del plan', () => {
    expect(proximoMantenimiento({ ...base, altaActivo: '2020-03-10', altaPlan: '2026-11-03' }).fecha).toBe('2027-05-03');
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

describe('elegirTecnico (asignación por especialidad)', () => {
  const tecnicos = [
    { legajo: 'T-2', disponible: true, idsEspecialidad: [2] },
    { legajo: 'T-1', disponible: true, idsEspecialidad: [2, 4] },
    { legajo: 'T-3', disponible: false, idsEspecialidad: [2, 5] },
  ];

  test('elige al de menos tareas pendientes entre los de la especialidad', () => {
    const carga = new Map([['T-1', 3], ['T-2', 1]]);
    expect(elegirTecnico({ idEspecialidad: 2 }, tecnicos, carga)).toBe('T-2');
  });

  test('si empatan en carga, gana el legajo menor', () => {
    expect(elegirTecnico({ idEspecialidad: 2 }, tecnicos)).toBe('T-1');
  });

  test('no elige a un técnico no disponible', () => {
    expect(elegirTecnico({ idEspecialidad: 5 }, tecnicos)).toBeNull();
  });

  test('sin nadie con la especialidad, devuelve null', () => {
    expect(elegirTecnico({ idEspecialidad: 9 }, tecnicos)).toBeNull();
  });

  test('una tarea sin especialidad la puede hacer cualquier disponible', () => {
    expect(elegirTecnico({ idEspecialidad: null }, tecnicos)).toBe('T-1');
  });
});

describe('generarOtsPreventivas', () => {
  test('genera sólo los activos cuya fecha llegó, con la fecha del ciclo', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]], tecnicos: [['T-1', [2]]] })],
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
      ot_estado: ENUM_ESTADO_OT.codigo('Asignada'),
    });
  });

  test('la ventana de anticipación adelanta la generación', async () => {
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
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]], tecnicos: [['T-1', [2]]] })],
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

  test('reparte la carga entre técnicos de la misma especialidad dentro de la misma corrida', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]], tecnicos: [['T-1', [2]], ['T-2', [2]]] })],
      activos: [filaActivo('AC-A', '2026-06-13'), filaActivo('AC-B', '2026-06-13')],
    });

    await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    const legajos = insercionesDe(pedidos, 'tecnico_asignado_tarea_ot').map((p) => p.datos[0].tecnico_legajo);
    expect(legajos).toEqual(['T-1', 'T-2']);
  });

  test('tiene en cuenta las tareas pendientes que el técnico ya tenía', async () => {
    const pedidos = escenario({
      planes: [filaPlan({ tareas: [[10, 'Limpiar filtros', 2]], tecnicos: [['T-1', [2]], ['T-2', [2]]] })],
      activos: [filaActivo('AC-A', '2026-06-13')],
      asignaciones: [{ tecnico_legajo: 'T-1' }, { tecnico_legajo: 'T-1' }],
    });

    await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(insercionesDe(pedidos, 'tecnico_asignado_tarea_ot')[0].datos[0].tecnico_legajo).toBe('T-2');
  });

  test('una tarea sin técnico de su especialidad queda sin asignar y la OT en "Creada"', async () => {
    const pedidos = escenario({
      planes: [
        filaPlan({
          tareas: [[10, 'Limpiar filtros', 2], [11, 'Revisar tablero', 1]],
          tecnicos: [['T-1', [2]]],
        }),
      ],
      activos: [filaActivo('AC-A', '2026-06-13')],
    });

    const resultado = await generarOtsPreventivas({ fechaCorte: '2026-12-13', diasAnticipacion: 0 });

    expect(insercionesDe(pedidos, 'orden_trabajo')[0].datos.ot_estado).toBe(ENUM_ESTADO_OT.codigo('Creada'));
    const tareas = insercionesDe(pedidos, 'tarea_ot')[0].datos;
    expect(tareas.map((t) => t.tarea_estado)).toEqual([
      ENUM_ESTADO_TAREA.codigo('Asignada'),
      ENUM_ESTADO_TAREA.codigo('Creada'),
    ]);
    expect(insercionesDe(pedidos, 'tecnico_asignado_tarea_ot')[0].datos).toHaveLength(1);
    expect(resultado.detalles[0].tareasSinTecnico).toEqual(['Revisar tablero']);
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
  test('listarProgramacion devuelve cada activo con su última y próxima fecha', async () => {
    escenario({
      planes: [filaPlan()],
      activos: [filaActivo('AC-B', '2026-08-20'), filaActivo('AC-A', '2026-06-13')],
      ordenes: [{ ot_id: 3, mant_prev_id: 1, activo_codigo: 'AC-A', ot_estado: ENUM_ESTADO_OT.codigo('Finalizada'), ot_fecha_cierre: '2026-12-14' }],
    });

    const lista = await listarProgramacion(1);

    expect(lista).toEqual([
      expect.objectContaining({ codigoActivo: 'AC-B', ultimaRealizada: null, proxima: '2027-02-20', otAbierta: null }),
      expect.objectContaining({ codigoActivo: 'AC-A', ultimaRealizada: '2026-12-14', proxima: '2027-06-14' }),
    ]);
  });

  test('listarPorVencer avisa las tareas que van a quedar sin técnico', async () => {
    escenario({
      planes: [filaPlan({ tareas: [[11, 'Revisar tablero', 1]], tecnicos: [['T-1', [2]]] })],
      activos: [filaActivo('AC-A', '2026-06-13')],
    });

    const lista = await listarPorVencer(7, '2026-12-01');

    expect(lista).toHaveLength(1);
    expect(lista[0]).toMatchObject({ codigoActivo: 'AC-A', fecha: '2026-12-13', diasRestantes: 12 });
    expect(lista[0].advertencia).toContain('Revisar tablero');
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
