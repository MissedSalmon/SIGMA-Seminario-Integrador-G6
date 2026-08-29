import { obtenerTodos, crear, eliminar } from '../src/servicios/tiposActivos.servicio.js';
import { supabase } from '../src/config/supabase.js';

jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn()
  }
}));

describe('Tipos Activos Servicio', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('obtenerTodos debe retornar lista mapeada', async () => {
    const mockData = [{ tipoactivoid: 1, tipoactivonom: 'A', tipoactivodesc: 'Desc A', activo: [{ count: 5 }] }];
    const selectMock = jest.fn().mockReturnValue({ order: jest.fn().mockResolvedValue({ data: mockData, error: null }) });
    supabase.from.mockReturnValue({ select: selectMock });

    const resultado = await obtenerTodos();
    expect(resultado).toEqual([
      { idTipoActivo: 1, nombre: 'A', descripcion: 'Desc A', cantidadActivos: 5 }
    ]);
  });

  test('crear debe tirar error si no hay nombre', async () => {
    await expect(crear({ nombre: '' })).rejects.toThrow('El nombre del tipo de activo es obligatorio.');
  });
});
