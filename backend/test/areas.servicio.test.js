/**
 * Pruebas del área con varios espacios (21/11/2026): cada espacio es de un
 * área como máximo y el área elige sus espacios.
 */
import { jest } from '@jest/globals';

/*
 * Base de mentira: cada consulta toma la siguiente respuesta de
 * `respuestas[tabla]` y anota sus operaciones, para mirar qué se escribió.
 */
let respuestas = {};
let llamadas = [];

function consulta(tabla) {
  const registro = { tabla, ops: [] };
  llamadas.push(registro);
  const responder = () => (respuestas[tabla] ?? []).shift() ?? { data: null, error: null };

  const cadena = new Proxy(
    {},
    {
      get(_, prop) {
        if (prop === 'then') return (ok, mal) => Promise.resolve(responder()).then(ok, mal);
        if (prop === 'maybeSingle' || prop === 'single') return () => Promise.resolve(responder());
        return (...args) => {
          registro.ops.push([prop, ...args]);
          return cadena;
        };
      },
    }
  );
  return cadena;
}

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn((tabla) => consulta(tabla)) },
}));

const areas = await import('../src/servicios/areas.servicio.js');

const SAU = {
  area_id: 4,
  area_nom: 'SAU',
  espacio: [
    { espacio_id: 2, espacio_num: '0.2', tipo_espacio: { tipo_espacio_nom: 'Oficina' }, edificio: { edificio_nom: 'Edificio Central' } },
    { espacio_id: 6, espacio_num: '0.1', tipo_espacio: { tipo_espacio_nom: 'Oficina' }, edificio: { edificio_nom: 'Anexo I' } },
  ],
};

function actualizacionesDeEspacio() {
  return llamadas.filter((llamada) => llamada.tabla === 'espacio' && llamada.ops.some(([op]) => op === 'update'));
}

beforeEach(() => {
  respuestas = {};
  llamadas = [];
});

describe('áreas con varios espacios', () => {
  test('el área trae sus espacios y los edificios donde están', async () => {
    respuestas.area = [{ data: SAU, error: null }];

    const area = await areas.obtenerPorId(4);

    expect(area.idsEspacios).toEqual([6, 2]);
    expect(area.espacios.map((espacio) => espacio.nombre)).toEqual(['Oficina 0.1', 'Oficina 0.2']);
    expect(area.nombreEdificio).toBe('Anexo I / Edificio Central');
  });

  test('no deja sumar un espacio que ya es de otra área', async () => {
    respuestas.area = [{ data: null, error: null }]; // el nombre está libre
    respuestas.espacio = [
      {
        data: [{ espacio_id: 3, espacio_num: '1.1', area_id: 9, tipo_espacio: { tipo_espacio_nom: 'Aula' }, area: { area_nom: 'Bedelía' } }],
        error: null,
      },
    ];

    await expect(areas.crear({ nombre: 'SAU', idsEspacios: [3] })).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('Bedelía'),
    });
    expect(llamadas.some((llamada) => llamada.tabla === 'area' && llamada.ops.some(([op]) => op === 'insert'))).toBe(false);
  });

  test('al editar suelta los espacios que ya no eligió y se queda con los nuevos', async () => {
    respuestas.area = [
      { data: null, error: null }, // el nombre está libre
      { data: { area_id: 4 }, error: null }, // update del nombre
      { data: SAU, error: null }, // se vuelve a leer
    ];
    respuestas.espacio = [
      { data: [{ espacio_id: 2, area_id: 4 }, { espacio_id: 6, area_id: null }], error: null },
      { data: null, error: null },
      { data: null, error: null },
    ];

    await areas.actualizar(4, { nombre: 'SAU', idsEspacios: ['2', 6] });

    const [soltar, asignar] = actualizacionesDeEspacio();
    expect(soltar.ops).toContainEqual(['update', { area_id: null }]);
    expect(soltar.ops).toContainEqual(['eq', 'area_id', 4]);
    expect(soltar.ops).toContainEqual(['not', 'espacio_id', 'in', '(2,6)']);
    expect(asignar.ops).toContainEqual(['update', { area_id: 4 }]);
    expect(asignar.ops).toContainEqual(['in', 'espacio_id', [2, 6]]);
  });

  test('sin espacios elegidos, el área suelta todos los que tenía', async () => {
    respuestas.area = [{ data: null, error: null }, { data: { area_id: 4 }, error: null }, { data: { ...SAU, espacio: [] }, error: null }];
    respuestas.espacio = [{ data: null, error: null }];

    await areas.actualizar(4, { nombre: 'SAU', idsEspacios: [] });

    const actualizaciones = actualizacionesDeEspacio();
    expect(actualizaciones).toHaveLength(1);
    expect(actualizaciones[0].ops.some(([op]) => op === 'not')).toBe(false);
  });

  test('rechaza un área sin nombre', async () => {
    await expect(areas.crear({ nombre: '  ', idsEspacios: [] })).rejects.toMatchObject({ estado: 400 });
  });
});
