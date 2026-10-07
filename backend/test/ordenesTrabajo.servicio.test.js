import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  crearTipoFalla,
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