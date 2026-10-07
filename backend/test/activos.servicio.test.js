/**
 * Pruebas del servicio de activos (HU-7).
 *
 * Se prueban las reglas de negocio que no son evidentes leyendo el codigo:
 * validaciones del alta, restricciones de actualización, y baja lógica.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { crear, actualizar, darDeBaja } = await import('../src/servicios/activos.servicio.js');

/** Una fila de activo como la devuelve la base, para no repetirla en cada prueba. */
function filaActivo(cambios = {}) {
  return {
    activo_codigo: 'AC-014',
    tipo_activo_id: 1,
    edificio_id: 1,
    espacio_id: 12,
    activo_fecha_alta: '2026-08-30',
    activo_fecha_baja: null,
    activo_fecha_ult_maint: null,
    activo_estado: 'Operativo',
    tipo_activo: { tipo_activo_nom: 'Aires acondicionados' },
    espacio: { espacio_num: '1', edificio: { edificio_nom: 'Edificio A' } },
    ...cambios,
  };
}

/** Arma una cadena de Supabase encadenable con los métodos más comunes. */
function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    neq: jest.fn(() => cadena),
    ilike: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    update: jest.fn(() => cadena),
    delete: jest.fn(() => cadena),
    in: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('crear', () => {
  test('rechaza un activo sin código de inventario', async () => {
    await expect(crear({ codigo: '   ' })).rejects.toThrow(
      'El código de inventario es obligatorio.'
    );
  });

  test('rechaza un activo sin espacio', async () => {
    await expect(crear({ codigo: 'AC-014', idTipoActivo: 1 })).rejects.toThrow(
      'Hay que indicar en qué espacio está el activo.'
    );
  });

  test('rechaza un código que ya existe', async () => {
    // El servicio ahora usa espacio_id (no idEdificio + espacioNum)
    // Para llegar a la validación de duplicado, hay que pasar la validación de ubicación.
    // obtenerPorId (ilike) devuelve que ya existe AC-014
    supabase.from.mockReturnValue(consultaQueDevuelve({ activo_codigo: 'AC-014' }));

    await expect(
      crear({ codigo: 'AC-014', idTipoActivo: 1, espacio_id: 12 })
    ).rejects.toThrow('Ya hay un activo con el código "AC-014".');
  });
});

describe('actualizar', () => {
  test('no deja modificar un activo retirado', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve(filaActivo({ activo_estado: 'Retirado' }))
    );

    await expect(
      actualizar('AC-014', { idTipoActivo: 1, espacio_id: 12 })
    ).rejects.toThrow('está retirado y no se puede modificar');
  });

  test('no deja poner a mano un estado automático', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(filaActivo()));

    await expect(
      actualizar('AC-014', {
        idTipoActivo: 1,
        espacio_id: 12,
        estado: 'En mantenimiento',
      })
    ).rejects.toThrow('no es un estado que se pueda poner a mano');
  });
});

describe('darDeBaja', () => {
  test('pasa el activo a Retirado en vez de borrarlo', async () => {
    const cadenaUpdate = consultaQueDevuelve(
      filaActivo({ activo_estado: 'Retirado' })
    );

    // Primera llamada: obtenerPorId (select...maybeSingle)
    // Segunda llamada: update (la cadena de update)
    supabase.from
      .mockReturnValueOnce(consultaQueDevuelve(filaActivo()))   // obtenerPorId
      .mockReturnValueOnce(cadenaUpdate);                        // update

    const resultado = await darDeBaja('AC-014');

    expect(cadenaUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        activo_estado: 'Retirado',
        activo_fecha_baja: expect.any(String),
      })
    );
    expect(cadenaUpdate.delete).not.toHaveBeenCalled();
    expect(resultado.estado).toBe('Retirado');
  });

  test('avisa si el activo ya estaba retirado', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve(filaActivo({ activo_estado: 'Retirado' }))
    );

    await expect(darDeBaja('AC-014')).rejects.toThrow('ya estaba retirado');
  });
});
