/**
 * Pruebas de las alertas de stock minimo (HU-33).
 *
 * La alerta se calcula del stock de cada material, asi que alcanza con hacer
 * que la tabla material conteste distintas filas y mirar que materiales salen.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerAlertasStock } = await import('../src/servicios/inventario.servicio.js');

/** Una fila de la tabla material como la devuelve Supabase. */
function material(codigo, nombre, actual, minimo) {
  return {
    mat_cod: codigo,
    mat_nom: nombre,
    mat_desc: null,
    inventariotipoid: 1,
    inventariotipo: { inventariotiponom: 'Electricidad' },
    mat_stock_actual: actual,
    mat_stock_min: minimo,
  };
}

/** Hace que from('material').select(...) devuelva esas filas. */
function depositoCon(filas) {
  supabase.from.mockImplementation(() => ({
    select: jest.fn(() => Promise.resolve({ data: filas, error: null })),
  }));
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('obtenerAlertasStock', () => {
  test('solo trae los materiales que estan por debajo del minimo', async () => {
    depositoCon([
      material('CA-1', 'Cable', 2, 10),
      material('LA-1', 'Lámpara', 20, 5),
      material('TO-1', 'Tornillo', 0, 3),
    ]);

    const alertas = await obtenerAlertasStock();

    expect(alertas.map((alerta) => alerta.codigo)).toEqual(['CA-1', 'TO-1']);
    expect(supabase.from).toHaveBeenCalledWith('material');
    expect(supabase.from).not.toHaveBeenCalledWith('herramienta');
  });

  test('dice cuanto falta para llegar al minimo', async () => {
    depositoCon([material('CA-1', 'Cable', 2, 10)]);

    const [alerta] = await obtenerAlertasStock();

    expect(alerta).toEqual({
      codigo: 'CA-1',
      nombre: 'Cable',
      nombreTipo: 'Electricidad',
      stockActual: 2,
      stockMinimo: 10,
      faltante: 8,
    });
  });

  test('un material justo en el minimo no genera alerta', async () => {
    depositoCon([material('CA-1', 'Cable', 10, 10)]);

    expect(await obtenerAlertasStock()).toEqual([]);
  });

  test('la alerta se resuelve sola cuando el stock vuelve a superar el minimo', async () => {
    depositoCon([material('CA-1', 'Cable', 2, 10)]);
    expect(await obtenerAlertasStock()).toHaveLength(1);

    // Entro un remito: el stock subio por encima del minimo.
    depositoCon([material('CA-1', 'Cable', 15, 10)]);
    expect(await obtenerAlertasStock()).toEqual([]);
  });

  test('van primero los que mas faltan y, a igual faltante, por nombre', async () => {
    depositoCon([
      material('A', 'Zócalo', 4, 5),
      material('B', 'Cinta', 0, 20),
      material('C', 'Arandela', 4, 5),
    ]);

    const alertas = await obtenerAlertasStock();

    expect(alertas.map((alerta) => alerta.nombre)).toEqual(['Cinta', 'Arandela', 'Zócalo']);
  });

  test('si la base falla, avisa el error', async () => {
    supabase.from.mockImplementation(() => ({
      select: jest.fn(() => Promise.resolve({ data: null, error: { message: 'sin conexión' } })),
    }));

    await expect(obtenerAlertasStock()).rejects.toThrow('sin conexión');
  });
});
