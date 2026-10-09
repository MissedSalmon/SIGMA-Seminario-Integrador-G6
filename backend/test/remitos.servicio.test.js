/**
 * Pruebas del servicio de remitos (HU-16: ingreso de materiales por remito).
 *
 * Se prueba lo que decide el backend antes de tocar la base: que no pase un
 * remito mal cargado, que no se cuele un item que no esta en el catalogo, y
 * que a la funcion de Postgres le lleguen los datos como los espera.
 *
 * Lo que hace la funcion registrar_remito (subir el stock, anotar los
 * movimientos, que sea todo o nada) no se prueba aca: eso es SQL y se verifica
 * contra la base, no con un mock.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
    rpc: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { crear } = await import('../src/servicios/remitos.servicio.js');

/** La fecha de hoy como "2026-09-28", que es lo que manda la pantalla. */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

/** Un remito bien cargado, para cambiarle de a una cosa en cada prueba. */
function remitoValido(cambios = {}) {
  return {
    proveedor: 'Electricidad del Norte S.A.',
    numero: '0001-00012345',
    fechaRecepcion: hoy(),
    items: [{ codigo: 'CA-111', cantidad: 10 }],
    ...cambios,
  };
}

/**
 * Hace que el catalogo conteste que existen los codigos que se le pasen. Es la
 * cadena from('inventarioitem').select(...).in(...).
 */
function catalogoCon(codigos) {
  const materiales = {
    select: jest.fn(() => materiales),
    in: jest.fn(() =>
      Promise.resolve({ data: codigos.map((codigo) => ({ mat_cod: codigo, mat_nom: codigo })), error: null })
    ),
  };
  const herramientas = {
    select: jest.fn(() => herramientas),
    in: jest.fn(() => Promise.resolve({ data: [], error: null })),
  };
  supabase.from.mockImplementation((tabla) => (tabla === 'herramienta' ? herramientas : materiales));
  return materiales;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('crear: lo que se revisa antes de tocar la base', () => {
  test('rechaza un remito sin proveedor', async () => {
    await expect(crear(remitoValido({ proveedor: '   ' }))).rejects.toThrow(
      'Hay que indicar el proveedor que entregó la mercadería.'
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('rechaza un remito sin número', async () => {
    await expect(crear(remitoValido({ numero: '  ' }))).rejects.toThrow(
      'Hay que indicar el número de remito.'
    );
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('rechaza un número de remito con letras o de más de 13 caracteres', async () => {
    const mensaje = 'El número de remito lleva sólo números y guion, hasta 13 caracteres.';

    await expect(crear(remitoValido({ numero: 'A-123' }))).rejects.toThrow(mensaje);
    await expect(crear(remitoValido({ numero: '00001-00012345' }))).rejects.toThrow(mensaje);
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  test('rechaza un remito sin fecha de recepción', async () => {
    await expect(crear(remitoValido({ fechaRecepcion: null }))).rejects.toThrow(
      'Hay que indicar la fecha de recepción del remito.'
    );
  });

  test('rechaza una fecha de recepción posterior a hoy', async () => {
    await expect(crear(remitoValido({ fechaRecepcion: '2099-01-01' }))).rejects.toThrow(
      'La fecha de recepción no puede ser posterior a hoy.'
    );
  });

  test('rechaza un remito sin ítems', async () => {
    await expect(crear(remitoValido({ items: [] }))).rejects.toThrow(
      'El remito tiene que tener al menos un ítem.'
    );
  });

  test('rechaza un renglón sin ítem elegido', async () => {
    await expect(crear(remitoValido({ items: [{ codigo: '', cantidad: 5 }] }))).rejects.toThrow(
      'Falta elegir el ítem del renglón 1.'
    );
  });

  test('rechaza una cantidad de cero', async () => {
    await expect(
      crear(remitoValido({ items: [{ codigo: 'CA-111', cantidad: 0 }] }))
    ).rejects.toThrow('La cantidad de "CA-111" tiene que ser mayor que cero.');
  });

  test('rechaza una cantidad negativa', async () => {
    await expect(
      crear(remitoValido({ items: [{ codigo: 'CA-111', cantidad: -3 }] }))
    ).rejects.toThrow('La cantidad de "CA-111" tiene que ser mayor que cero.');
  });

  test('rechaza una cantidad que no es un número entero', async () => {
    await expect(
      crear(remitoValido({ items: [{ codigo: 'CA-111', cantidad: 2.5 }] }))
    ).rejects.toThrow('La cantidad de "CA-111" tiene que ser un número entero.');
  });

  test('rechaza el mismo ítem repetido en dos renglones', async () => {
    await expect(
      crear(
        remitoValido({
          items: [
            { codigo: 'CA-111', cantidad: 10 },
            { codigo: 'CA-111', cantidad: 5 },
          ],
        })
      )
    ).rejects.toThrow('El ítem "CA-111" está repetido.');
  });

  test('rechaza un ítem que no está en el catálogo, y lo nombra', async () => {
    catalogoCon(['CA-111']);

    await expect(
      crear(
        remitoValido({
          items: [
            { codigo: 'CA-111', cantidad: 10 },
            { codigo: 'NO-EXISTE', cantidad: 1 },
          ],
        })
      )
    ).rejects.toThrow('"NO-EXISTE" no está en el catálogo del depósito');

    expect(supabase.rpc).not.toHaveBeenCalled();
  });
});

describe('crear: lo que se le manda a la base', () => {
  test('llama a registrar_remito con los datos del remito y sus ítems', async () => {
    catalogoCon(['CA-111', 'TO-201']);
    // El primer rpc devuelve el id del remito; despues el servicio lo relee.
    supabase.rpc.mockResolvedValue({ data: 7, error: null });

    // obtenerPorId usa otra cadena, asi que se la cambia despues del alta.
    const lectura = {
      select: jest.fn(() => lectura),
      eq: jest.fn(() => lectura),
      order: jest.fn(() => lectura),
      maybeSingle: jest.fn().mockResolvedValue({
        data: {
          remito_id: 7,
          remito_proveedor: 'Electricidad del Norte S.A.',
          remito_num: '0001-00012345',
          remito_fecha_recepcion: hoy(),
          remito_obs: null,
          remito_creado_por: null,
          remito_creado_en: '2026-09-28T12:00:00+00:00',
          remito_item: [
            {
              inventarioitemcod: 'CA-111',
              remito_item_cant: 10,
            },
            {
              inventarioitemcod: 'TO-201',
              remito_item_cant: 50,
            },
          ],
        },
        error: null,
      }),
    };

    const catalogo = supabase.from('material');
    const herramientas = supabase.from('herramienta');
    supabase.from.mockImplementation((tabla) =>
      tabla === 'remito' ? lectura : tabla === 'herramienta' ? herramientas : catalogo
    );

    const remito = await crear(
      remitoValido({
        numero: '0001-00012345',
        items: [
          { codigo: 'CA-111', cantidad: 10 },
          { codigo: 'TO-201', cantidad: 50 },
        ],
      })
    );

    expect(supabase.rpc).toHaveBeenCalledWith('registrar_remito', {
      p_proveedor: 'Electricidad del Norte S.A.',
      p_fecha_recepcion: hoy(),
      p_items: [
        { codigo: 'CA-111', cantidad: 10 },
        { codigo: 'TO-201', cantidad: 50 },
      ],
      p_num: '0001-00012345',
      p_obs: null,
      p_usuario: null,
    });

    // Los dos numeros que muestra el listado sin abrir el remito.
    expect(remito.cantidadItems).toBe(2);
    expect(remito.totalUnidades).toBe(60);
  });

  test('el mensaje que levanta la función de Postgres llega tal cual', async () => {
    catalogoCon(['CA-111']);
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'P0001', message: 'La fecha de recepción no puede ser posterior a hoy.' },
    });

    await expect(crear(remitoValido())).rejects.toThrow(
      'La fecha de recepción no puede ser posterior a hoy.'
    );
  });

  test('si falta aplicar la migración, lo dice en lugar del error crudo', async () => {
    catalogoCon(['CA-111']);
    supabase.rpc.mockResolvedValue({
      data: null,
      error: { code: 'PGRST202', message: 'Could not find the function public.registrar_remito' },
    });

    await expect(crear(remitoValido())).rejects.toThrow(
      'Falta aplicar la migración del remito en la base de datos (npm run db:push).'
    );
  });
});
