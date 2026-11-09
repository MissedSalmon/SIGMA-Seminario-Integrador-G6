import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  formatearFrecuencia,
  calcularProximaFecha,
  listarPlanes,
  obtenerPlanPorId,
  crearPlan,
  actualizarPlan,
  darDeBajaPlan,
} = await import('../src/servicios/planesMantenimiento.servicio.js');

function consultaQueDevuelve(data, error = null) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    neq: jest.fn(() => cadena),
    gte: jest.fn(() => cadena),
    lte: jest.fn(() => cadena),
    ilike: jest.fn(() => cadena),
    or: jest.fn(() => cadena),
    in: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    update: jest.fn(() => cadena),
    delete: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    single: jest.fn().mockResolvedValue({ data, error }),
    then: (resolver, rechazar) => Promise.resolve({ data, error }).then(resolver, rechazar),
  };
  return cadena;
}

describe('Planes de Mantenimiento Preventivo - Servicio', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Cálculo de fechas y frecuencias', () => {
    test('formatea correctamente las frecuencias conocidas y personalizadas', () => {
      expect(formatearFrecuencia(1, 'meses')).toBe('Mensual');
      expect(formatearFrecuencia(2, 'meses')).toBe('Bimestral');
      expect(formatearFrecuencia(3, 'meses')).toBe('Trimestral');
      expect(formatearFrecuencia(6, 'meses')).toBe('Semestral');
      expect(formatearFrecuencia(1, 'anios')).toBe('Anual');
      expect(formatearFrecuencia(1, 'semanas')).toBe('Semanal');
      expect(formatearFrecuencia(1, 'dias')).toBe('Diario');
      expect(formatearFrecuencia(15, 'dias')).toBe('Cada 15 días');
      expect(formatearFrecuencia(4, 'meses')).toBe('Cuatrimestral');
      expect(formatearFrecuencia(2, 'semanas')).toBe('Quincenal');
      expect(formatearFrecuencia(5, 'meses')).toBe('Cada 5 meses');
    });

    test('calcula próxima fecha sumando días, semanas, meses y años', () => {
      expect(calcularProximaFecha('2026-10-01', 15, 'dias')).toBe('2026-10-16');
      expect(calcularProximaFecha('2026-10-01', 2, 'semanas')).toBe('2026-10-15');
      expect(calcularProximaFecha('2026-10-01', 6, 'meses')).toBe('2027-04-01');
      expect(calcularProximaFecha('2026-10-01', 1, 'anios')).toBe('2027-10-01');
    });

    test('maneja fin de mes y años bisiestos correctamente', () => {
      expect(calcularProximaFecha('2025-01-31', 1, 'meses')).toBe('2025-02-28');
      expect(calcularProximaFecha('2024-01-31', 1, 'meses')).toBe('2024-02-29');
      expect(calcularProximaFecha('2024-02-29', 1, 'anios')).toBe('2025-02-28');
      expect(calcularProximaFecha('2026-08-31', 1, 'meses')).toBe('2026-09-30');
    });
  });

  describe('Alta de plan (CA1, C1–C3, C5)', () => {
    const DATOS_VALIDOS = {
      nombre: 'Mantenimiento Semestral Aires',
      descripcion: 'Revisión periódica de gas y filtros',
      tipoActivoId: 1,
      intervalo: 6,
      unidadFrecuencia: 'meses',
      tareasIds: [10],
    };

    test('crea plan válido con sus tareas', async () => {
      const planCreadoFila = {
        mant_prev_id: 5,
        mant_prev_nom: 'Mantenimiento Semestral Aires',
        mant_prev_desc: 'Revisión periódica de gas y filtros',
        mant_prev_intervalo: 6,
        mant_prev_unidad_frec: 'meses',
        mant_prev_frec: 'Semestral',
        mant_prev_fecha_alta: '2026-11-03',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1, tipo_activo_nom: 'Aire Acondicionado' },
        mant_prev_tarea: [{ plantilla_de_tarea: { tarea_plan_id: 10, tarea_plan_nom: 'Limpieza' } }],
      };

      supabase.from.mockImplementation((tabla) => {
        if (tabla === 'mantenimiento_preventivo') {
          return consultaQueDevuelve(planCreadoFila);
        }
        if (tabla === 'tipo_activo') {
          return consultaQueDevuelve({ tipo_activo_id: 1 });
        }
        if (tabla === 'plantilla_de_tarea') {
          return consultaQueDevuelve([{ tarea_plan_id: 10 }]);
        }
        return consultaQueDevuelve(null);
      });

      // Primer select de unicidad retorna null (no repetido)
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // Tipo activo
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10 }])) // Tareas
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 5 })) // Insert plan
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert tareas
        .mockReturnValueOnce(consultaQueDevuelve(planCreadoFila)); // Detalle final

      const resultado = await crearPlan(DATOS_VALIDOS);

      expect(resultado.id).toBe(5);
      expect(resultado.nombre).toBe('Mantenimiento Semestral Aires');
      expect(resultado.frecuencia).toBe('Semestral');
      expect(resultado.tareas).toHaveLength(1);
    });

    test('guarda desde cuándo aplica el plan y no pide tipo ni próxima ejecución', async () => {
      const insercion = consultaQueDevuelve({ mant_prev_id: 8 });
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // Tipo activo
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10 }])) // Tareas
        .mockReturnValueOnce(insercion) // Insert plan
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert tareas
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 8, mant_prev_nom: 'X' })); // Detalle final

      await crearPlan(DATOS_VALIDOS);

      const fila = insercion.insert.mock.calls[0][0];
      expect(fila.mant_prev_fecha_alta).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(fila).not.toHaveProperty('mant_prev_tipo_mant');
      expect(fila).not.toHaveProperty('mant_prev_fecha_prox_gen');
    });


    test('no guarda técnicos: se asignan después en cada OT', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // Tipo activo
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10 }])) // Tareas
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 9 })) // Insert plan
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert tareas
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 9, mant_prev_nom: 'X' })); // Detalle final

      await crearPlan({ ...DATOS_VALIDOS, tecnicosLegajos: ['TEC-001'] });

      expect(supabase.from.mock.calls.map(([tabla]) => tabla)).not.toContain('mant_prev_tecnico');
    });

    test('rechaza si el nombre está vacío', async () => {
      await expect(crearPlan({ ...DATOS_VALIDOS, nombre: '   ' })).rejects.toThrow(
        'El nombre del plan es obligatorio.'
      );
    });

    test('rechaza si ya existe otro plan activo con el mismo nombre', async () => {
      supabase.from.mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 2 }));

      await expect(crearPlan(DATOS_VALIDOS)).rejects.toThrow(
        'Ya existe un plan de mantenimiento preventivo activo con el nombre'
      );
    });

    test('rechaza si el intervalo es menor o igual a 0', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null))
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 }));

      await expect(crearPlan({ ...DATOS_VALIDOS, intervalo: 0 })).rejects.toThrow(
        'El intervalo de frecuencia debe ser un número entero mayor a 0.'
      );
    });

    test('rechaza si no tiene tareas', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null))
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 }));

      await expect(crearPlan({ ...DATOS_VALIDOS, tareasIds: [] })).rejects.toThrow(
        'El plan debe incluir al menos una tarea.'
      );
    });

    test('rechaza si alguna tarea no existe', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null))
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 }))
        .mockReturnValueOnce(consultaQueDevuelve([]));

      await expect(crearPlan(DATOS_VALIDOS)).rejects.toThrow('Una o más tareas seleccionadas no existen.');
    });

  });

  describe('Modificación y baja lógica (CA6)', () => {
    test('modificar plan actualiza datos y no toca OTs existentes', async () => {
      const planInicial = {
        mant_prev_id: 1,
        mant_prev_nom: 'Plan Original',
        mant_prev_intervalo: 3,
        mant_prev_unidad_frec: 'meses',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1, tipo_activo_nom: 'Mobiliario' },
        mant_prev_tarea: [],
        orden_trabajo: [{ ot_id: 101, ot_desc: 'Plan Original' }],
      };

      const planActualizado = {
        ...planInicial,
        mant_prev_nom: 'Plan Actualizado',
        mant_prev_intervalo: 6,
        mant_prev_frec: 'Semestral',
      };

      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(planInicial)) // obtenerPlanPorId inicial
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad nuevo nombre
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Update
        .mockReturnValueOnce(consultaQueDevuelve(planActualizado)); // obtenerPlanPorId final

      const actualizado = await actualizarPlan(1, {
        nombre: 'Plan Actualizado',
        intervalo: 6,
      });

      expect(actualizado.nombre).toBe('Plan Actualizado');
      expect(actualizado.intervalo).toBe(6);
      expect(actualizado.ordenes).toHaveLength(1);
      expect(actualizado.ordenes[0].id).toBe(101);
    });

    test('baja lógica desactiva el plan y no borra OTs ya generadas', async () => {
      const planActivo = {
        mant_prev_id: 2,
        mant_prev_nom: 'Plan a dar de baja',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1 },
        mant_prev_tarea: [],
        orden_trabajo: [{ ot_id: 201 }],
      };

      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(planActivo))
        .mockReturnValueOnce(consultaQueDevuelve(null));

      const res = await darDeBajaPlan(2);
      expect(res.id).toBe(2);
      expect(res.mensaje).toContain('fue dado de baja correctamente');
      expect(res.mensaje).toContain('no se vieron afectadas');
    });

    test('rechaza dar de baja un plan que ya está inactivo', async () => {
      const planInactivo = {
        mant_prev_id: 2,
        mant_prev_nom: 'Plan Ya Inactivo',
        mant_prev_activo: false,
        tipo_activo: { tipo_activo_id: 1 },
        mant_prev_tarea: [],
      };

      supabase.from.mockReturnValueOnce(consultaQueDevuelve(planInactivo));

      await expect(darDeBajaPlan(2)).rejects.toThrow(
        'El plan de mantenimiento preventivo ya se encuentra dado de baja.'
      );
    });
  });
});
