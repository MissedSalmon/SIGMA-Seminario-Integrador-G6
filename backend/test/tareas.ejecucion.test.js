/**
 * Pruebas de la ejecucion de tareas por el tecnico (HU-22) y del cierre
 * automatico de la OT (HU-26).
 *
 * Cada accion toca varias tablas, asi que la base de mentira anota todo lo que
 * se le pide (tabla y operaciones) y cada prueba mira lo que le importa: que
 * estado se escribio, en que tabla y con que condicion.
 */
import { jest } from '@jest/globals';

/*
 * Respuestas de la base de mentira, por tabla. Una consulta de lectura toma la
 * siguiente de `lecturas[tabla]`; una escritura (update/insert) responde
 * `escrituras[tabla]` o, si no hay, que escribio una fila.
 */
let lecturas = {};
let escrituras = {};
let llamadas = [];

function consulta(tabla) {
  const registro = { tabla, ops: [] };
  llamadas.push(registro);

  const responder = () => {
    const escribe = registro.ops.some(([op]) => op === 'update' || op === 'insert');
    if (escribe) return escrituras[tabla] ?? { data: [{}], error: null };
    const cola = lecturas[tabla] ?? [];
    return cola.length > 0 ? cola.shift() : { data: [], error: null };
  };

  const cadena = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (resolver, rechazar) => Promise.resolve(responder()).then(resolver, rechazar);
        }
        if (prop === 'maybeSingle' || prop === 'single') return () => Promise.resolve(responder());
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
  supabase: {
    from: jest.fn((tabla) => consulta(tabla)),
    rpc: jest.fn(),
  },
}));

jest.unstable_mockModule('../src/servicios/inventario.servicio.js', () => ({
  obtenerItems: jest.fn(),
  obtenerItem: jest.fn(),
  asignarHerramienta: jest.fn(),
  devolverHerramienta: jest.fn(),
}));

const { supabase } = await import('../src/config/supabase.js');
const inventario = await import('../src/servicios/inventario.servicio.js');
const tareas = await import('../src/servicios/tareas.servicio.js');

/** La asignacion del tecnico 2030 a la tarea 1 de la OT 9, con sus estados en numero. */
function filaAsignacion({ estadoTarea = 2, estadoOt = 2 } = {}) {
  return {
    ot_id: 9,
    tarea_id: 1,
    tec_asig_estado: 2,
    tarea_ot: {
      tarea_id: 1,
      tarea_desc: 'Cambiar el filtro',
      tarea_estado: estadoTarea,
      tarea_prioridad: 2,
      tarea_fecha_ini: null,
      tarea_fecha_fin: null,
      orden_trabajo: {
        ot_id: 9,
        ot_desc: 'Pierde agua',
        ot_estado: estadoOt,
        ticket: { ticket_id: 3, activo: null },
        mantenimiento_preventivo: null,
      },
    },
  };
}

const ORDEN_CON_ACTIVO = {
  data: { ot_id: 9, ot_estado: 2, ticket_id: 3, ticket: { activo_codigo: 'AC-001' }, mantenimiento_preventivo: null },
  error: null,
};

/** La tarea, tantas veces como el servicio la vuelva a leer. */
function laTareaEsta(opciones, veces = 3) {
  lecturas.tecnico_asignado_tarea_ot = Array.from({ length: veces }, () => ({
    data: filaAsignacion(opciones),
    error: null,
  }));
}

/** Las escrituras que se hicieron sobre una tabla, con sus condiciones. */
function escriturasEn(tabla) {
  return llamadas.filter(
    (llamada) => llamada.tabla === tabla && llamada.ops.some(([op]) => op === 'update' || op === 'insert')
  );
}

function valorEscrito(llamada) {
  return llamada.ops.find(([op]) => op === 'update' || op === 'insert')[1];
}

beforeEach(() => {
  lecturas = {};
  escrituras = {};
  llamadas = [];
  jest.clearAllMocks();
});

describe('iniciarTarea', () => {
  test('pasa la tarea a En ejecución y arrastra asignación, OT, ticket y activo', async () => {
    laTareaEsta({ estadoTarea: 2 }); // Asignada
    lecturas.orden_trabajo = [ORDEN_CON_ACTIVO];

    await tareas.iniciarTarea('2030', 9, 1);

    const [tarea] = escriturasEn('tarea_ot');
    expect(valorEscrito(tarea)).toEqual({ tarea_estado: 3 }); // En ejecución
    expect(tarea.ops).toContainEqual(['in', 'tarea_estado', [1, 2, 4]]); // solo si no empezó

    expect(valorEscrito(escriturasEn('tecnico_asignado_tarea_ot')[0])).toEqual({ tec_asig_estado: 3 }); // En curso

    const [orden] = escriturasEn('orden_trabajo');
    expect(valorEscrito(orden)).toEqual({ ot_estado: 3 });
    expect(orden.ops).toContainEqual(['in', 'ot_estado', [1, 2]]); // no la hace retroceder

    const [ticket] = escriturasEn('ticket');
    expect(valorEscrito(ticket)).toEqual({ ticket_estado: 4 });
    expect(ticket.ops).toContainEqual(['in', 'ticket_estado', [2, 3]]);

    const [activo] = escriturasEn('activo');
    expect(valorEscrito(activo)).toEqual({ activo_estado: 2 }); // En mantenimiento
    expect(activo.ops).toContainEqual(['eq', 'activo_codigo', 'AC-001']);
    expect(activo.ops).toContainEqual(['neq', 'activo_estado', 4]); // nunca un Retirado
  });

  test('una tarea que ya está en ejecución no se vuelve a iniciar', async () => {
    laTareaEsta({ estadoTarea: 3 });

    await expect(tareas.iniciarTarea('2030', 9, 1)).rejects.toMatchObject({ estado: 409 });
    expect(escriturasEn('tarea_ot')).toHaveLength(0);
  });

  test('no se inicia una tarea de una OT finalizada', async () => {
    laTareaEsta({ estadoTarea: 2, estadoOt: 4 });

    await expect(tareas.iniciarTarea('2030', 9, 1)).rejects.toThrow('está finalizada');
  });

  test('si otro pedido la cambió en el medio, avisa en vez de pisarla', async () => {
    laTareaEsta({ estadoTarea: 2 });
    escrituras.tarea_ot = { data: [], error: null }; // el update no encontró la fila en ese estado

    await expect(tareas.iniciarTarea('2030', 9, 1)).rejects.toThrow('cambió de estado');
  });
});

describe('finalizarTarea', () => {
  test('una tarea que no empezó no se puede finalizar', async () => {
    laTareaEsta({ estadoTarea: 2 });

    await expect(tareas.finalizarTarea('2030', 9, 1)).rejects.toThrow('primero hay que iniciarla');
  });

  test('si era la última, la OT se finaliza, el ticket se cierra y el activo vuelve a Operativo', async () => {
    laTareaEsta({ estadoTarea: 3 });
    lecturas.tarea_ot = [{ data: [{ tarea_estado: 5 }, { tarea_estado: 6 }], error: null }];
    lecturas.orden_trabajo = [ORDEN_CON_ACTIVO]; // ordenConActivo; despues, ninguna otra OT en ejecución

    const { ordenFinalizada } = await tareas.finalizarTarea('2030', 9, 1);

    expect(ordenFinalizada).toBe(true);
    expect(valorEscrito(escriturasEn('tarea_ot')[0])).toEqual({ tarea_estado: 5 });
    expect(valorEscrito(escriturasEn('tecnico_asignado_tarea_ot')[0])).toEqual({ tec_asig_estado: 4 });

    const [orden] = escriturasEn('orden_trabajo');
    expect(valorEscrito(orden)).toMatchObject({ ot_estado: 4, ot_fecha_cierre: expect.any(String) });

    const [ticket] = escriturasEn('ticket');
    expect(valorEscrito(ticket)).toMatchObject({ ticket_estado: 6, ticket_fecha_cierre: expect.any(String) });

    expect(valorEscrito(escriturasEn('activo')[0])).toEqual({ activo_estado: 1 });
  });

  test('si quedan tareas sin terminar, la OT sigue abierta', async () => {
    laTareaEsta({ estadoTarea: 3 });
    lecturas.tarea_ot = [{ data: [{ tarea_estado: 5 }, { tarea_estado: 2 }], error: null }];

    const { ordenFinalizada } = await tareas.finalizarTarea('2030', 9, 1);

    expect(ordenFinalizada).toBe(false);
    expect(escriturasEn('orden_trabajo')).toHaveLength(0);
    expect(escriturasEn('ticket')).toHaveLength(0);
  });

  test('si otra OT sigue arreglando el activo, no lo pasa a Operativo', async () => {
    laTareaEsta({ estadoTarea: 3 });
    lecturas.tarea_ot = [{ data: [{ tarea_estado: 5 }], error: null }];
    lecturas.orden_trabajo = [ORDEN_CON_ACTIVO, { data: [{ ot_id: 12 }], error: null }];

    await tareas.finalizarTarea('2030', 9, 1);

    expect(escriturasEn('activo')).toHaveLength(0);
  });
});

describe('registrarMateriales', () => {
  test('llama a la función de la base con los materiales y el legajo', async () => {
    laTareaEsta({ estadoTarea: 3 });
    supabase.rpc.mockResolvedValue({ data: null, error: null });

    await tareas.registrarMateriales('2030', 9, 1, [{ codigo: ' MAT-002 ', cantidad: '4' }]);

    expect(supabase.rpc).toHaveBeenCalledWith('registrar_consumo_tarea', {
      p_ot_id: 9,
      p_tarea_id: 1,
      p_items: [{ codigo: 'MAT-002', cantidad: 4 }],
      p_usuario: '2030',
    });
  });

  test('si la base dice que no alcanza el stock, responde 409 con su mensaje', async () => {
    laTareaEsta({ estadoTarea: 3 });
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'No hay stock suficiente de "Cinta aisladora": quedan 3 y querés registrar 5.' },
    });

    await expect(
      tareas.registrarMateriales('2030', 9, 1, [{ codigo: 'MAT-003', cantidad: 5 }])
    ).rejects.toMatchObject({ estado: 409, message: expect.stringContaining('No hay stock suficiente') });
  });

  test('sólo se registran mientras la tarea está en ejecución', async () => {
    laTareaEsta({ estadoTarea: 2 });

    await expect(
      tareas.registrarMateriales('2030', 9, 1, [{ codigo: 'MAT-002', cantidad: 1 }])
    ).rejects.toMatchObject({ estado: 409 });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test.each([
    [[], 'al menos un material'],
    [[{ codigo: 'MAT-002', cantidad: 0 }], 'mayor que cero'],
    [[{ codigo: 'MAT-002', cantidad: 1.5 }], 'entero'],
    [[{ codigo: '', cantidad: 1 }], 'sin material elegido'],
    [[{ codigo: 'MAT-002', cantidad: 1 }, { codigo: 'MAT-002', cantidad: 2 }], 'repetido'],
  ])('rechaza datos mal cargados (%#)', async (items, mensaje) => {
    laTareaEsta({ estadoTarea: 3 });

    await expect(tareas.registrarMateriales('2030', 9, 1, items)).rejects.toMatchObject({
      estado: 400,
      message: expect.stringContaining(mensaje),
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('historial', () => {
  test('materiales: sólo lo usado en las tareas del técnico, aunque compartan OT con otro', async () => {
    lecturas.tecnico_asignado_tarea_ot = [{ data: [{ ot_id: 9, tarea_id: 1 }], error: null }];
    lecturas.tarea_ot_consume_material = [
      {
        data: [
          { ot_id: 9, tarea_id: 1, mat_cod: 'MAT-002', tamat_cant: 4, tamat_fecha_cons: '2026-10-10', material: { mat_nom: 'Tornillo' }, tarea_ot: { tarea_desc: 'Cambiar el filtro' } },
          { ot_id: 9, tarea_id: 2, mat_cod: 'MAT-003', tamat_cant: 1, tamat_fecha_cons: '2026-10-10', material: { mat_nom: 'Cinta' }, tarea_ot: { tarea_desc: 'De otro técnico' } },
        ],
        error: null,
      },
    ];

    const filas = await tareas.historialMateriales('2030');

    expect(filas).toEqual([
      expect.objectContaining({ codigo: 'MAT-002', cantidad: 4, idOt: 9, idTarea: 1, tarea: 'Cambiar el filtro' }),
    ]);
  });

  test('materiales: sin tareas asignadas no consulta nada más', async () => {
    lecturas.tecnico_asignado_tarea_ot = [{ data: [], error: null }];

    expect(await tareas.historialMateriales('2030')).toEqual([]);
    expect(llamadas.some((llamada) => llamada.tabla === 'tarea_ot_consume_material')).toBe(false);
  });

  test('herramientas: las del técnico, marcando cuáles tiene todavía', async () => {
    lecturas.tecnico_utiliza_herramienta = [
      {
        data: [
          { herr_cod: 'HER-1', tec_herr_fecha_prest: '2026-10-10', tec_herr_fecha_dev: null, ot_id: 9, tarea_id: 1, herramienta: { herr_nom: 'Taladro' } },
          { herr_cod: 'HER-2', tec_herr_fecha_prest: '2026-10-01', tec_herr_fecha_dev: '2026-10-02', ot_id: null, tarea_id: null, herramienta: { herr_nom: 'Escalera' } },
        ],
        error: null,
      },
    ];

    const filas = await tareas.historialHerramientas('2030');

    expect(filas.map((fila) => [fila.codigo, fila.enUso, fila.idOt])).toEqual([['HER-1', true, 9], ['HER-2', false, null]]);
    expect(llamadas[0].ops).toContainEqual(['eq', 'tecnico_legajo', '2030']);
  });
});

describe('herramientas', () => {
  test('separa las que tengo a mi nombre de las disponibles', async () => {
    inventario.obtenerItems.mockResolvedValue([
      { codigo: 'HER-1', nombre: 'Taladro', estado: 'En uso', legajoTecnico: '2030', asignadaDesde: '2026-10-10' },
      { codigo: 'HER-2', nombre: 'Escalera', estado: 'Disponible', legajoTecnico: null },
      { codigo: 'HER-3', nombre: 'Amoladora', estado: 'En uso', legajoTecnico: '1025' },
      { codigo: 'HER-4', nombre: 'Soldadora', estado: 'Fuera de servicio', legajoTecnico: null },
    ]);

    const { mias, disponibles } = await tareas.listarHerramientas('2030');

    expect(mias.map((herramienta) => herramienta.codigo)).toEqual(['HER-1']);
    expect(disponibles.map((herramienta) => herramienta.codigo)).toEqual(['HER-2']);
  });

  test('tomar una herramienta la asigna al técnico de la sesión', async () => {
    laTareaEsta({ estadoTarea: 3 });
    inventario.obtenerItems.mockResolvedValue([]);

    await tareas.tomarHerramienta('2030', 9, 1, 'HER-2');

    expect(inventario.asignarHerramienta).toHaveBeenCalledWith('HER-2', { legajo: '2030', idOt: 9, idTarea: 1 });
  });

  test('no se toma una herramienta si la tarea no está en ejecución', async () => {
    laTareaEsta({ estadoTarea: 5 });

    await expect(tareas.tomarHerramienta('2030', 9, 1, 'HER-2')).rejects.toMatchObject({ estado: 409 });
    expect(inventario.asignarHerramienta).not.toHaveBeenCalled();
  });

  test('no se puede devolver una herramienta que tiene otro técnico', async () => {
    inventario.obtenerItem.mockResolvedValue({ clase: 'Herramienta', nombre: 'Amoladora', legajoTecnico: '1025' });

    await expect(tareas.devolverHerramienta('2030', 'HER-3')).rejects.toThrow('no está a tu nombre');
    expect(inventario.devolverHerramienta).not.toHaveBeenCalled();
  });
});
