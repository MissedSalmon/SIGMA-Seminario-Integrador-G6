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
  obtenerPlanesPorVencer,
  procesarGeneracionAutomatica,
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
      expect(formatearFrecuencia(4, 'meses')).toBe('Cada 4 meses');
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
      tipoMantenimiento: 'Preventivo',
      tipoActivoId: 1,
      intervalo: 6,
      unidadFrecuencia: 'meses',
      fechaProximaGeneracion: '2026-11-01',
      tareasIds: [10],
      tecnicosLegajos: ['TEC-001'],
    };

    test('crea plan válido con tareas y técnicos', async () => {
      const planCreadoFila = {
        mant_prev_id: 5,
        mant_prev_nom: 'Mantenimiento Semestral Aires',
        mant_prev_desc: 'Revisión periódica de gas y filtros',
        mant_prev_tipo_mant: 'Preventivo',
        mant_prev_intervalo: 6,
        mant_prev_unidad_frec: 'meses',
        mant_prev_frec: 'Semestral',
        mant_prev_fecha_prox_gen: '2026-11-01',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1, tipo_activo_nom: 'Aire Acondicionado' },
        mant_prev_tarea: [{ plantilla_de_tarea: { tarea_plan_id: 10, tarea_plan_nom: 'Limpieza' } }],
        mant_prev_tecnico: [{ tecnico: { tecnico_legajo: 'TEC-001', tecnico_nom_ape: 'Juan Pérez' } }],
      };

      supabase.from.mockImplementation((tabla) => {
        if (tabla === 'mantenimiento_preventivo') {
          return consultaQueDevuelve(planCreadoFila);
        }
        if (tabla === 'tipo_activo') {
          return consultaQueDevuelve({ tipo_activo_id: 1 });
        }
        if (tabla === 'plantilla_de_tarea') {
          return consultaQueDevuelve([{ tarea_plan_id: 10, tipo_activo_id: 1 }]);
        }
        if (tabla === 'tecnico') {
          return consultaQueDevuelve([{ tecnico_legajo: 'TEC-001', tecnico_disponibilidad: true }]);
        }
        return consultaQueDevuelve(null);
      });

      // Primer select de unicidad retorna null (no repetido)
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // Tipo activo
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10, tipo_activo_id: 1 }])) // Tareas
        .mockReturnValueOnce(consultaQueDevuelve([{ tecnico_legajo: 'TEC-001' }])) // Técnicos
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 5 })) // Insert plan
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert tareas
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert técnicos
        .mockReturnValueOnce(consultaQueDevuelve(planCreadoFila)); // Detalle final

      const resultado = await crearPlan(DATOS_VALIDOS);

      expect(resultado.id).toBe(5);
      expect(resultado.nombre).toBe('Mantenimiento Semestral Aires');
      expect(resultado.frecuencia).toBe('Semestral');
      expect(resultado.tieneTecnico).toBe(true);
      expect(resultado.tareas).toHaveLength(1);
    });

    test('crea plan sin técnicos correctamente (C5)', async () => {
      const planSinTecnicoFila = {
        mant_prev_id: 6,
        mant_prev_nom: 'Mantenimiento Semestral Aires',
        mant_prev_intervalo: 6,
        mant_prev_unidad_frec: 'meses',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1, tipo_activo_nom: 'Aire Acondicionado' },
        mant_prev_tarea: [{ plantilla_de_tarea: { tarea_plan_id: 10, tarea_plan_nom: 'Limpieza' } }],
        mant_prev_tecnico: [],
      };

      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Unicidad
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // Tipo activo
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10, tipo_activo_id: 1 }])) // Tareas
        .mockReturnValueOnce(consultaQueDevuelve({ mant_prev_id: 6 })) // Insert plan
        .mockReturnValueOnce(consultaQueDevuelve(null)) // Insert tareas
        .mockReturnValueOnce(consultaQueDevuelve(planSinTecnicoFila)); // Detalle final

      const resultado = await crearPlan({ ...DATOS_VALIDOS, tecnicosLegajos: [] });
      expect(resultado.id).toBe(6);
      expect(resultado.tieneTecnico).toBe(false);
      expect(resultado.tecnicos).toEqual([]);
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

    test('rechaza si la tarea no pertenece al tipo de activo', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null))
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 }))
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10, tipo_activo_id: 99 }]));

      await expect(crearPlan(DATOS_VALIDOS)).rejects.toThrow(
        'Una o más tareas seleccionadas no existen o no corresponden al tipo de activo indicado.'
      );
    });

    test('rechaza si se indica un técnico que no existe', async () => {
      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve(null))
        .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 }))
        .mockReturnValueOnce(consultaQueDevuelve([{ tarea_plan_id: 10, tipo_activo_id: 1 }]))
        .mockReturnValueOnce(consultaQueDevuelve([])); // Técnicos vacíos

      await expect(crearPlan(DATOS_VALIDOS)).rejects.toThrow(
        'Uno o más técnicos indicados no existen.'
      );
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
        mant_prev_tecnico: [],
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
        mant_prev_tecnico: [],
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
        mant_prev_tecnico: [],
      };

      supabase.from.mockReturnValueOnce(consultaQueDevuelve(planInactivo));

      await expect(darDeBajaPlan(2)).rejects.toThrow(
        'El plan de mantenimiento preventivo ya se encuentra dado de baja.'
      );
    });
  });

  describe('Aviso de vencimiento (CA5)', () => {
    test('devuelve planes por vencer dentro de 7 días y advierte falta de técnicos', async () => {
      const hoy = '2026-10-26';

      const planesMock = [
        {
          mant_prev_id: 1,
          mant_prev_nom: 'Plan Aire 1',
          mant_prev_fecha_prox_gen: '2026-10-28',
          mant_prev_activo: true,
          tipo_activo: { tipo_activo_id: 1, tipo_activo_nom: 'Aire' },
          mant_prev_tarea: [],
          mant_prev_tecnico: [{ tecnico: { tecnico_legajo: 'TEC-01', tecnico_nom_ape: 'Carlos' } }],
        },
        {
          mant_prev_id: 2,
          mant_prev_nom: 'Plan Iluminación',
          mant_prev_fecha_prox_gen: '2026-11-01',
          mant_prev_activo: true,
          tipo_activo: { tipo_activo_id: 2, tipo_activo_nom: 'Luminaria' },
          mant_prev_tarea: [],
          mant_prev_tecnico: [], // Sin técnico
        },
      ];

      supabase.from.mockReturnValueOnce(consultaQueDevuelve(planesMock));

      const lista = await obtenerPlanesPorVencer(7, hoy);

      expect(lista).toHaveLength(2);
      expect(lista[0].id).toBe(1);
      expect(lista[0].diasRestantes).toBe(2);
      expect(lista[0].tieneTecnico).toBe(true);
      expect(lista[0].advertencia).toBeNull();

      expect(lista[1].id).toBe(2);
      expect(lista[1].diasRestantes).toBe(6);
      expect(lista[1].tieneTecnico).toBe(false);
      expect(lista[1].advertencia).toContain('No tiene técnicos asignados');
    });
  });

  describe('Generación automática (CA3, CA4, C7, D4, C8)', () => {
    test('genera una OT por activo con ticket nulo e idempotencia', async () => {
      const fechaCorte = '2026-10-26';

      const planListo = {
        mant_prev_id: 10,
        mant_prev_nom: 'Mantenimiento Preventivo AACC',
        mant_prev_intervalo: 6,
        mant_prev_unidad_frec: 'meses',
        mant_prev_fecha_prox_gen: '2026-10-26',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 3, tipo_activo_nom: 'Aire' },
        mant_prev_tarea: [
          {
            plantilla_de_tarea: {
              tarea_plan_id: 101,
              tarea_plan_nom: 'Limpieza unidad exterior',
              tarea_plan_desc: 'Lavar serpentina',
            },
          },
        ],
        mant_prev_tecnico: [{ tecnico: { tecnico_legajo: 'TEC-1' } }],
      };

      supabase.from
        .mockReturnValueOnce(consultaQueDevuelve([planListo])) // 1. Buscar planes activos
        .mockReturnValueOnce(
          consultaQueDevuelve([
            { activo_codigo: 'AC-01', activo_estado: 1 },
            { activo_codigo: 'AC-02', activo_estado: 1 },
          ])
        ) // 2. Activos
        .mockReturnValueOnce(consultaQueDevuelve(null)) // 3. Idempotencia AC-01 (no existe)
        .mockReturnValueOnce(consultaQueDevuelve({ ot_id: 501 })) // 4. Insert OT AC-01
        .mockReturnValueOnce(consultaQueDevuelve({ tarea_id: 1 })) // 5. Insert tarea AC-01
        .mockReturnValueOnce(consultaQueDevuelve(null)) // 6. Insert tecnico AC-01
        .mockReturnValueOnce(consultaQueDevuelve({ ot_id: 499 })) // 7. Idempotencia AC-02 (ya existe)
        .mockReturnValueOnce(consultaQueDevuelve(null)); // 8. Update próxima fecha plan

      const resultado = await procesarGeneracionAutomatica(fechaCorte);

      expect(resultado.planesGenerados).toBe(1);
      expect(resultado.otsGeneradas).toBe(1); // AC-01 creada, AC-02 omitida por ya existir
      expect(resultado.detalles[0].proximaFecha).toBe('2027-04-26');
    });

    test('si el plan no tiene técnicos asignados, se posterga la generación (C7, D4)', async () => {
      const planSinTecnico = {
        mant_prev_id: 20,
        mant_prev_nom: 'Plan Sin Técnicos',
        mant_prev_fecha_prox_gen: '2026-10-26',
        mant_prev_activo: true,
        tipo_activo: { tipo_activo_id: 1 },
        mant_prev_tarea: [{ plantilla_de_tarea: { tarea_plan_id: 10 } }],
        mant_prev_tecnico: [],
      };

      supabase.from.mockReturnValueOnce(consultaQueDevuelve([planSinTecnico]));

      const resultado = await procesarGeneracionAutomatica('2026-10-26');

      expect(resultado.planesGenerados).toBe(0);
      expect(resultado.planesPostergadosSinTecnico).toBe(1);
      expect(resultado.otsGeneradas).toBe(0);
      expect(resultado.detalles[0].estado).toBe('postergado');
      expect(resultado.detalles[0].motivo).toContain('no tiene técnico autorizado');
    });
  });
});
