/**
 * Las dos listas de usuarios (técnicos y autorizados) con las mismas acciones
 * (06/11/2026):
 * 1. Cada persona trae el estado de su usuario.
 * 2. Eliminar es sólo para quien nunca registró nada; si no, se desactiva.
 * 3. A un técnico desactivado no se le asignan tareas ni herramientas nuevas.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { cuentaDe, controlarTecnicoActivo } = await import('../src/servicios/usuarios.servicio.js');
const tecnicos = await import('../src/servicios/tecnicos.servicio.js');
const autorizados = await import('../src/servicios/autorizados.servicio.js');

/** Una consulta encadenable que termina devolviendo `resultado`. */
function consulta(resultado) {
  const cadena = {};
  for (const metodo of ['select', 'eq', 'limit', 'update', 'delete']) cadena[metodo] = jest.fn(() => cadena);
  cadena.single = jest.fn().mockResolvedValue(resultado);
  cadena.maybeSingle = jest.fn().mockResolvedValue(resultado);
  cadena.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return cadena;
}

/** Responde por tabla, en orden. Lo que no se preparó contesta vacío. */
function prepararBase(respuestas) {
  const hechas = [];
  supabase.from.mockImplementation((tabla) => {
    const cadena = consulta(respuestas[tabla]?.shift() ?? { data: null, error: null, count: 0 });
    hechas.push({ tabla, cadena });
    return cadena;
  });
  return { de: (tabla) => hechas.filter((hecha) => hecha.tabla === tabla).map((hecha) => hecha.cadena) };
}

const borro = (consultas) => consultas.some((cadena) => cadena.delete.mock.calls.length > 0);

afterEach(() => supabase.from.mockReset());

describe('cuentaDe', () => {
  test('lee el usuario venga como objeto o como lista', () => {
    expect(cuentaDe({ usuario: { usuario_id: 'u-1', activo: false } })).toEqual({ idUsuario: 'u-1', activo: false });
    expect(cuentaDe({ usuario: [{ usuario_id: 'u-2', activo: true }] })).toEqual({ idUsuario: 'u-2', activo: true });
  });

  test('sin usuario, el estado queda vacío', () => {
    expect(cuentaDe({ usuario: null })).toEqual({ idUsuario: null, activo: null });
    expect(cuentaDe({ usuario: [] })).toEqual({ idUsuario: null, activo: null });
  });
});

describe('eliminar un técnico', () => {
  test('con tareas asignadas no se borra: se sugiere desactivarlo', async () => {
    const base = prepararBase({ tecnico_asignado_tarea_ot: [{ data: null, error: null, count: 3 }] });

    await expect(tecnicos.eliminar(4321)).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('Desactivalo'),
    });
    expect(borro(base.de('tecnico'))).toBe(false);
  });

  test('con observaciones escritas tampoco', async () => {
    const base = prepararBase({
      tecnico_asignado_tarea_ot: [{ data: null, error: null, count: 0 }],
      usuario: [{ data: { usuario_id: 'u-1' }, error: null }],
      tarea_observacion: [{ data: null, error: null, count: 2 }],
    });

    await expect(tecnicos.eliminar(4321)).rejects.toMatchObject({ estado: 409 });
    expect(borro(base.de('tecnico'))).toBe(false);
  });

  test('sin nada registrado se borra', async () => {
    const base = prepararBase({
      tecnico_asignado_tarea_ot: [{ data: null, error: null, count: 0 }],
      usuario: [{ data: null, error: null }],
      tecnico_utiliza_herramienta: [{ data: [], error: null }],
      tecnico: [{ data: { tecnico_legajo: 4321, tecnico_nom_ape: 'Juan Pérez' }, error: null }],
    });

    await expect(tecnicos.eliminar(4321)).resolves.toMatchObject({ legajo: 4321 });
    expect(borro(base.de('tecnico'))).toBe(true);
  });
});

describe('eliminar un usuario autorizado', () => {
  test('con tickets cargados no se borra: se sugiere desactivarlo', async () => {
    const base = prepararBase({ ticket: [{ data: [{ ticket_id: 1 }], error: null }] });

    await expect(autorizados.eliminar('A-77')).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('Desactivalo'),
    });
    expect(borro(base.de('autorizado'))).toBe(false);
  });
});

describe('controlarTecnicoActivo', () => {
  test('frena la asignación a un técnico desactivado', async () => {
    prepararBase({ usuario: [{ data: { activo: false }, error: null }] });

    await expect(controlarTecnicoActivo(4321)).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('desactivado'),
    });
  });

  test('deja pasar a uno activo', async () => {
    prepararBase({ usuario: [{ data: { activo: true }, error: null }] });

    await expect(controlarTecnicoActivo(4321)).resolves.toBeUndefined();
  });
});
