import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn()
  }
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerTodos, crear, eliminar } = await import('../src/servicios/prestadores.servicio.js');

// Un CUIL con el digito verificador bien.
const CUIL_VALIDO = '20-34567883-3';

const FILA_PRESTADOR = {
  prestador_serv_id: 1,
  prestador_serv_nom: 'Frio Norte',
  prestador_serv_cuil: CUIL_VALIDO,
  prestador_serv_tel: '362 4123456',
  prestador_serv_email: null,
  prestador_serv_garantia: '6 meses',
  prestador_tipo_prestador: [
    { tipo_prestador_id: 2, tipo_prestador: { tipo_prestador_nom: 'Refrigeración' } },
    { tipo_prestador_id: 1, tipo_prestador: { tipo_prestador_nom: 'Electricidad' } },
  ],
};

const DATOS_VALIDOS = { nombre: 'Frio Norte', cuil: CUIL_VALIDO, tipos: [1] };

describe('Prestadores Servicio', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('obtenerTodos mapea los tipos y filtra por tipo', async () => {
    const otro = { ...FILA_PRESTADOR, prestador_serv_id: 2, prestador_tipo_prestador: [] };
    const order = jest.fn().mockResolvedValue({ data: [FILA_PRESTADOR, otro], error: null });
    supabase.from.mockReturnValue({ select: jest.fn().mockReturnValue({ order }) });

    const todos = await obtenerTodos();
    expect(todos).toHaveLength(2);
    expect(todos[0]).toEqual({
      idPrestador: 1,
      nombre: 'Frio Norte',
      cuil: CUIL_VALIDO,
      telefono: '362 4123456',
      email: '',
      garantia: '6 meses',
      tipos: [
        { idTipoPrestador: 1, nombre: 'Electricidad' },
        { idTipoPrestador: 2, nombre: 'Refrigeración' },
      ],
    });

    const filtrados = await obtenerTodos({ idTipoPrestador: '2' });
    expect(filtrados.map((prestador) => prestador.idPrestador)).toEqual([1]);
  });

  test('crear exige el nombre', async () => {
    await expect(crear({ ...DATOS_VALIDOS, nombre: '  ' })).rejects.toThrow(
      'El nombre del prestador es obligatorio.'
    );
  });

  test('crear exige un CUIL valido', async () => {
    await expect(crear({ ...DATOS_VALIDOS, cuil: '' })).rejects.toThrow('El CUIL del prestador es obligatorio.');
    await expect(crear({ ...DATOS_VALIDOS, cuil: '20-34567883-4' })).rejects.toThrow('dígito verificador');
  });

  test('crear rechaza un email mal escrito', async () => {
    await expect(crear({ ...DATOS_VALIDOS, email: 'juan@' })).rejects.toThrow('El email no es válido.');
  });

  test('crear exige al menos un tipo', async () => {
    await expect(crear({ ...DATOS_VALIDOS, tipos: [] })).rejects.toThrow(
      'Hay que elegir al menos un tipo de prestador.'
    );
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('eliminar no deja borrar un prestador con tareas asignadas', async () => {
    const maybeSingle = jest.fn().mockResolvedValue({ data: FILA_PRESTADOR, error: null });
    const borrar = jest.fn();

    supabase.from.mockImplementation((tabla) => {
      if (tabla === 'tarea_ot') {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({ count: 3, error: null }),
          }),
        };
      }
      return {
        select: jest.fn().mockReturnValue({ eq: jest.fn().mockReturnValue({ maybeSingle }) }),
        delete: borrar,
      };
    });

    await expect(eliminar(1)).rejects.toMatchObject({
      estado: 409,
      message: 'No se puede eliminar "Frio Norte" porque tiene 3 tareas asignadas.',
    });
    expect(borrar).not.toHaveBeenCalled();
  });
});
