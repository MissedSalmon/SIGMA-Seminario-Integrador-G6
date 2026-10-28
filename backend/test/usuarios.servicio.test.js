/**
 * Pruebas de la gestion de usuarios (Sprint 6).
 *
 * Cubre:
 * 1. Alta: caso correcto, persona inexistente, persona que ya tiene usuario,
 *    nombre de usuario repetido y rol invalido.
 * 2. Baja logica: desactivar solo cambia `activo` y no borra nada; no se puede
 *    desactivar uno mismo ni al ultimo administrador activo.
 * 3. Un usuario desactivado no puede iniciar sesion.
 * 4. Solo un administrador activo entra a estas operaciones (403 para el resto).
 * 5. El listado muestra el rol y si esta activo.
 */
import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const usuarios = await import('../src/servicios/usuarios.servicio.js');
const { validarCredenciales } = await import('../src/servicios/auth.servicio.js');
const { soloAdministradorActivo } = await import('../src/middlewares/soloAdministradorActivo.js');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret123';

const ID_ADMIN = '11111111-1111-4111-8111-111111111111';
const ID_TECNICO = '22222222-2222-4222-8222-222222222222';

/**
 * Una consulta de Supabase de mentira: todos los metodos se encadenan y, al
 * final, devuelve `resultado` (con await, single() o maybeSingle()).
 */
function consulta(resultado) {
  const cadena = {};
  for (const metodo of ['select', 'eq', 'order', 'insert', 'update', 'delete']) {
    cadena[metodo] = jest.fn(() => cadena);
  }
  cadena.single = jest.fn().mockResolvedValue(resultado);
  cadena.maybeSingle = jest.fn().mockResolvedValue(resultado);
  cadena.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return cadena;
}

/** Cada llamada a supabase.from() devuelve la siguiente consulta de la lista. */
function responder(...consultas) {
  for (const unaConsulta of consultas) supabase.from.mockReturnValueOnce(unaConsulta);
}

const FILA_TECNICO = {
  usuario_id: ID_TECNICO,
  identificador: 'jperez',
  rol: 2,
  activo: true,
  creado_en: '2026-10-20T10:00:00Z',
  actualizado_en: '2026-10-20T10:00:00Z',
  admin_legajo: null,
  tecnico_legajo: '1234',
  autorizado_legajo: null,
  administrador: null,
  tecnico: { tecnico_nom_ape: 'Juan Pérez' },
  autorizado: null,
};

const FILA_ADMIN = {
  ...FILA_TECNICO,
  usuario_id: ID_ADMIN,
  identificador: 'Admin',
  rol: 1,
  admin_legajo: 'Admin',
  tecnico_legajo: null,
  administrador: { admin_nom_ape: 'Administrador del Sistema' },
  tecnico: null,
};

const DATOS_VALIDOS = { rol: 'tecnico', legajo: '1234', nombreUsuario: 'jperez', password: 'clave123' };

afterEach(() => {
  jest.clearAllMocks();
  supabase.from.mockReset();
});

describe('crear', () => {
  test('crea el usuario con la contraseña cifrada, el rol y la persona', async () => {
    const insercion = consulta({ data: { usuario_id: ID_TECNICO }, error: null });
    responder(
      consulta({ data: { tecnico_legajo: '1234', tecnico_nom_ape: 'Juan Pérez' }, error: null }), // persona
      consulta({ data: null, error: null }), // la persona no tiene usuario
      consulta({ data: null, error: null }), // el nombre esta libre
      insercion,
      consulta({ data: FILA_TECNICO, error: null }) // se lee el usuario creado
    );

    const creado = await usuarios.crear(DATOS_VALIDOS);

    expect(creado).toEqual({
      idUsuario: ID_TECNICO,
      nombreUsuario: 'jperez',
      rol: 'tecnico',
      legajo: '1234',
      persona: 'Juan Pérez',
      activo: true,
      fechaCreacion: '2026-10-20T10:00:00Z',
      fechaActualizacion: '2026-10-20T10:00:00Z',
    });
    expect(creado).not.toHaveProperty('password_hash');

    const guardado = insercion.insert.mock.calls[0][0];
    expect(guardado).toMatchObject({
      identificador: 'jperez',
      rol: 2,
      activo: true,
      require_password_change: true,
      tecnico_legajo: '1234',
    });
    // Nunca en texto plano.
    expect(guardado.password_hash).not.toBe('clave123');
    expect(await bcrypt.compare('clave123', guardado.password_hash)).toBe(true);
  });

  test('rechaza una persona que no esta registrada (404)', async () => {
    responder(consulta({ data: null, error: null }));

    await expect(usuarios.crear(DATOS_VALIDOS)).rejects.toMatchObject({
      estado: 404,
      message: 'No hay ningún tecnico registrado con el legajo 1234.',
    });
  });

  test('rechaza una persona que ya tiene usuario (409)', async () => {
    responder(
      consulta({ data: { tecnico_legajo: '1234', tecnico_nom_ape: 'Juan Pérez' }, error: null }),
      consulta({ data: { usuario_id: ID_TECNICO }, error: null })
    );

    await expect(usuarios.crear(DATOS_VALIDOS)).rejects.toMatchObject({
      estado: 409,
      message: 'Juan Pérez ya tiene un usuario.',
    });
  });

  test('rechaza un nombre de usuario que ya esta en uso (409)', async () => {
    const insercion = consulta({ data: null, error: null });
    responder(
      consulta({ data: { tecnico_legajo: '1234', tecnico_nom_ape: 'Juan Pérez' }, error: null }),
      consulta({ data: null, error: null }),
      consulta({ data: { usuario_id: ID_ADMIN }, error: null }),
      insercion
    );

    await expect(usuarios.crear(DATOS_VALIDOS)).rejects.toMatchObject({
      estado: 409,
      message: 'El nombre de usuario "jperez" ya está en uso.',
    });
    expect(insercion.insert).not.toHaveBeenCalled();
  });

  test('si la base frena un duplicado al insertar, tambien es 409', async () => {
    responder(
      consulta({ data: { tecnico_legajo: '1234', tecnico_nom_ape: 'Juan Pérez' }, error: null }),
      consulta({ data: null, error: null }),
      consulta({ data: null, error: null }),
      consulta({ data: null, error: { code: '23505', message: 'duplicate key' } })
    );

    await expect(usuarios.crear(DATOS_VALIDOS)).rejects.toMatchObject({ estado: 409 });
  });

  test('rechaza un rol invalido (400) sin consultar la base', async () => {
    await expect(usuarios.crear({ ...DATOS_VALIDOS, rol: 'superusuario' })).rejects.toMatchObject({
      estado: 400,
      message: expect.stringContaining('no es un rol válido'),
    });
    await expect(usuarios.crear({ ...DATOS_VALIDOS, rol: '' })).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('valida el nombre de usuario y la contraseña', async () => {
    await expect(usuarios.crear({ ...DATOS_VALIDOS, nombreUsuario: '  ' })).rejects.toThrow(
      'El nombre de usuario es obligatorio.'
    );
    await expect(usuarios.crear({ ...DATOS_VALIDOS, nombreUsuario: 'juan perez' })).rejects.toThrow(
      'no puede tener espacios'
    );
    await expect(usuarios.crear({ ...DATOS_VALIDOS, password: '123' })).rejects.toThrow(
      'al menos 6 caracteres'
    );
    await expect(usuarios.crear({ ...DATOS_VALIDOS, legajo: '' })).rejects.toThrow('Hay que elegir la persona.');
    expect(supabase.from).not.toHaveBeenCalled();
  });
});

describe('desactivar y activar', () => {
  test('desactivar solo cambia activo: no borra el usuario ni toca otra tabla', async () => {
    const actualizacion = consulta({ data: { ...FILA_TECNICO, activo: false }, error: null });
    responder(consulta({ data: FILA_TECNICO, error: null }), actualizacion);

    const resultado = await usuarios.desactivar(ID_TECNICO, ID_ADMIN);

    expect(resultado).toMatchObject({ idUsuario: ID_TECNICO, nombreUsuario: 'jperez', activo: false });
    expect(actualizacion.update).toHaveBeenCalledWith({ activo: false });
    expect(actualizacion.eq).toHaveBeenCalledWith('usuario_id', ID_TECNICO);

    // Ningun delete, y solo se consulto la tabla usuario.
    const tablas = supabase.from.mock.calls.map(([tabla]) => tabla);
    expect(tablas).toEqual(['usuario', 'usuario']);
    for (const { value } of supabase.from.mock.results) {
      expect(value.delete).not.toHaveBeenCalled();
    }
  });

  test('un administrador no se puede desactivar a si mismo', async () => {
    responder(consulta({ data: FILA_ADMIN, error: null }));

    await expect(usuarios.desactivar(ID_ADMIN, ID_ADMIN)).rejects.toMatchObject({
      estado: 409,
      message: 'No podés desactivar tu propio usuario.',
    });
  });

  test('no se puede desactivar al ultimo administrador activo', async () => {
    const otroAdmin = '33333333-3333-4333-8333-333333333333';
    responder(
      consulta({ data: FILA_ADMIN, error: null }),
      consulta({ count: 1, error: null })
    );

    await expect(usuarios.desactivar(ID_ADMIN, otroAdmin)).rejects.toMatchObject({
      estado: 409,
      message: 'No se puede desactivar al último administrador activo.',
    });
  });

  test('se puede desactivar a un administrador si queda otro activo', async () => {
    const otroAdmin = '33333333-3333-4333-8333-333333333333';
    responder(
      consulta({ data: FILA_ADMIN, error: null }),
      consulta({ count: 2, error: null }),
      consulta({ data: { ...FILA_ADMIN, activo: false }, error: null })
    );

    const resultado = await usuarios.desactivar(ID_ADMIN, otroAdmin);
    expect(resultado.activo).toBe(false);
  });

  test('avisa si el usuario ya estaba desactivado o no existe', async () => {
    responder(consulta({ data: { ...FILA_TECNICO, activo: false }, error: null }));
    await expect(usuarios.desactivar(ID_TECNICO, ID_ADMIN)).rejects.toMatchObject({ estado: 409 });

    responder(consulta({ data: null, error: null }));
    await expect(usuarios.desactivar(ID_TECNICO, ID_ADMIN)).rejects.toMatchObject({ estado: 404 });
  });

  test('activar le devuelve el acceso a un usuario desactivado', async () => {
    const actualizacion = consulta({ data: FILA_TECNICO, error: null });
    responder(consulta({ data: { ...FILA_TECNICO, activo: false }, error: null }), actualizacion);

    const resultado = await usuarios.activar(ID_TECNICO);

    expect(resultado.activo).toBe(true);
    expect(actualizacion.update).toHaveBeenCalledWith({ activo: true });
  });
});

describe('login de un usuario desactivado', () => {
  test('el login solo busca usuarios activos', async () => {
    const busqueda = consulta({ data: null, error: { message: 'No rows found' } });
    responder(busqueda);

    expect(await validarCredenciales('jperez', 'clave123')).toBeNull();
    expect(busqueda.eq).toHaveBeenCalledWith('activo', true);
  });

  test('aunque llegue la fila, un usuario inactivo no se autentica con la contraseña correcta', async () => {
    const passwordHash = await bcrypt.hash('clave123', 10);
    responder(
      consulta({
        data: { ...FILA_TECNICO, password_hash: passwordHash, require_password_change: false, activo: false },
        error: null,
      })
    );

    expect(await validarCredenciales('jperez', 'clave123')).toBeNull();
  });
});

describe('solo un administrador activo puede gestionar usuarios', () => {
  function pedidoCon(payload) {
    const token = jwt.sign(payload, JWT_SECRET);
    return { cookies: { token }, headers: {}, originalUrl: '/api/usuarios' };
  }

  function respuesta() {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    return res;
  }

  async function pasar(req) {
    const res = respuesta();
    const next = jest.fn();
    soloAdministradorActivo(req, res, next);
    // El chequeo contra la base es asincronico.
    await new Promise((resolver) => setImmediate(resolver));
    return { res, next };
  }

  test('sin sesion recibe 401', async () => {
    const { res, next } = await pasar({ cookies: {}, headers: {}, originalUrl: '/api/usuarios' });
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  test.each(['tecnico', 'autorizado'])('un %s recibe 403', async (rol) => {
    const { res, next } = await pasar(pedidoCon({ usuarioId: ID_TECNICO, rol, requirePasswordChange: false }));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test('un administrador desactivado (con el token todavia vigente) recibe 403', async () => {
    responder(consulta({ data: { rol: 1, activo: false }, error: null }));

    const { res, next } = await pasar(pedidoCon({ usuarioId: ID_ADMIN, rol: 'administrador', requirePasswordChange: false }));

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test('un administrador activo pasa', async () => {
    responder(consulta({ data: { rol: 1, activo: true }, error: null }));

    const { res, next } = await pasar(pedidoCon({ usuarioId: ID_ADMIN, rol: 'administrador', requirePasswordChange: false }));

    expect(next).toHaveBeenCalledWith();
    expect(res.status).not.toHaveBeenCalled();
  });
});

describe('listado', () => {
  test('muestra nombre de usuario, persona, rol y estado, sin la contraseña', async () => {
    const inactivo = {
      ...FILA_TECNICO,
      usuario_id: '44444444-4444-4444-8444-444444444444',
      identificador: 'mgomez',
      rol: 3,
      activo: false,
      tecnico_legajo: null,
      autorizado_legajo: 'AUT-001',
      tecnico: null,
      autorizado: { autorizado_nom_ape: 'María Gómez' },
    };
    responder(consulta({ data: [FILA_ADMIN, FILA_TECNICO, inactivo], error: null }));

    const lista = await usuarios.obtenerTodos();

    expect(lista.map(({ nombreUsuario, persona, rol, activo }) => ({ nombreUsuario, persona, rol, activo }))).toEqual([
      { nombreUsuario: 'Admin', persona: 'Administrador del Sistema', rol: 'administrador', activo: true },
      { nombreUsuario: 'jperez', persona: 'Juan Pérez', rol: 'tecnico', activo: true },
      { nombreUsuario: 'mgomez', persona: 'María Gómez', rol: 'autorizado', activo: false },
    ]);
    for (const usuario of lista) expect(usuario).not.toHaveProperty('password_hash');
  });

  test('filtra por rol y por estado', async () => {
    responder(consulta({ data: [FILA_ADMIN, FILA_TECNICO, { ...FILA_TECNICO, activo: false }], error: null }));
    expect(await usuarios.obtenerTodos({ rol: 'tecnico', activo: 'false' })).toHaveLength(1);
  });

  test('personas sin usuario: excluye a las que ya tienen uno', async () => {
    responder(
      consulta({ data: [{ admin_legajo: 'Admin', tecnico_legajo: null, autorizado_legajo: null }, { admin_legajo: null, tecnico_legajo: '1234', autorizado_legajo: null }], error: null }),
      consulta({ data: [{ admin_legajo: 'Admin', admin_nom_ape: 'Administrador del Sistema' }], error: null }),
      consulta({ data: [{ tecnico_legajo: '1234', tecnico_nom_ape: 'Juan Pérez' }, { tecnico_legajo: '5678', tecnico_nom_ape: 'Ana Ruiz' }], error: null }),
      consulta({ data: [], error: null })
    );

    expect(await usuarios.obtenerPersonasSinUsuario()).toEqual([
      { rol: 'tecnico', legajo: '5678', nombre: 'Ana Ruiz' },
    ]);
  });
});
