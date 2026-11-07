/**
 * Pruebas de la gestion de usuarios (Sprint 6).
 *
 * Cubre:
 * 1. Baja logica: desactivar solo cambia `activo` y no borra nada; no se puede
 *    desactivar uno mismo ni al ultimo administrador activo.
 * 2. Un usuario desactivado no puede iniciar sesion.
 * 3. Solo un administrador activo entra a estas operaciones (403 para el resto).
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

afterEach(() => {
  jest.clearAllMocks();
  supabase.from.mockReset();
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
