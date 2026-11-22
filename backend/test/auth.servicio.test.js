/**
 * Pruebas unitarias del servicio de autenticación (HU-30).
 *
 * Cubre:
 * 1. Validación de credenciales (usuario correcto, contraseña errónea, usuario inexistente, usuario inactivo).
 * 2. Obtención y edición del perfil según rol (administrador, técnico, autorizado).
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
  actualizarPerfil,
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
  test('obtiene perfil de administrador con los datos comunes a todos los roles', async () => {
    const consulta = consultaQueDevuelve({
      admin_legajo: 'Admin',
      admin_nom_ape: 'Carlos Olivieri',
      admin_dni: '30123456',
      admin_cuil: '20-30123456-6',
      admin_email: 'colivieri@frre.utn.edu.ar',
      admin_tel: '362 4112233',
      admin_fecha_nac: '1980-05-10',
    });
    supabase.from.mockReturnValue(consulta);

    const resultado = await obtenerPerfil('Admin', 'administrador');

    expect(supabase.from).toHaveBeenCalledWith('administrador');
    expect(consulta.eq).toHaveBeenCalledWith('admin_legajo', 'Admin');
    expect(resultado).toEqual({
      identificador: 'Admin',
      rol: 'administrador',
      legajo: 'Admin',
      nombre: 'Carlos Olivieri',
      dni: '30123456',
      cuil: '20-30123456-6',
      email: 'colivieri@frre.utn.edu.ar',
      telefono: '362 4112233',
      fechaNacimiento: '1980-05-10',
    });
  });

  test('obtiene perfil de técnico y deja vacíos los datos que no tiene', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve({ tecnico_legajo: 'TEC-001', tecnico_nom_ape: 'Juan Pérez', tecnico_tel: '362 4998877' })
    );

    const resultado = await obtenerPerfil('TEC-001', 'tecnico');

    expect(supabase.from).toHaveBeenCalledWith('tecnico');
    expect(resultado).toEqual({
      identificador: 'TEC-001',
      rol: 'tecnico',
      legajo: 'TEC-001',
      nombre: 'Juan Pérez',
      dni: '',
      cuil: '',
      email: '',
      telefono: '362 4998877',
      fechaNacimiento: '',
    });
  });

  test('obtiene perfil de solicitante correctamente', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve({
        autorizado_legajo: 'AUT-001',
        autorizado_nom_ape: 'María Gómez',
        autorizado_dni: '35123456',
        autorizado_cuil: '27-35123456-4',
        autorizado_tel: '362 4556677',
        autorizado_email: 'maria.gomez@frre.utn.edu.ar',
        autorizado_fecha_nac: '1990-01-02',
      })
    );

    const resultado = await obtenerPerfil('AUT-001', 'autorizado');

    expect(supabase.from).toHaveBeenCalledWith('autorizado');
    expect(resultado).toMatchObject({ legajo: 'AUT-001', nombre: 'María Gómez', rol: 'autorizado', dni: '35123456' });
  });

  test('un guion suelto cuenta como dato vacío', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve({ admin_legajo: 'Admin', admin_nom_ape: '-', admin_tel: '-' }));

    const resultado = await obtenerPerfil('Admin', 'administrador');

    expect(resultado.nombre).toBe('');
    expect(resultado.telefono).toBe('');
  });

  test('devuelve información base si no encuentra la fila en la tabla de rol', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null, { message: 'Row not found' }));

    const resultado = await obtenerPerfil('99999', 'tecnico');

    expect(resultado).toEqual({ identificador: '99999', rol: 'tecnico', legajo: '99999' });
  });

  test('sin la migración de datos personales, igual trae nombre y teléfono', async () => {
    supabase.from
      .mockReturnValueOnce(consultaQueDevuelve(null, { code: '42703', message: 'column tecnico.tecnico_dni does not exist' }))
      .mockReturnValueOnce(
        consultaQueDevuelve({ tecnico_legajo: '1111', tecnico_nom_ape: 'Juan Pérez', tecnico_tel: '362 4998877' })
      );

    const resultado = await obtenerPerfil('1111', 'tecnico');

    expect(resultado).toMatchObject({ legajo: '1111', nombre: 'Juan Pérez', telefono: '362 4998877', dni: '' });
  });

  test('acepta el rol tanto como número entero como texto', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve({ admin_legajo: 'Admin', admin_nom_ape: 'Carlos Olivieri' }));

    const resultado = await obtenerPerfil('Admin', 1);

    expect(supabase.from).toHaveBeenCalledWith('administrador');
    expect(resultado).toMatchObject({ rol: 'administrador', nombre: 'Carlos Olivieri' });
  });
});

describe('actualizarPerfil', () => {
  beforeEach(() => supabase.from.mockReset());

  /** El update: update().eq().select().maybeSingle(). Despues se relee con select().eq().single(). */
  function actualizacionQueDevuelve(data, error = null) {
    const cadena = {
      update: jest.fn(() => cadena),
      eq: jest.fn(() => cadena),
      select: jest.fn(() => cadena),
      maybeSingle: jest.fn().mockResolvedValue({ data, error }),
    };
    return cadena;
  }

  const datosValidos = {
    nombre: '  Juan Pérez ',
    dni: '20345678',
    cuil: '20203456787',
    email: 'jperez@frre.utn.edu.ar',
    telefono: '0362 15 4123456',
    fechaNacimiento: '1990-03-15',
  };

  test('guarda los datos normalizados en la tabla del rol, sin tocar legajo ni rol', async () => {
    const actualizacion = actualizacionQueDevuelve({ tecnico_legajo: 'TEC-001' });
    supabase.from
      .mockReturnValueOnce(actualizacion)
      .mockReturnValueOnce(consultaQueDevuelve({ tecnico_legajo: 'TEC-001', tecnico_nom_ape: 'Juan Pérez' }));

    const resultado = await actualizarPerfil('TEC-001', 'tecnico', {
      ...datosValidos,
      legajo: 'OTRO',
      rol: 'administrador',
    });

    expect(supabase.from).toHaveBeenNthCalledWith(1, 'tecnico');
    expect(actualizacion.update).toHaveBeenCalledWith({
      tecnico_nom_ape: 'Juan Pérez',
      tecnico_dni: '20345678',
      tecnico_cuil: '20-20345678-7',
      tecnico_email: 'jperez@frre.utn.edu.ar',
      tecnico_tel: '362 4123456',
      tecnico_fecha_nac: '1990-03-15',
    });
    expect(actualizacion.eq).toHaveBeenCalledWith('tecnico_legajo', 'TEC-001');
    expect(resultado).toMatchObject({ legajo: 'TEC-001', rol: 'tecnico' });
  });

  test('el nombre es obligatorio', async () => {
    await expect(actualizarPerfil('Admin', 'administrador', { ...datosValidos, nombre: ' ' })).rejects.toMatchObject({
      estado: 400,
    });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('rechaza un CUIL que no coincide con el DNI', async () => {
    await expect(
      actualizarPerfil('Admin', 'administrador', { ...datosValidos, cuil: '20-30123456-6' })
    ).rejects.toMatchObject({ estado: 400 });
  });

  test('rechaza una fecha de nacimiento de alguien menor de 18', async () => {
    const hace10 = `${new Date().getFullYear() - 10}-01-01`;
    await expect(
      actualizarPerfil('Admin', 'administrador', { ...datosValidos, fechaNacimiento: hace10 })
    ).rejects.toMatchObject({ estado: 400 });
  });

  test('al solicitante le sigue pidiendo DNI y fecha de nacimiento', async () => {
    await expect(actualizarPerfil('AUT-001', 'autorizado', { ...datosValidos, dni: '' })).rejects.toMatchObject({
      estado: 400,
    });
    await expect(
      actualizarPerfil('AUT-001', 'autorizado', { ...datosValidos, fechaNacimiento: '' })
    ).rejects.toMatchObject({ estado: 400 });
  });

  test('a técnico y administrador los datos opcionales se pueden dejar vacíos', async () => {
    const actualizacion = actualizacionQueDevuelve({ admin_legajo: 'Admin' });
    supabase.from
      .mockReturnValueOnce(actualizacion)
      .mockReturnValueOnce(consultaQueDevuelve({ admin_legajo: 'Admin', admin_nom_ape: 'Carlos' }));

    await actualizarPerfil('Admin', 1, { nombre: 'Carlos' });

    expect(actualizacion.update).toHaveBeenCalledWith({
      admin_nom_ape: 'Carlos',
      admin_dni: null,
      admin_cuil: null,
      admin_email: null,
      admin_tel: null,
      admin_fecha_nac: null,
    });
  });

  test('un DNI repetido devuelve 409', async () => {
    supabase.from.mockReturnValueOnce(actualizacionQueDevuelve(null, { code: '23505', message: 'duplicate key' }));

    await expect(actualizarPerfil('TEC-001', 'tecnico', datosValidos)).rejects.toMatchObject({ estado: 409 });
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
