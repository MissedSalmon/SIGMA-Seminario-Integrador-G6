import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerCargaTrabajo, obtenerTareasDeCarga } = await import('../src/servicios/tecnicos.servicio.js');

function filaTecnico(legajo, nombre, especialidad = 1) {
  return {
    tecnico_legajo: legajo,
    tecnico_nom_ape: nombre,
    tecnico_tel: null,
    tecnico_disponibilidad: true,
    tecnico_especialidad: [
      { especialidad_id: especialidad, especialidad: { especialidad_nom: 'Electricidad' } },
    ],
  };
}

function filaAsignacion({ legajo = '1001', idOt, idTarea = 1, estado, fecha = '2026-10-15' }) {
  return {
    tecnico_legajo: legajo,
    ot_id: idOt,
    tarea_id: idTarea,
    tec_asig_estado: 2,
    tarea_ot: {
      tarea_desc: `Tarea ${idOt}`,
      tarea_estado: estado,
      tarea_prioridad: 2,
      tarea_fecha_ini: fecha ? `${fecha}T00:00:00+00:00` : null,
      tarea_fecha_fin: null,
      orden_trabajo: { ot_id: idOt, ot_desc: `Orden ${idOt}` },
    },
  };
}

function consultaQueDevuelve(data) {
  const consulta = {
    select: jest.fn(() => consulta),
    order: jest.fn(() => consulta),
    neq: jest.fn(() => consulta),
    eq: jest.fn(() => consulta),
    then: (resolver, rechazar) => Promise.resolve({ data, error: null }).then(resolver, rechazar),
  };
  return consulta;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('carga de trabajo de técnicos', () => {
  test('cuenta tareas por estado y conserva técnicos sin asignaciones', async () => {
    const tecnicos = consultaQueDevuelve([
      filaTecnico('1001', 'Ana'),
      filaTecnico('1002', 'Bruno'),
    ]);
    const asignaciones = consultaQueDevuelve([
      filaAsignacion({ idOt: 1, estado: 1 }),
      filaAsignacion({ idOt: 2, estado: 3 }),
      filaAsignacion({ idOt: 3, estado: 5 }),
      filaAsignacion({ idOt: 4, estado: 6 }),
    ]);
    supabase.from.mockImplementation((tabla) =>
      tabla === 'tecnico' ? tecnicos : asignaciones
    );

    const carga = await obtenerCargaTrabajo();

    expect(supabase.from).toHaveBeenNthCalledWith(1, 'tecnico');
    expect(supabase.from).toHaveBeenNthCalledWith(2, 'tecnico_asignado_tarea_ot');
    expect(asignaciones.neq).toHaveBeenCalledWith('tec_asig_estado', 5);
    expect(carga).toEqual([
      expect.objectContaining({
        legajo: '1001',
        pendientes: 1,
        enEjecucion: 1,
        completadas: 1,
        cargaActiva: 2,
      }),
      expect.objectContaining({
        legajo: '1002',
        pendientes: 0,
        enEjecucion: 0,
        completadas: 0,
        cargaActiva: 0,
      }),
    ]);
  });

  test('aplica período por fecha prevista y devuelve el detalle de tareas', async () => {
    const asignaciones = consultaQueDevuelve([
      filaAsignacion({ idOt: 1, estado: 2, fecha: '2026-10-09' }),
      filaAsignacion({ idOt: 2, estado: 2, fecha: '2026-10-10' }),
      filaAsignacion({ idOt: 3, estado: 2, fecha: '2026-10-20' }),
      filaAsignacion({ idOt: 4, estado: 2, fecha: null }),
    ]);
    const tecnico = consultaQueDevuelve(filaTecnico('1001', 'Ana'));
    tecnico.single = jest.fn().mockResolvedValue({ data: filaTecnico('1001', 'Ana'), error: null });
    supabase.from.mockImplementation((tabla) =>
      tabla === 'tecnico' ? tecnico : asignaciones
    );

    const tareas = await obtenerTareasDeCarga('1001', { desde: '2026-10-10', hasta: '2026-10-20' });

    expect(asignaciones.eq).toHaveBeenCalledWith('tecnico_legajo', '1001');
    expect(tareas.map((tarea) => tarea.idOt)).toEqual([2, 3]);
    expect(tareas[0]).toEqual(expect.objectContaining({
      descripcion: 'Tarea 2',
      fechaInicio: '2026-10-10',
      orden: { id: 2, descripcion: 'Orden 2' },
    }));
  });
});
