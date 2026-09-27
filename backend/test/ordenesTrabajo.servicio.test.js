import { registrarFalla } from '../src/servicios/ordenesTrabajo.servicio.js';
import { supabase } from '../src/config/supabase.js';

jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

afterEach(() => {
  jest.clearAllMocks();
});

describe('registrarFalla', () => {
  test('rechaza un tipo que no está en la clasificación', async () => {
    await expect(
      registrarFalla(1, 1, { tipo: 'Térmica', descripcion: 'El equipo no enciende.' })
    ).rejects.toThrow('Elegí un tipo de falla válido:');

    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('rechaza una descripción vacía', async () => {
    await expect(
      registrarFalla(1, 1, { tipo: 'Eléctrica', descripcion: '   ' })
    ).rejects.toThrow('La descripción de la falla es obligatoria.');

    expect(supabase.from).not.toHaveBeenCalled();
  });
});