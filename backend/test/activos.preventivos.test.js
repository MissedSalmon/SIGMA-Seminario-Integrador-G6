/**
 * El alta de activos dispara la generación preventiva (03/11/2026).
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.unstable_mockModule('../src/servicios/programacionPreventiva.servicio.js', () => ({
  generarOtsPreventivas: jest.fn(),
}));

const { supabase } = await import('../src/config/supabase.js');
const { generarOtsPreventivas } = await import('../src/servicios/programacionPreventiva.servicio.js');
const { crear } = await import('../src/servicios/activos.servicio.js');

function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    ilike: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return cadena;
}

const ACTIVO_GUARDADO = {
  activo_codigo: 'AC-020',
  tipo_activo_id: 1,
  edificio_id: 1,
  espacio_id: 12,
  activo_fecha_alta: '2026-11-03',
  activo_estado: 1,
  tipo_activo: { tipo_activo_nom: 'Aires acondicionados' },
  espacio: { espacio_num: '1', edificio: { edificio_nom: 'Edificio A' } },
};

function prepararAlta() {
  supabase.from
    .mockReturnValueOnce(consultaQueDevuelve(null)) // código repetido
    .mockReturnValueOnce(consultaQueDevuelve({ tipo_activo_id: 1 })) // tipo existe
    .mockReturnValueOnce(consultaQueDevuelve({ edificio_id: 1 })) // edificio del espacio
    .mockReturnValueOnce(consultaQueDevuelve(ACTIVO_GUARDADO)); // insert
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('alta de activo y planes preventivos', () => {
  test('después de guardar el activo, corre la generación sólo para él', async () => {
    prepararAlta();
    generarOtsPreventivas.mockResolvedValue({ otsGeneradas: 0, detalles: [] });

    await crear({ codigo: 'AC-020', idTipoActivo: 1, espacio_id: 12 });

    expect(generarOtsPreventivas).toHaveBeenCalledWith({ codigoActivo: 'AC-020' });
  });

  test('si la generación falla, el alta igual se completa', async () => {
    prepararAlta();
    generarOtsPreventivas.mockRejectedValue(new Error('sin conexión'));
    const errorOriginal = console.error;
    console.error = jest.fn();

    const activo = await crear({ codigo: 'AC-020', idTipoActivo: 1, espacio_id: 12 });

    console.error = errorOriginal;
    expect(activo.codigo).toBe('AC-020');
  });
});
