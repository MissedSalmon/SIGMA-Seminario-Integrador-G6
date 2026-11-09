/**
 * Pruebas de los ajustes de stock de un material (06/11/2026): entradas que no
 * vienen de un remito y salidas que no salen de una tarea.
 *
 * La base se simula: la tabla material contesta el stock que tenga la prueba y
 * la funcion registrar_ajuste_stock lo mueve, como haria la de Postgres.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { registrarAjuste, obtenerAlertasStock, obtenerMovimientos } = await import(
  '../src/servicios/inventario.servicio.js'
);

/** Una consulta encadenable que al esperarla contesta { data, error }. */
function consulta(filas, error = null) {
  const respuesta = { data: error ? null : filas, error };
  const cadena = {
    then: (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar),
    maybeSingle: () => Promise.resolve({ data: error ? null : (filas[0] ?? null), error }),
  };
  for (const metodo of ['select', 'eq', 'in', 'is', 'order']) {
    cadena[metodo] = jest.fn(() => cadena);
  }
  return cadena;
}

let deposito;

function cable(stock, minimo = 5) {
  return {
    mat_cod: 'CA-1',
    mat_nom: 'Cable',
    mat_desc: null,
    inventariotipoid: 1,
    inventariotipo: { inventariotiponom: 'Electricidad' },
    mat_stock_actual: stock,
    mat_stock_min: minimo,
  };
}

/** La base con estos materiales y herramientas; el rpc mueve el stock como la funcion real. */
function baseCon({ materiales = [], herramientas = [], movimientos = [], errorMovimientos = null }) {
  deposito = { material: materiales, herramienta: herramientas };
  supabase.from.mockImplementation((tabla) => {
    if (tabla === 'inventariomovimiento') return consulta(movimientos, errorMovimientos);
    return consulta(deposito[tabla] ?? []);
  });
  supabase.rpc.mockImplementation(async (_funcion, { p_codigo, p_tipo, p_cantidad }) => {
    const fila = deposito.material.find((material) => material.mat_cod === p_codigo);
    fila.mat_stock_actual += p_tipo === 'Entrada' ? p_cantidad : -p_cantidad;
    return { data: 1, error: null };
  });
}

const HOY = new Date().toISOString().slice(0, 10);

afterEach(() => {
  jest.clearAllMocks();
});

describe('registrarAjuste', () => {
  test('una entrada suma al stock y guarda quién la hizo', async () => {
    baseCon({ materiales: [cable(10)] });

    const material = await registrarAjuste(
      'CA-1',
      { tipo: 'Entrada', cantidad: 4, fecha: HOY, observacion: '  Donación de la cooperadora ' },
      'admin1'
    );

    expect(material.stockActual).toBe(14);
    expect(supabase.rpc).toHaveBeenCalledWith('registrar_ajuste_stock', {
      p_codigo: 'CA-1',
      p_tipo: 'Entrada',
      p_cantidad: 4,
      p_fecha: HOY,
      p_obs: 'Donación de la cooperadora',
      p_usuario: 'admin1',
    });
  });

  test('una salida descuenta y la observación es opcional', async () => {
    baseCon({ materiales: [cable(10)] });

    const material = await registrarAjuste('CA-1', { tipo: 'Salida', cantidad: 10, fecha: HOY }, 'admin1');

    expect(material.stockActual).toBe(0);
    expect(supabase.rpc.mock.calls[0][1].p_obs).toBeNull();
  });

  test('una salida mayor que el stock no se registra: el stock no queda negativo', async () => {
    baseCon({ materiales: [cable(3)] });

    await expect(registrarAjuste('CA-1', { tipo: 'Salida', cantidad: 4, fecha: HOY })).rejects.toMatchObject({
      estado: 400,
      message: 'No hay stock suficiente de "Cable": quedan 3 y querés descontar 4.',
    });
    expect(supabase.rpc).not.toHaveBeenCalled();
    expect(deposito.material[0].mat_stock_actual).toBe(3);
  });

  test('si la base frena el ajuste, se pasa su mensaje tal cual', async () => {
    baseCon({ materiales: [cable(3)] });
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'La fecha no puede ser anterior al último movimiento del material (05/11/2026).' },
    });

    await expect(registrarAjuste('CA-1', { tipo: 'Entrada', cantidad: 1, fecha: '2026-11-01' })).rejects.toMatchObject({
      estado: 400,
      message: 'La fecha no puede ser anterior al último movimiento del material (05/11/2026).',
    });
  });

  test.each([
    [{ tipo: 'Otro', cantidad: 1, fecha: HOY }, 'Hay que elegir si es un ingreso o un egreso.'],
    [{ tipo: 'Entrada', cantidad: 0, fecha: HOY }, 'La cantidad tiene que ser un número entero mayor que cero.'],
    [{ tipo: 'Entrada', cantidad: 1.5, fecha: HOY }, 'La cantidad tiene que ser un número entero mayor que cero.'],
    [{ tipo: 'Entrada', cantidad: 1, fecha: '' }, 'Hay que indicar la fecha del ajuste.'],
    [{ tipo: 'Entrada', cantidad: 1, fecha: 'ayer' }, '"ayer" no es una fecha válida.'],
    [{ tipo: 'Entrada', cantidad: 1, fecha: '2999-01-01' }, 'La fecha del ajuste no puede ser posterior a hoy.'],
    [{ tipo: 'Entrada', cantidad: 1, fecha: HOY, observacion: 'x'.repeat(501) }, 'La observación puede tener hasta 500 caracteres.'],
  ])('rechaza datos mal cargados: %j', async (datos, mensaje) => {
    baseCon({ materiales: [cable(10)] });

    await expect(registrarAjuste('CA-1', datos)).rejects.toMatchObject({ estado: 400, message: mensaje });
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('una herramienta no tiene stock para ajustar', async () => {
    baseCon({ herramientas: [{ herr_cod: 'TA-1', herr_nom: 'Taladro', herr_estado: 1, inventariotipo: null }] });

    await expect(registrarAjuste('TA-1', { tipo: 'Salida', cantidad: 1, fecha: HOY })).rejects.toMatchObject({
      estado: 400,
      message: 'Una herramienta no tiene stock: si se rompe o se pierde, se da de baja y queda fuera de servicio.',
    });
  });

  test('un código que no está en el depósito da 404', async () => {
    baseCon({});

    await expect(registrarAjuste('NO-1', { tipo: 'Entrada', cantidad: 1, fecha: HOY })).rejects.toMatchObject({
      estado: 404,
    });
  });
});

describe('alerta de stock mínimo después de un ajuste', () => {
  test('una salida que deja el stock por debajo del mínimo hace aparecer la alerta', async () => {
    baseCon({ materiales: [cable(6, 5)] });
    expect(await obtenerAlertasStock()).toEqual([]);

    const material = await registrarAjuste('CA-1', { tipo: 'Salida', cantidad: 2, fecha: HOY });

    expect(material.bajoMinimo).toBe(true);
    expect(await obtenerAlertasStock()).toEqual([
      expect.objectContaining({ codigo: 'CA-1', stockActual: 4, faltante: 1 }),
    ]);
  });

  test('una entrada que repone el stock resuelve la alerta', async () => {
    baseCon({ materiales: [cable(2, 5)] });
    expect(await obtenerAlertasStock()).toHaveLength(1);

    const material = await registrarAjuste('CA-1', { tipo: 'Entrada', cantidad: 3, fecha: HOY });

    expect(material.bajoMinimo).toBe(false);
    expect(await obtenerAlertasStock()).toEqual([]);
  });
});

describe('historial de movimientos con ajustes', () => {
  test('el ajuste trae su observación y no tiene remito', async () => {
    baseCon({
      materiales: [cable(10)],
      movimientos: [
        {
          inventariomovimientoid: 9,
          inventariomovimientotipo: 'Egreso manual',
          inventariomovimientocantidad: 2,
          inventariomovimientofecha: '2026-11-06T10:00:00',
          inventariomovimientousuario: 'admin1',
          inventariomovimientoobs: 'Se rompieron al descargar',
          remito_id: null,
          remito: null,
        },
      ],
    });

    expect(await obtenerMovimientos('CA-1')).toEqual([
      {
        id: 9,
        tipo: 'Egreso manual',
        cantidad: 2,
        fecha: '2026-11-06T10:00:00',
        usuario: 'admin1',
        observacion: 'Se rompieron al descargar',
        idRemito: null,
        numeroRemito: null,
        proveedor: null,
      },
    ]);
  });

  test('si falta la migración de los ajustes, lo dice', async () => {
    baseCon({ materiales: [cable(10)], errorMovimientos: { code: '42703', message: 'column does not exist' } });

    await expect(obtenerMovimientos('CA-1')).rejects.toThrow(
      'Falta aplicar la migración de los ajustes de stock en la base de datos (npm run db:push).'
    );
  });
});
