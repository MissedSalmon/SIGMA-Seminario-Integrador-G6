/**
 * Pruebas de los consumos de un material (HU-35): en que tareas se uso.
 *
 * Cada tabla contesta las filas que se le dan, sin importar los filtros, asi
 * que cada prueba arma solo las tablas que le interesan.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerConsumos } = await import('../src/servicios/inventario.servicio.js');

/**
 * Una consulta encadenable: select, eq, in, order... devuelven la misma
 * consulta, y al esperarla contesta { data, error }.
 */
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

/** Hace que cada tabla conteste sus filas. Una tabla que no esta, contesta vacio. */
function baseCon(tablas) {
  supabase.from.mockImplementation((tabla) => {
    const contenido = tablas[tabla] ?? [];
    return contenido instanceof Error ? consulta([], { message: contenido.message }) : consulta(contenido);
  });
}

const CABLE = {
  mat_cod: 'CA-1',
  mat_nom: 'Cable',
  mat_desc: null,
  inventariotipoid: 1,
  inventariotipo: { inventariotiponom: 'Electricidad' },
  mat_stock_actual: 10,
  mat_stock_min: 5,
};

function consumo(idOt, idTarea, cantidad, fecha, descripcion) {
  return {
    ot_id: idOt,
    tarea_id: idTarea,
    tamat_cant: cantidad,
    tamat_fecha_cons: fecha,
    tarea_ot: { tarea_desc: descripcion },
  };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('obtenerConsumos', () => {
  test('trae una fila por tarea, con su OT y el tecnico asignado', async () => {
    baseCon({
      material: [CABLE],
      tarea_ot_consume_material: [
        consumo(7, 2, '3.00', '2026-10-20T14:00:00Z', 'Cambiar el tomacorriente'),
        consumo(5, 1, 12, '2026-10-12T09:30:00Z', 'Tender el cable nuevo'),
      ],
      tecnico_asignado_tarea_ot: [
        { ot_id: 7, tarea_id: 2, tecnico: { tecnico_nom_ape: 'Ana Gómez' } },
        { ot_id: 5, tarea_id: 1, tecnico: { tecnico_nom_ape: 'Luis Pérez' } },
      ],
    });

    const consumos = await obtenerConsumos('CA-1');

    expect(consumos).toEqual([
      {
        idOt: 7,
        idTarea: 2,
        tarea: 'Cambiar el tomacorriente',
        cantidad: 3,
        fecha: '2026-10-20T14:00:00Z',
        tecnico: 'Ana Gómez',
      },
      {
        idOt: 5,
        idTarea: 1,
        tarea: 'Tender el cable nuevo',
        cantidad: 12,
        fecha: '2026-10-12T09:30:00Z',
        tecnico: 'Luis Pérez',
      },
    ]);
    expect(supabase.from).toHaveBeenCalledWith('tarea_ot_consume_material');
  });

  test('el tecnico de otra tarea de la misma OT no se mezcla', async () => {
    baseCon({
      material: [CABLE],
      tarea_ot_consume_material: [consumo(7, 2, 3, '2026-10-20T14:00:00Z', 'Cambiar el tomacorriente')],
      tecnico_asignado_tarea_ot: [{ ot_id: 7, tarea_id: 1, tecnico: { tecnico_nom_ape: 'Ana Gómez' } }],
    });

    const [fila] = await obtenerConsumos('CA-1');

    expect(fila.tecnico).toBeNull();
  });

  test('un material que nunca se uso no tiene consumos', async () => {
    baseCon({ material: [CABLE], tarea_ot_consume_material: [] });

    expect(await obtenerConsumos('CA-1')).toEqual([]);
    expect(supabase.from).not.toHaveBeenCalledWith('tecnico_asignado_tarea_ot');
  });

  test('una herramienta no tiene consumos', async () => {
    baseCon({
      herramienta: [{ herr_cod: 'TA-1', herr_nom: 'Taladro', herr_desc: null, inventariotipoid: 2, herr_estado: 1 }],
    });

    await expect(obtenerConsumos('TA-1')).rejects.toMatchObject({ estado: 400 });
    expect(supabase.from).not.toHaveBeenCalledWith('tarea_ot_consume_material');
  });

  test('un codigo que no existe avisa que no esta', async () => {
    baseCon({});

    await expect(obtenerConsumos('NO-1')).rejects.toMatchObject({ estado: 404 });
  });

  test('si la base falla, avisa el error', async () => {
    baseCon({ material: [CABLE], tarea_ot_consume_material: new Error('sin conexión') });

    await expect(obtenerConsumos('CA-1')).rejects.toThrow('sin conexión');
  });
});
