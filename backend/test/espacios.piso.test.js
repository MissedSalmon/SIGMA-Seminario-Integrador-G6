/**
 * El piso de un espacio se guarda como número: 0 planta baja, 1 1er piso,
 * 2 2do piso (19/11/2026). Cualquier otro valor se rechaza antes de ir a la base.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { crear, actualizar } = await import('../src/servicios/espacios.servicio.js');

/** Una consulta que devuelve la misma fila en cualquier paso de la cadena. */
function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    update: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('piso del espacio', () => {
  test('rechaza un piso escrito como texto', async () => {
    await expect(
      crear({ idEdificio: 1, numero: '1.1', idTipoEspacio: 2, piso: 'Planta baja' })
    ).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('rechaza un piso que no está en la lista', async () => {
    await expect(actualizar(3, { piso: '5', idTipoEspacio: 2 })).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('guarda el número del piso, también si llega como número', async () => {
    const consulta = consultaQueDevuelve({ espacio_id: 3 });
    supabase.from.mockReturnValue(consulta);

    await actualizar(3, { piso: 0, idTipoEspacio: 2 });

    expect(consulta.update).toHaveBeenCalledWith(expect.objectContaining({ espacio_piso: '0' }));
  });

  test('el piso puede quedar vacío', async () => {
    const consulta = consultaQueDevuelve({ espacio_id: 3 });
    supabase.from.mockReturnValue(consulta);

    await actualizar(3, { piso: '', idTipoEspacio: 2 });

    expect(consulta.update).toHaveBeenCalledWith(expect.objectContaining({ espacio_piso: null }));
  });
});
