import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  cierraAlEliminar,
  crearTipoFalla,
  eliminarTarea,
  normalizarNombreTipoFalla,
  registrarFalla,
} = await import('../src/servicios/ordenesTrabajo.servicio.js');

afterEach(() => {
  jest.clearAllMocks();
});

describe('registrarFalla', () => {
  test('rechaza un tipo que no está en el catálogo', async () => {
    const consulta = {
      select: jest.fn(() => consulta),
      order: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    supabase.from.mockReturnValue(consulta);

    await expect(
      registrarFalla(1, 1, { tipo: 'Térmica', descripcion: 'El equipo no enciende.' })
    ).rejects.toThrow('Elegí un tipo de falla existente.');

    expect(supabase.from).toHaveBeenCalledWith('tipo_falla');
  });

  test('rechaza una descripción vacía', async () => {
    await expect(
      registrarFalla(1, 1, { tipo: 'Eléctrica', descripcion: '   ' })
    ).rejects.toThrow('La descripción de la falla es obligatoria.');

    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('normalizarNombreTipoFalla', () => {
  test('deja sólo la primera letra en mayúscula y compacta espacios', () => {
    expect(normalizarNombreTipoFalla('  FALLA   MECÁNICA  ')).toBe('Falla mecánica');
  });

  test('rechaza un nombre vacío', () => {
    expect(normalizarNombreTipoFalla('   ')).toBeNull();
  });
});

describe('crearTipoFalla', () => {
  test('normaliza y crea un tipo nuevo', async () => {
    const consulta = {
      select: jest.fn(() => consulta),
      order: jest.fn().mockResolvedValue({ data: [{ tipo_falla_nom: 'Eléctrica' }], error: null }),
    };
    const single = jest.fn().mockResolvedValue({
      data: { tipo_falla_nom: 'Falla térmica' },
      error: null,
    });
    const seleccionarInsertado = { single };
    const insertar = jest.fn(() => ({
      select: jest.fn(() => seleccionarInsertado),
    }));
    supabase.from.mockReturnValueOnce(consulta).mockReturnValueOnce({ insert: insertar });

    await expect(crearTipoFalla('FALLA TÉRMICA')).resolves.toBe('Falla térmica');
    expect(insertar).toHaveBeenCalledWith({ tipo_falla_nom: 'Falla térmica' });
  });

  test('rechaza un nombre ya creado sin distinguir mayúsculas', async () => {
    const consulta = {
      select: jest.fn(() => consulta),
      order: jest.fn().mockResolvedValue({ data: [{ tipo_falla_nom: 'Mecánica' }], error: null }),
    };
    supabase.from.mockReturnValue(consulta);

    await expect(crearTipoFalla('MECÁNICA')).rejects.toThrow('ya está creado');
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });
});

function consultaEncadenada(respuesta) {
  const cadena = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') {
          return (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar);
        }
        if (prop === 'maybeSingle' || prop === 'single') return () => Promise.resolve(respuesta);
        return jest.fn(() => cadena);
      },
    }
  );
  return cadena;
}

describe('cierraAlEliminar', () => {
  test('devuelve true si al quitar la tarea sólo quedan tareas finalizadas o canceladas y al menos una finalizada', async () => {
    supabase.from.mockReturnValue(
      consultaEncadenada({
        data: [
          { tarea_id: 1, tarea_estado: 5 }, // Finalizada
          { tarea_id: 2, tarea_estado: 6 }, // Cancelada
          { tarea_id: 3, tarea_estado: 2 }, // Asignada (la que se elimina)
        ],
        error: null,
      })
    );

    expect(await cierraAlEliminar(10, 3)).toBe(true);
  });

  test('devuelve false si era la única tarea, si sólo quedan canceladas o si queda alguna pendiente', async () => {
    supabase.from
      .mockReturnValueOnce(consultaEncadenada({ data: [{ tarea_id: 1, tarea_estado: 1 }], error: null }))
      .mockReturnValueOnce(
        consultaEncadenada({
          data: [
            { tarea_id: 1, tarea_estado: 6 },
            { tarea_id: 2, tarea_estado: 1 },
          ],
          error: null,
        })
      )
      .mockReturnValueOnce(
        consultaEncadenada({
          data: [
            { tarea_id: 1, tarea_estado: 5 },
            { tarea_id: 2, tarea_estado: 2 },
            { tarea_id: 3, tarea_estado: 1 },
          ],
          error: null,
        })
      );

    expect(await cierraAlEliminar(10, 1)).toBe(false);
    expect(await cierraAlEliminar(10, 2)).toBe(false);
    expect(await cierraAlEliminar(10, 3)).toBe(false);
  });
});

describe('eliminarTarea y cierre automático de OT', () => {
  function montarBaseMock(lecturas, escrituras = {}) {
    const llamadas = [];
    supabase.from.mockImplementation((tabla) => {
      const registro = { tabla, ops: [] };
      llamadas.push(registro);

      const responder = () => {
        const escribe = registro.ops.some(([op]) => op === 'update' || op === 'insert' || op === 'delete');
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
    });
    return llamadas;
  }

  test('al eliminar una tarea no finalizada, si las restantes están finalizadas cierra la OT, el ticket y actualiza el activo', async () => {
    const llamadas = montarBaseMock({
      orden_trabajo: [
        // ordenPlanificable
        { data: { ot_id: 9, ot_estado: 3, ticket_id: 3 }, error: null },
        // ordenConActivo dentro de finalizarOrdenSiTermino
        { data: { ot_id: 9, ot_estado: 4, ticket_id: 3, ticket: { activo_codigo: 'AC-001' }, mantenimiento_preventivo: null }, error: null },
        // activoSigueEnMantenimiento (3 consultas)
        { data: [], error: null },
        { data: [], error: null },
        { data: [], error: null },
        // obtenerPorId final
        { data: { ot_id: 9, ot_estado: 4, ticket_id: 3, tarea_ot: [] }, error: null },
      ],
      tarea_ot: [
        // tarea existente (Asignada)
        { data: { ot_id: 9, tarea_id: 2, tarea_estado: 2 }, error: null },
        // finalizarOrdenSiTermino: sólo queda la tarea 1 Finalizada
        { data: [{ tarea_estado: 5 }], error: null },
      ],
      falla: [{ data: null, error: null }],
      tecnico_asignado_tarea_ot: [{ data: [], error: null }],
    });

    const resultado = await eliminarTarea(9, 2, 'Fuera de servicio');

    expect(resultado.ordenFinalizada).toBe(true);
    expect(resultado.orden.estado).toBe('Finalizada');

    const updateOt = llamadas.find((l) => l.tabla === 'orden_trabajo' && l.ops.some(([op]) => op === 'update'));
    expect(updateOt.ops.find(([op]) => op === 'update')[1]).toMatchObject({
      ot_estado: 4,
      ot_fecha_cierre: expect.any(String),
    });

    const updateTicket = llamadas.find((l) => l.tabla === 'ticket' && l.ops.some(([op]) => op === 'update'));
    expect(updateTicket.ops.find(([op]) => op === 'update')[1]).toMatchObject({
      ticket_estado: 6,
      ticket_fecha_cierre: expect.any(String),
    });

    const updateActivo = llamadas.find((l) => l.tabla === 'activo' && l.ops.some(([op]) => op === 'update'));
    expect(updateActivo.ops.find(([op]) => op === 'update')[1]).toEqual({ activo_estado: 3 });
  });

  test('al eliminar una tarea si todavía quedan otras pendientes no cierra la OT', async () => {
    const llamadas = montarBaseMock({
      orden_trabajo: [
        // ordenPlanificable
        { data: { ot_id: 9, ot_estado: 3, ticket_id: 3 }, error: null },
        // recalcularEstado
        { data: { ot_id: 9, ot_estado: 3, ticket_id: 3 }, error: null },
        // obtenerPorId final
        { data: { ot_id: 9, ot_estado: 3, ticket_id: 3, tarea_ot: [] }, error: null },
      ],
      tarea_ot: [
        // tarea existente (Creada)
        { data: { ot_id: 9, tarea_id: 3, tarea_estado: 1 }, error: null },
        // finalizarOrdenSiTermino: queda 1 Finalizada y 1 Asignada
        { data: [{ tarea_estado: 5 }, { tarea_estado: 2 }], error: null },
      ],
      falla: [{ data: null, error: null }],
      tecnico_asignado_tarea_ot: [{ data: [], error: null }],
    });

    const resultado = await eliminarTarea(9, 3);

    expect(resultado.ordenFinalizada).toBe(false);
    expect(llamadas.filter((l) => l.tabla === 'orden_trabajo' && l.ops.some(([op]) => op === 'update'))).toHaveLength(0);
    expect(llamadas.filter((l) => l.tabla === 'ticket' && l.ops.some(([op]) => op === 'update'))).toHaveLength(0);
  });

  test('rechaza un estado de activo inválido sin borrar la tarea', async () => {
    await expect(eliminarTarea(9, 2, 'Retirado')).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });
});