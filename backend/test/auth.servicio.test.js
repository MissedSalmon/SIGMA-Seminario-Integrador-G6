/**
 * Pruebas unitarias del servicio de autenticación (HU-30).
 *
 * Cubre:
 * 1. Validación de credenciales (usuario correcto, contraseña errónea, usuario inexistente, usuario inactivo).
 * 2. Obtención de perfil según rol (administrador, técnico, autorizado).
 * 3. Cambio de contraseña: el obligatorio del primer ingreso y el que se hace desde el perfil.
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
  test('devuelve los datos del usuario mapeando el rol enumerado (2 -> tecnico)', async () => {
    const passwordHash = await bcrypt.hash('clave123', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      identificador: '12345',
      password_hash: passwordHash,
      rol: 2,
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

  test('mapea correctamente los roles de administrador (1) y autorizado (3)', async () => {
    const hash = await bcrypt.hash('clave', 10);
    
    // Administrador (1)
    supabase.from.mockReturnValue(
      consultaQueDevuelve({
        usuario_id: 'usr-admin',
        identificador: 'Admin',
        password_hash: hash,
        rol: 1,
        require_password_change: false,
        activo: true,
      })
    );
    const adminRes = await validarCredenciales('Admin', 'clave');
    expect(adminRes.rol).toBe('administrador');

    // Autorizado (3)
    supabase.from.mockReturnValue(
      consultaQueDevuelve({
        usuario_id: 'usr-aut',
        identificador: 'AUT-001',
        password_hash: hash,
        rol: 3,
        require_password_change: false,
        activo: true,
      })
    );
    const autRes = await validarCredenciales('AUT-001', 'clave');
    expect(autRes.rol).toBe('autorizado');
  });

  test('devuelve null si la contraseña no coincide', async () => {
    const passwordHash = await bcrypt.hash('otraClave', 10);
    const usuarioMock = {
      usuario_id: 'usr-001',
      identificador: '12345',
      password_hash: passwordHash,
      rol: 2,
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

  test('acepta el rol tanto como número entero como texto', async () => {
    const adminMock = {
      admin_nom_ape: 'Carlos Olivieri',
      admin_tel: '362 4112233',
      admin_fecha_asun: '2020-03-01',
    };

    supabase.from.mockReturnValue(consultaQueDevuelve(adminMock));

    // Pasando el código numérico 1 (administrador)
    const resultado = await obtenerPerfil('Admin', 1);

    expect(resultado).toEqual({
      ...adminMock,
      identificador: 'Admin',
      rol: 'administrador',
    });
  });
});

describe('cambiarPassword', () => {
  // Las pruebas de arriba dejan un mockReturnValue fijo, que clearAllMocks no borra.
  beforeEach(() => supabase.from.mockReset());

  /** La busqueda del usuario: select().eq().maybeSingle(). */
  function busquedaQueDevuelve(data, error = null) {
    const cadena = {
      select: jest.fn(() => cadena),
      eq: jest.fn(() => cadena),
      maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    };
    return cadena;
  }

  /** El cambio: update().eq(). */
  function cambioQueDevuelve(error = null) {
    const cadena = {
      update: jest.fn(() => cadena),
      eq: jest.fn().mockResolvedValue({ error }),
    };
    return cadena;
  }

  async function usuarioConClave(clave, activo = true) {
    return { usuario_id: 'usr-001', password_hash: await bcrypt.hash(clave, 10), activo };
  }

  test('guarda el hash de la nueva y saca el cambio obligatorio', async () => {
    const cambio = cambioQueDevuelve();
    supabase.from
      .mockReturnValueOnce(busquedaQueDevuelve(await usuarioConClave('claveVieja')))
      .mockReturnValueOnce(cambio);

    await cambiarPassword('12345', 'claveVieja', 'claveNuevaSegura');

    const guardado = cambio.update.mock.calls[0][0];
    expect(guardado.require_password_change).toBe(false);
    expect(await bcrypt.compare('claveNuevaSegura', guardado.password_hash)).toBe(true);
    expect(cambio.eq).toHaveBeenCalledWith('usuario_id', 'usr-001');
  });

  test('rechaza la contraseña actual incorrecta y no cambia nada', async () => {
    supabase.from.mockReturnValueOnce(busquedaQueDevuelve(await usuarioConClave('claveCorrecta')));

    await expect(cambiarPassword('12345', 'claveIncorrecta', 'claveNueva')).rejects.toMatchObject({
      estado: 400,
      message: 'La contraseña actual no es correcta.',
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('rechaza una nueva igual a la actual', async () => {
    supabase.from.mockReturnValueOnce(busquedaQueDevuelve(await usuarioConClave('123456')));

    await expect(cambiarPassword('123456', '123456', '123456')).rejects.toMatchObject({
      estado: 400,
      message: 'La contraseña nueva tiene que ser distinta de la actual.',
    });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('rechaza una nueva de menos de 6 caracteres sin consultar la base', async () => {
    await expect(cambiarPassword('12345', 'claveVieja', '12345')).rejects.toMatchObject({
      estado: 400,
      message: 'La contraseña tiene que tener al menos 6 caracteres.',
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('pide la contraseña actual', async () => {
    await expect(cambiarPassword('12345', '', 'claveNueva')).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('no deja cambiarla a un usuario desactivado aunque su sesión siga abierta', async () => {
    supabase.from.mockReturnValueOnce(busquedaQueDevuelve(await usuarioConClave('claveVieja', false)));

    await expect(cambiarPassword('12345', 'claveVieja', 'claveNueva')).rejects.toMatchObject({ estado: 403 });
    expect(supabase.from).toHaveBeenCalledTimes(1);
  });

  test('avisa si el usuario de la sesión ya no existe', async () => {
    supabase.from.mockReturnValueOnce(busquedaQueDevuelve(null));

    await expect(cambiarPassword('inexistente', 'clave1', 'claveNueva')).rejects.toMatchObject({ estado: 404 });
  });

  test('si la base falla al guardar, no lo da por cambiado', async () => {
    supabase.from
      .mockReturnValueOnce(busquedaQueDevuelve(await usuarioConClave('claveVieja')))
      .mockReturnValueOnce(cambioQueDevuelve({ message: 'se cayó la conexión' }));

    await expect(cambiarPassword('12345', 'claveVieja', 'claveNueva')).rejects.toThrow('se cayó la conexión');
  });
});
