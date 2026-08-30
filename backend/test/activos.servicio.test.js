/**
 * Pruebas del servicio de activos (HU-7).
 *
 * Se prueban las dos reglas que no son evidentes leyendo el codigo:
 * que el alta valide, y que cambiar de espacio deje registrada la fecha.
 */
import { crear, actualizar, darDeBaja } from '../src/servicios/activos.servicio.js';
import { supabase } from '../src/config/supabase.js';

jest.mock('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

/** Una fila de activo como la devuelve la base, para no repetirla en cada prueba. */
function filaActivo(cambios = {}) {
  return {
    activocodigo: 'AC-014',
    activodesc: 'Aire acondicionado',
    tipoactivoid: 1,
    edificioid: 1,
    espacionum: '12',
    activofechaalta: '2026-08-30',
    activofechainst: '2026-08-01',
    activofechaultmant: null,
    activofechaultreub: null,
    activoestado: 'Operativo',
    tipoactivo: { tipoactivonom: 'Aires acondicionados' },
    espacio: { espacionom: 'Aula 1', edificio: { edificionom: 'Edificio A' } },
    ...cambios,
  };
}

/** Arma la cadena select().eq()...maybeSingle() que usan los servicios. */
function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    ilike: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    single: jest.fn().mockResolvedValue({ data, error: null }),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('crear', () => {
  test('rechaza un activo sin codigo de inventario', async () => {
    await expect(crear({ codigo: '   ' })).rejects.toThrow(
      'El codigo de inventario es obligatorio.'
    );
  });

  test('rechaza un activo sin espacio', async () => {
    await expect(crear({ codigo: 'AC-014', idTipoActivo: 1 })).rejects.toThrow(
      'Hay que indicar en que espacio esta el activo.'
    );
  });

  test('rechaza un codigo que ya existe', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve({ activocodigo: 'AC-014' }));

    await expect(
      crear({ codigo: 'AC-014', idTipoActivo: 1, idEdificio: 1, espacioNum: '12' })
    ).rejects.toThrow('Ya hay un activo con el codigo "AC-014".');
  });
});

describe('actualizar', () => {
  test('anota la fecha de reubicacion cuando cambia el espacio', async () => {
    const update = jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: filaActivo({ espacionum: '20', activofechaultreub: '2026-08-30' }),
            error: null,
          }),
        })),
      })),
    }));

    // Sirve para obtenerPorId, para verificarTipo y para verificarEspacio.
    supabase.from.mockReturnValue({ ...consultaQueDevuelve(filaActivo()), update });

    const resultado = await actualizar('AC-014', {
      idTipoActivo: 1,
      idEdificio: 1,
      espacioNum: '20', // estaba en el 12
    });

    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({ activofechaultreub: expect.any(String) })
    );
    expect(resultado.fechaUltimaReubicacion).toBe('2026-08-30');
  });

  test('no toca la fecha de reubicacion si el espacio no cambia', async () => {
    const update = jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: filaActivo(), error: null }),
        })),
      })),
    }));

    supabase.from.mockReturnValue({ ...consultaQueDevuelve(filaActivo()), update });

    await actualizar('AC-014', { idTipoActivo: 1, idEdificio: 1, espacioNum: '12' });

    expect(update).toHaveBeenCalledWith(
      expect.not.objectContaining({ activofechaultreub: expect.anything() })
    );
  });

  test('no deja modificar un activo retirado', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(filaActivo({ activoestado: 'Retirado' })));

    await expect(
      actualizar('AC-014', { idTipoActivo: 1, idEdificio: 1, espacioNum: '12' })
    ).rejects.toThrow('esta retirado y no se puede modificar');
  });

  test('no deja poner a mano un estado automatico', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(filaActivo()));

    await expect(
      actualizar('AC-014', {
        idTipoActivo: 1,
        idEdificio: 1,
        espacioNum: '12',
        estado: 'En mantenimiento',
      })
    ).rejects.toThrow('no es un estado que se pueda poner a mano');
  });
});

describe('darDeBaja', () => {
  test('pasa el activo a Retirado en vez de borrarlo', async () => {
    const update = jest.fn(() => ({
      eq: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({
            data: filaActivo({ activoestado: 'Retirado' }),
            error: null,
          }),
        })),
      })),
    }));

    const eliminar = jest.fn();
    supabase.from.mockReturnValue({
      ...consultaQueDevuelve(filaActivo()),
      update,
      delete: eliminar,
    });

    const resultado = await darDeBaja('AC-014');

    expect(update).toHaveBeenCalledWith({ activoestado: 'Retirado' });
    expect(eliminar).not.toHaveBeenCalled();
    expect(resultado.estado).toBe('Retirado');
  });

  test('avisa si el activo ya estaba retirado', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(filaActivo({ activoestado: 'Retirado' })));

    await expect(darDeBaja('AC-014')).rejects.toThrow('ya estaba retirado');
  });
});
