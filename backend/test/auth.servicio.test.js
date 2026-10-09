/**
 * Pruebas unitarias del servicio de autenticación (HU-30).
 *
 * Cubre:
 * 1. Validación de credenciales (usuario correcto, contraseña errónea, usuario inexistente, usuario inactivo).
 * 2. Obtención de perfil según rol (administrador, técnico, autorizado).
 * 3. Cambio de contraseña (actualización de hash y flag require_password_change).
 */
import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  validarCredenciales,
  obtenerPerfil,
  cambiarPassword,
} = await import('../src/servicios/auth.servicio.js');

/** Genera una cadena encadenable simulando la API de Supabase. */
function consultaQueDevuelve(data, error = null) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    single: jest.fn().mockResolvedValue({ data, error }),
    update: jest.fn(() => cadena),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('validarCredenciales', () => {
  test('devuelve los datos del usuario cuando el identificador y contraseña son correctos', async () => {
    const passwordHash = await bcrypt.hash('clave123', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      identificador: '12345',
      password_hash: passwordHash,
      rol: 'tecnico',
      require_password_change: false,
      activo: true,
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(usuarioMock));

    const resultado = await validarCredenciales('12345', 'clave123');

    expect(resultado).toEqual({
      usuarioId: 'usr-001',
      identificador: '12345',
      rol: 'tecnico',
      requirePasswordChange: false,
    });
  });

  test('devuelve null si la contraseña no coincide', async () => {
    const passwordHash = await bcrypt.hash('otraClave', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      identificador: '12345',
      password_hash: passwordHash,
      rol: 'tecnico',
      require_password_change: false,
      activo: true,
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(usuarioMock));

    const resultado = await validarCredenciales('12345', 'claveErronea');
    expect(resultado).toBeNull();
  });

  test('devuelve null si el usuario no existe en la base de datos', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null, { message: 'No rows found' }));

    const resultado = await validarCredenciales('inexistente', 'clave123');
    expect(resultado).toBeNull();
  });

  test('devuelve null si el usuario está inactivo', async () => {
    // La consulta filtra por .eq('activo', true), por lo que si está inactivo devuelve error/null
    supabase.from.mockReturnValue(consultaQueDevuelve(null, { message: 'No rows found' }));

    const resultado = await validarCredenciales('usuarioInactivo', 'clave123');
    expect(resultado).toBeNull();
  });

  test('rechaza o devuelve null si faltan identificador o contraseña', async () => {
    const res1 = await validarCredenciales('', 'clave');
    const res2 = await validarCredenciales('usuario', '');
    expect(res1).toBeNull();
    expect(res2).toBeNull();
  });
});

describe('obtenerPerfil', () => {
  test('obtiene perfil de administrador correctamente', async () => {
    const adminMock = {
      admin_nom_ape: 'Carlos Olivieri',
      admin_tel: '362 4112233',
      admin_fecha_asun: '2020-03-01',
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(adminMock));

    const resultado = await obtenerPerfil('Admin', 'administrador');

    expect(resultado).toEqual({
      ...adminMock,
      identificador: 'Admin',
      rol: 'administrador',
    });
  });

  test('obtiene perfil de técnico correctamente', async () => {
    const tecnicoMock = {
      tecnico_nom_ape: 'Juan Pérez',
      tecnico_tel: '362 4998877',
      tecnico_disponibilidad: 'Disponible',
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(tecnicoMock));

    const resultado = await obtenerPerfil('TEC-001', 'tecnico');

    expect(resultado).toEqual({
      ...tecnicoMock,
      identificador: 'TEC-001',
      rol: 'tecnico',
    });
  });

  test('obtiene perfil de usuario autorizado correctamente', async () => {
    const autorizadoMock = {
      autorizado_legajo: 'AUT-001',
      autorizado_nom_ape: 'María Gómez',
      autorizado_dni: '35123456',
      autorizado_cuil: '27-35123456-4',
      autorizado_tel: '362 4556677',
      autorizado_email: 'maria.gomez@frre.utn.edu.ar',
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(autorizadoMock));

    const resultado = await obtenerPerfil('AUT-001', 'autorizado');

    expect(resultado).toEqual({
      ...autorizadoMock,
      identificador: 'AUT-001',
      rol: 'autorizado',
    });
  });

  test('devuelve información base si no encuentra la fila en la tabla de rol', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null, { message: 'Row not found' }));

    const resultado = await obtenerPerfil('99999', 'tecnico');

    expect(resultado).toEqual({
      identificador: '99999',
      rol: 'tecnico',
    });
  });
});

describe('cambiarPassword', () => {
  test('cambia la contraseña con éxito cuando la contraseña actual es correcta', async () => {
    const hashViejo = await bcrypt.hash('claveVieja', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      password_hash: hashViejo,
    };

    const cadenaUpdate = consultaQueDevuelve(null);

    supabase.from
      .mockReturnValueOnce(consultaQueDevuelve(usuarioMock)) // select
      .mockReturnValueOnce(cadenaUpdate); // update

    const resultado = await cambiarPassword('12345', 'claveVieja', 'claveNuevaSegura');

    expect(resultado).toBe(true);
    expect(cadenaUpdate.update).toHaveBeenCalledWith(
      expect.objectContaining({
        require_password_change: false,
        password_hash: expect.any(String),
      })
    );
  });

  test('no permite cambiar la contraseña si la contraseña actual es incorrecta', async () => {
    const hashViejo = await bcrypt.hash('claveCorrecta', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      password_hash: hashViejo,
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(usuarioMock));

    const resultado = await cambiarPassword('12345', 'claveIncorrecta', 'claveNueva');

    expect(resultado).toBe(false);
  });

  test('devuelve false si el usuario no existe', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null, { message: 'Not found' }));

    const resultado = await cambiarPassword('inexistente', 'clave', 'claveNueva');

    expect(resultado).toBe(false);
  });
});
