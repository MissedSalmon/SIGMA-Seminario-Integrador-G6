import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { crear, obtenerTodas } = await import('../src/servicios/plantillasTareas.servicio.js');

/** Una consulta encadenable que termina devolviendo `resultado`. */
function consulta(resultado) {
  const cadena = {
    select: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    single: jest.fn(() => Promise.resolve(resultado)),
    maybeSingle: jest.fn(() => Promise.resolve(resultado)),
    then: (alResolver, alRechazar) => Promise.resolve(resultado).then(alResolver, alRechazar),
  };
  return cadena;
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('crear', () => {
  test('exige la especialidad', async () => {
    await expect(crear({ descripcion: 'Limpiar filtros' })).rejects.toThrow('La especialidad es obligatoria.');
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('rechaza una especialidad que no existe', async () => {
    supabase.from.mockReturnValueOnce(consulta({ data: null, error: null }));

    await expect(crear({ descripcion: 'Limpiar filtros', idEspecialidad: 99 })).rejects.toThrow(
      'La especialidad elegida no existe.'
    );
  });

  test('guarda la plantilla con su especialidad', async () => {
    const insercion = consulta({
      data: {
        tarea_plan_id: 5,
        tarea_plan_nom: 'Limpiar filtros',
        especialidad_id: 7,
        especialidad: { especialidad_nom: 'Refrigeración' },
      },
      error: null,
    });
    supabase.from
      .mockReturnValueOnce(consulta({ data: { especialidad_id: 7 }, error: null }))
      .mockReturnValueOnce(insercion);

    const plantilla = await crear({ descripcion: ' Limpiar filtros ', idEspecialidad: '7' });

    expect(insercion.insert).toHaveBeenCalledWith(
      expect.objectContaining({ especialidad_id: 7, tarea_plan_nom: 'Limpiar filtros' })
    );
    expect(plantilla).toEqual({
      idPlantilla: 5,
      idEspecialidad: 7,
      nombreEspecialidad: 'Refrigeración',
      descripcion: 'Limpiar filtros',
    });
  });
});

describe('obtenerTodas', () => {
  test('filtra por especialidad', async () => {
    const lectura = consulta({ data: [], error: null });
    supabase.from.mockReturnValueOnce(lectura);

    await obtenerTodas('7');

    expect(lectura.eq).toHaveBeenCalledWith('especialidad_id', '7');
  });
});
