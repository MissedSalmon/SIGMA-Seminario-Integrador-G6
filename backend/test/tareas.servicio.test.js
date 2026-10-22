/**
 * Pruebas del servicio de tareas del tecnico (HU-21).
 *
 * Cada prueba sigue un criterio de aceptacion de la HU: que el tecnico vea
 * solo lo suyo, que los filtros funcionen, el orden por defecto, que el
 * detalle traiga activo, ubicacion y OT, y la cantidad de pendientes.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerDelTecnico, obtenerUnaDelTecnico } = await import('../src/servicios/tareas.servicio.js');

/**
 * Una asignacion como la devuelve la base. Los estados y la prioridad vienen
 * como numero (datos enumerados): tarea 2 = Asignada, prioridad 2 = Media,
 * OT 1 = Creada.
 */
function filaAsignacion({ idOt = 1, idTarea = 1, estado = 2, prioridad = 2, fecha = '2026-10-15', ...cambios } = {}) {
  return {
    ot_id: idOt,
    tarea_id: idTarea,
    tec_asig_estado: 2,
    tarea_ot: {
      tarea_id: idTarea,
      tarea_desc: `Tarea ${idOt}-${idTarea}`,
      tarea_estado: estado,
      tarea_prioridad: prioridad,
      tarea_fecha_ini: fecha ? `${fecha}T00:00:00+00:00` : null,
      tarea_fecha_fin: null,
      orden_trabajo: {
        ot_id: idOt,
        ot_desc: 'Pierde agua',
        ot_estado: 1,
        ticket: {
          ticket_id: 3,
          activo: {
            activo_codigo: 'AC-001',
            activo_desc: null,
            tipo_activo: { tipo_activo_nom: 'Aires acondicionados' },
            espacio: {
              espacio_num: '11',
              espacio_piso: '2',
              tipo_espacio: { tipo_espacio_nom: 'Aula' },
              edificio: { edificio_nom: 'Edificio central' },
            },
          },
        },
        mantenimiento_preventivo: null,
      },
    },
    ...cambios,
  };
}

/** La cadena select().eq().neq()... que usa el servicio. Al hacerle await resuelve con los datos. */
function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    neq: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    then: (resolver, rechazar) => Promise.resolve({ data, error: null }).then(resolver, rechazar),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('obtenerDelTecnico', () => {
  test('busca solo las asignaciones del legajo de la sesion, sin las canceladas', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerDelTecnico('2030');

    expect(supabase.from).toHaveBeenCalledWith('tecnico_asignado_tarea_ot');
    expect(consulta.eq).toHaveBeenCalledWith('tecnico_legajo', '2030');
    expect(consulta.neq).toHaveBeenCalledWith('tec_asig_estado', 5); // 5 = Cancelada
  });

  test('ordena por creacion: numero de OT y, dentro de la OT, numero de tarea', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([
        filaAsignacion({ idOt: 5, idTarea: 1, prioridad: 1, fecha: '2026-10-01' }),
        filaAsignacion({ idOt: 2, idTarea: 2, prioridad: 3, fecha: null }),
        filaAsignacion({ idOt: 4, idTarea: 1, prioridad: 2, fecha: '2026-10-20' }),
        filaAsignacion({ idOt: 2, idTarea: 1, prioridad: 1, fecha: '2026-10-05' }),
      ])
    );

    const { tareas } = await obtenerDelTecnico('2030');

    expect(tareas.map((tarea) => `${tarea.idOt}-${tarea.idTarea}`)).toEqual(['2-1', '2-2', '4-1', '5-1']);
  });

  test('con soloPendientes deja afuera las finalizadas y canceladas', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([
        filaAsignacion({ idOt: 1, estado: 2 }), // Asignada
        filaAsignacion({ idOt: 2, estado: 3 }), // En ejecución
        filaAsignacion({ idOt: 3, estado: 5 }), // Finalizada
        filaAsignacion({ idOt: 4, estado: 6 }), // Cancelada
      ])
    );

    const { tareas } = await obtenerDelTecnico('2030', { soloPendientes: true });

    expect(tareas.map((tarea) => tarea.idOt)).toEqual([1, 2]);
  });

  test('filtra por prioridad', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([filaAsignacion({ idOt: 1, prioridad: 1 }), filaAsignacion({ idOt: 2, prioridad: 3 })])
    );

    const { tareas } = await obtenerDelTecnico('2030', { prioridad: 'Alta' });

    expect(tareas.map((tarea) => tarea.idOt)).toEqual([1]);
  });

  test('filtra por fecha prevista de inicio, con los dos extremos incluidos', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([
        filaAsignacion({ idOt: 1, fecha: '2026-09-30' }),
        filaAsignacion({ idOt: 2, fecha: '2026-10-01' }),
        filaAsignacion({ idOt: 3, fecha: '2026-10-31' }),
        filaAsignacion({ idOt: 4, fecha: '2026-11-01' }),
        filaAsignacion({ idOt: 5, fecha: null }),
      ])
    );

    const { tareas } = await obtenerDelTecnico('2030', { desde: '2026-10-01', hasta: '2026-10-31' });

    expect(tareas.map((tarea) => tarea.idOt)).toEqual([2, 3]);
  });

  test('cuenta como pendientes las que no estan finalizadas ni canceladas, sin mirar los filtros', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([
        filaAsignacion({ idOt: 1, estado: 2, prioridad: 1 }), // Asignada
        filaAsignacion({ idOt: 2, estado: 3, prioridad: 3 }), // En ejecución
        filaAsignacion({ idOt: 3, estado: 5, prioridad: 3 }), // Finalizada
        filaAsignacion({ idOt: 4, estado: 6, prioridad: 3 }), // Cancelada
      ])
    );

    const { tareas, pendientes } = await obtenerDelTecnico('2030', { prioridad: 'Alta' });

    expect(tareas).toHaveLength(1);
    expect(pendientes).toBe(2);
  });

  test('devuelve el estado y la prioridad como texto, no como numero', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve([filaAsignacion({ estado: 3, prioridad: 1 })]));

    const { tareas } = await obtenerDelTecnico('2030');

    expect(tareas[0]).toMatchObject({ estado: 'En ejecución', prioridad: 'Alta', pendiente: true });
  });
});

describe('obtenerUnaDelTecnico', () => {
  test('trae la descripcion, el activo, la ubicacion, la OT y los materiales usados', async () => {
    supabase.from
      .mockReturnValueOnce(consultaQueDevuelve(filaAsignacion({ idOt: 9, idTarea: 5 })))
      .mockReturnValueOnce(
        consultaQueDevuelve([
          { mat_cod: 'MAT-002', tamat_cant: 4, tamat_fecha_cons: '2026-10-10T12:00:00+00:00', material: { mat_nom: 'Tornillo' } },
        ])
      ).mockReturnValueOnce(consultaQueDevuelve([
        {
          observacion_id: 1, ot_id: 9, tarea_id: 5, usuario_id: 'usuario-tecnico',
          observacion_texto: 'Se limpió el filtro', observacion_autor_nombre: 'Ana Pérez',
          observacion_fecha: '2026-10-13T12:00:00Z',
        },
      ]));

    const tarea = await obtenerUnaDelTecnico('2030', 9, 5);

    expect(tarea).toMatchObject({
      idOt: 9,
      idTarea: 5,
      descripcion: 'Tarea 9-5',
      fechaPrevista: '2026-10-15',
      activo: { codigo: 'AC-001', nombreTipo: 'Aires acondicionados' },
      ubicacion: { edificio: 'Edificio central', espacio: 'Aula 11', piso: '2' },
      ot: { id: 9, descripcion: 'Pierde agua', estado: 'Creada', origen: 'Ticket' },
      materiales: [{ codigo: 'MAT-002', nombre: 'Tornillo', cantidad: 4 }],
      observaciones: [{ id: 1, texto: 'Se limpió el filtro', autor: 'Ana Pérez', fecha: '2026-10-13T12:00:00Z' }],
    });
  });

  test('pide la tarea solo entre las del legajo de la sesion', async () => {
    const consulta = consultaQueDevuelve(filaAsignacion());
    supabase.from.mockReturnValueOnce(consulta).mockReturnValueOnce(consultaQueDevuelve([]))
      .mockReturnValueOnce(consultaQueDevuelve([]));

    await obtenerUnaDelTecnico('2030', 1, 1);

    expect(consulta.eq).toHaveBeenCalledWith('tecnico_legajo', '2030');
    expect(consulta.eq).toHaveBeenCalledWith('ot_id', 1);
    expect(consulta.eq).toHaveBeenCalledWith('tarea_id', 1);
  });

  test('una tarea que no tiene asignada (aunque exista) responde 404', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null));

    await expect(obtenerUnaDelTecnico('2030', 3, 1)).rejects.toMatchObject({ estado: 404 });
  });
});
