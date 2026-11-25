import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerItemCatalogo, obtenerItems, registrarIngresoHerramienta } = await import(
  '../src/servicios/inventario.servicio.js'
);

function consulta(filas) {
  const respuesta = { data: filas, error: null };
  const cadena = {
    then: (resolver, rechazar) => Promise.resolve(respuesta).then(resolver, rechazar),
    maybeSingle: jest.fn().mockResolvedValue({ data: filas[0] ?? null, error: null }),
  };
  for (const metodo of ['select', 'eq', 'order', 'is']) {
    cadena[metodo] = jest.fn(() => cadena);
  }
  return cadena;
}

function prepararDeposito() {
  const filasModelo = [
    {
      herr_modelo_cod: 'TAL-01',
      herr_modelo_nom: 'Taladro',
      herr_modelo_desc: 'Percutor',
      inventariotipoid: 2,
      inventariotipo: { inventariotiponom: 'Eléctricas' },
    },
  ];
  const unidades = [
    {
      herr_cod: 'HE-000',
      herr_modelo_cod: 'TAL-01',
      herr_nom: 'Taladro',
      herr_estado: 1,
      herr_fecha_alta: '2026-11-20',
      remito_id: 8,
      inventariotipoid: 2,
      inventariotipo: { inventariotiponom: 'Eléctricas' },
    },
    {
      herr_cod: 'HE-001',
      herr_modelo_cod: 'TAL-01',
      herr_nom: 'Taladro',
      herr_estado: 2,
      herr_fecha_alta: '2026-11-21',
      remito_id: null,
      inventariotipoid: 2,
      inventariotipo: { inventariotiponom: 'Eléctricas' },
    },
    {
      herr_cod: 'HE-002',
      herr_modelo_cod: 'TAL-01',
      herr_nom: 'Taladro',
      herr_estado: 3,
      herr_fecha_alta: null,
      remito_id: null,
      inventariotipoid: 2,
      inventariotipo: { inventariotiponom: 'Eléctricas' },
    },
  ];
  const prestamos = [
    {
      herr_cod: 'HE-001',
      tecnico_legajo: '123',
      tec_herr_fecha_prest: '2026-11-23T12:00:00Z',
      tecnico: { tecnico_nom_ape: 'Ana Técnica' },
    },
  ];
  supabase.from.mockImplementation((tabla) => {
    if (tabla === 'herramienta_modelo') return consulta(filasModelo);
    if (tabla === 'herramienta') return consulta(unidades);
    if (tabla === 'tecnico_utiliza_herramienta') return consulta(prestamos);
    return consulta([]);
  });
  return { unidades };
}

afterEach(() => {
  jest.clearAllMocks();
});

test('el catálogo cuenta unidades disponibles, en uso y fuera de servicio', async () => {
  prepararDeposito();

  await expect(obtenerItems('Herramienta')).resolves.toEqual([
    expect.objectContaining({
      codigo: 'TAL-01',
      nombre: 'Taladro',
      stockActual: 1,
      cantidadTotal: 3,
      cantidadEnUso: 1,
      cantidadFueraDeServicio: 1,
    }),
  ]);
});

test('el código de una unidad devuelve esa herramienta y no su modelo', async () => {
  const { unidades } = prepararDeposito();
  supabase.from.mockImplementation((tabla) => {
    if (tabla === 'herramienta') return consulta([unidades[1]]);
    if (tabla === 'tecnico_utiliza_herramienta') {
      return consulta([
        {
          herr_cod: 'HE-001',
          tecnico_legajo: '123',
          tec_herr_fecha_prest: '2026-11-23T12:00:00Z',
          tecnico: { tecnico_nom_ape: 'Ana Técnica' },
        },
      ]);
    }
    return consulta([]);
  });

  await expect(obtenerItemCatalogo('HE-001')).resolves.toMatchObject({
    codigo: 'HE-001',
    codigoModelo: 'TAL-01',
    estado: 'En uso',
    tecnico: 'Ana Técnica',
    legajoTecnico: '123',
    fechaAlta: '2026-11-21',
  });
});

test('el ingreso manual exige una cantidad positiva antes de llamar a la base', async () => {
  await expect(
    registrarIngresoHerramienta('TAL-01', { fecha: '2026-11-20', cantidad: 0 })
  ).rejects.toMatchObject({ estado: 400, message: 'La cantidad tiene que ser un número entero mayor que cero.' });
  expect(supabase.rpc).not.toHaveBeenCalled();
});

test('el ingreso manual envía la cantidad y genera los códigos en la base', async () => {
  prepararDeposito();
  supabase.rpc.mockResolvedValue({ data: null, error: null });

  await registrarIngresoHerramienta('TAL-01', { fecha: '2026-11-20', cantidad: 2 });

  expect(supabase.rpc).toHaveBeenCalledWith('registrar_ingreso_herramienta_manual', {
    p_modelo_cod: 'TAL-01',
    p_fecha: '2026-11-20',
    p_cantidad: 2,
  });
});
