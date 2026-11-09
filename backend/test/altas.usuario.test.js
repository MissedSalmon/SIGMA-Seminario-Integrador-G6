/**
 * Alta de un tecnico y de un usuario autorizado con su usuario (06/11/2026).
 *
 * El nombre de usuario y la contraseña provisoria son el legajo, y el alta es
 * todo o nada: si el usuario no se puede crear, la persona no queda guardada.
 */
import { jest } from '@jest/globals';
import bcrypt from 'bcryptjs';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const tecnicos = await import('../src/servicios/tecnicos.servicio.js');
const autorizados = await import('../src/servicios/autorizados.servicio.js');

/** Una consulta encadenable que termina devolviendo `resultado`. */
function consulta(resultado) {
  const cadena = {};
  for (const metodo of ['select', 'eq', 'in', 'order', 'insert', 'update', 'delete']) {
    cadena[metodo] = jest.fn(() => cadena);
  }
  cadena.single = jest.fn().mockResolvedValue(resultado);
  cadena.maybeSingle = jest.fn().mockResolvedValue(resultado);
  cadena.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return cadena;
}

const VACIO = { data: null, error: null };

/** Responde por tabla, en orden, y anota cada consulta. Lo que no se preparó contesta vacío. */
function prepararBase(respuestas) {
  const hechas = [];
  supabase.from.mockImplementation((tabla) => {
    const cadena = consulta(respuestas[tabla]?.shift() ?? VACIO);
    hechas.push({ tabla, cadena });
    return cadena;
  });
  return {
    de: (tabla) => hechas.filter((hecha) => hecha.tabla === tabla).map((hecha) => hecha.cadena),
  };
}

const insertadoEn = (consultas) =>
  consultas.find((cadena) => cadena.insert.mock.calls.length)?.insert.mock.calls[0][0];
const borro = (consultas) => consultas.some((cadena) => cadena.delete.mock.calls.length > 0);

afterEach(() => {
  supabase.from.mockReset();
});

describe('alta de un técnico', () => {
  const DATOS = { legajo: '4321', nombre: 'Juan', apellido: 'Pérez', especialidades: [1] };
  const FILA = {
    tecnico_legajo: 4321,
    tecnico_nom_ape: 'Juan Pérez',
    tecnico_tel: null,
    tecnico_disponibilidad: true,
    tecnico_especialidad: [],
  };
  const ESPECIALIDADES = { data: [{ especialidad_id: 1 }], error: null };

  test('le crea el usuario con el legajo como nombre y contraseña provisoria', async () => {
    const base = prepararBase({
      especialidad: [ESPECIALIDADES],
      tecnico: [VACIO, VACIO, { data: FILA, error: null }],
      usuario: [VACIO, { data: { usuario_id: 'u-1' }, error: null }],
    });

    const creado = await tecnicos.crear(DATOS);

    expect(creado.legajo).toBe(4321);
    const usuario = insertadoEn(base.de('usuario'));
    expect(usuario).toMatchObject({
      identificador: '4321',
      rol: 2,
      tecnico_legajo: '4321',
      require_password_change: true,
      activo: true,
    });
    expect(await bcrypt.compare('4321', usuario.password_hash)).toBe(true);
    expect(borro(base.de('tecnico'))).toBe(false);
  });

  test('si el legajo ya es el nombre de otro usuario, no guarda nada (409)', async () => {
    const base = prepararBase({
      especialidad: [ESPECIALIDADES],
      tecnico: [VACIO],
      usuario: [{ data: { usuario_id: 'otro' }, error: null }],
    });

    await expect(tecnicos.crear(DATOS)).rejects.toMatchObject({ estado: 409 });
    expect(insertadoEn(base.de('tecnico'))).toBeUndefined();
  });

  test('si falla la creación del usuario, deshace el alta y lo avisa', async () => {
    const base = prepararBase({
      especialidad: [ESPECIALIDADES],
      tecnico: [VACIO],
      usuario: [VACIO, { data: null, error: { code: 'XX000', message: 'se cayó la conexión' } }],
    });

    await expect(tecnicos.crear(DATOS)).rejects.toThrow('No se guardó el técnico: se cayó la conexión');
    expect(borro(base.de('tecnico'))).toBe(true);
    expect(borro(base.de('tecnico_especialidad'))).toBe(true);
  });
});

describe('alta de un usuario autorizado', () => {
  const DATOS = { legajo: 'A-77', nombre: 'Ana Ruiz', dni: '30123456', fechaNacimiento: '1990-05-10', idArea: 3 };
  const FILA = {
    autorizado_legajo: 'A-77',
    autorizado_nom_ape: 'Ana Ruiz',
    area: [{ area_id: 3, area_nom: 'Biblioteca' }],
  };
  const AREA_LIBRE = { data: { area_id: 3, area_nom: 'Biblioteca', autorizado_legajo: null }, error: null };

  test('le crea el usuario con el legajo como nombre y contraseña provisoria', async () => {
    const base = prepararBase({
      autorizado: [VACIO, VACIO, { data: FILA, error: null }],
      area: [AREA_LIBRE],
      usuario: [VACIO, { data: { usuario_id: 'u-2' }, error: null }],
    });

    const creado = await autorizados.crear(DATOS);

    expect(creado).toMatchObject({ legajo: 'A-77', idArea: 3 });
    const usuario = insertadoEn(base.de('usuario'));
    expect(usuario).toMatchObject({
      identificador: 'A-77',
      rol: 3,
      autorizado_legajo: 'A-77',
      require_password_change: true,
    });
    expect(await bcrypt.compare('A-77', usuario.password_hash)).toBe(true);
  });

  test('si el legajo ya es el nombre de otro usuario, no guarda nada (409)', async () => {
    const base = prepararBase({
      autorizado: [VACIO],
      area: [AREA_LIBRE],
      usuario: [{ data: { usuario_id: 'otro' }, error: null }],
    });

    await expect(autorizados.crear(DATOS)).rejects.toMatchObject({ estado: 409 });
    expect(insertadoEn(base.de('autorizado'))).toBeUndefined();
  });

  test('si falla la creación del usuario, borra a la persona y le devuelve el área', async () => {
    const base = prepararBase({
      autorizado: [VACIO],
      area: [AREA_LIBRE],
      usuario: [VACIO, { data: null, error: { code: '23505', message: 'duplicate key' } }],
    });

    await expect(autorizados.crear(DATOS)).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('No se guardó el usuario autorizado'),
    });
    expect(borro(base.de('autorizado'))).toBe(true);
    const cambiosDeArea = base.de('area').flatMap((cadena) => cadena.update.mock.calls.map(([cambio]) => cambio));
    expect(cambiosDeArea.at(-1)).toEqual({ autorizado_legajo: null });
  });
});
