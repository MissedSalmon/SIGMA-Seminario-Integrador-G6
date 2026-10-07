import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerTodos, crear, eliminar } = await import('../src/servicios/tiposActivos.servicio.js');

describe('Tipos Activos Servicio', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('obtenerTodos debe retornar lista mapeada', async () => {
    const mockData = [{ tipo_activo_id: 1, tipo_activo_nom: 'A', activo: [{ count: 5 }] }];
    const selectMock = jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: mockData, error: null }) });
    supabase.from.mockReturnValue({ select: selectMock });

    const resultado = await obtenerTodos();
    expect(resultado).toEqual([
      { idTipoActivo: 1, nombre: 'A', cantidadActivos: 5 }
    ]);
  });

  test('crear debe tirar error si no hay nombre', async () => {
    await expect(crear({ nombre: '' })).rejects.toThrow('El nombre del tipo de activo es obligatorio.');
  });
});
