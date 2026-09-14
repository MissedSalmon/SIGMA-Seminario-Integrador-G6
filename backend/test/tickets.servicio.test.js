/**
 * Pruebas del servicio de tickets (HU-10: consulta con filtros).
 *
 * Se prueba lo que no es evidente leyendo el codigo: que la lista salga del
 * mas nuevo al mas viejo, que los filtros se combinen, que "Creado" incluya
 * los tickets viejos guardados como 'ABIERTO', y que el ticket salga bien
 * tanto con OT y evidencia como sin ellas.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const { obtenerTodos, obtenerPorId, crear, ESTADOS, ESTADO_INICIAL } = await import(
  '../src/servicios/tickets.servicio.js'
);

/** Una fila de ticket como la devuelve la base, para no repetirla en cada prueba. */
function filaTicket(cambios = {}) {
  return {
    ticket_id: 5,
    activo_codigo: 'C-01',
    autorizado_legajo: '1234',
    ticket_fecha_alta: '2026-09-05T12:30:00+00:00',
    ticket_desc: 'Falta un tornillo en la silla',
    ticket_estado: 'Validado',
    ticket_evidencia: 'https://fotos/silla.jpg',
    activo: {
      activo_codigo: 'C-01',
      activo_estado: 'Operativo',
      tipo_activo: { tipo_activo_nom: 'Mobiliario' },
      espacio: {
        espacio_id: 2,
        espacio_num: '1',
        edificio: { edificio_nom: 'Edificio central' },
        area: [{ area_id: 4, area_nom: 'Secretaria' }],
      },
    },
    autorizado: { autorizado_legajo: '1234', autorizado_nom_ape: 'Martin Guimenez' },
    orden_trabajo: [
      { ot_id: 1, ot_estado: 'Creada', ot_fecha_alta: '2026-09-06T10:00:00+00:00', ot_fecha_cierre: null, ot_desc: 'Reparar silla' },
    ],
    ...cambios,
  };
}

/**
 * Arma la cadena select().order().eq()... que usa el servicio. Todos los
 * eslabones devuelven la misma cadena y quedan registrados, asi cada prueba
 * puede mirar con que se los llamo. La cadena es "thenable": al hacerle await
 * resuelve con los datos que se le pasaron.
 */
function consultaQueDevuelve(data) {
  const cadena = {
    select: jest.fn(() => cadena),
    order: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    in: jest.fn(() => cadena),
    gte: jest.fn(() => cadena),
    lte: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error: null }),
    single: jest.fn().mockResolvedValue({ data, error: null }),
    then: (resolver, rechazar) => Promise.resolve({ data, error: null }).then(resolver, rechazar),
  };
  return cadena;
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('estados', () => {
  test('el estado inicial es "Creado" y esta entre los posibles', () => {
    expect(ESTADO_INICIAL).toBe('Creado');
    expect(ESTADOS).toContain('Creado');
  });
});

describe('obtenerTodos', () => {
  test('pide la lista ordenada por fecha de alta descendente', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos();

    expect(supabase.from).toHaveBeenCalledWith('ticket');
    expect(consulta.order).toHaveBeenCalledWith('ticket_fecha_alta', { ascending: false });
  });

  test('sin filtros no agrega ninguna condicion', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ estado: null, desde: null, hasta: null, codigoActivo: null, idArea: null });

    expect(consulta.eq).not.toHaveBeenCalled();
    expect(consulta.in).not.toHaveBeenCalled();
    expect(consulta.gte).not.toHaveBeenCalled();
    expect(consulta.lte).not.toHaveBeenCalled();
  });

  test('filtrar por "Creado" incluye los tickets viejos guardados como ABIERTO', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ estado: 'Creado' });

    expect(consulta.in).toHaveBeenCalledWith('ticket_estado', ['Creado', 'ABIERTO']);
  });

  test('filtrar por otro estado busca solo ese estado', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ estado: 'Validado' });

    expect(consulta.in).toHaveBeenCalledWith('ticket_estado', ['Validado']);
  });

  test('los filtros se combinan: fecha + activo + area, todos juntos', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({
      estado: 'Creado',
      desde: '2026-09-01T03:00:00.000Z',
      hasta: '2026-09-10T02:59:59.999Z',
      codigoActivo: 'PC-001',
      idArea: 4,
    });

    expect(consulta.in).toHaveBeenCalledWith('ticket_estado', ['Creado', 'ABIERTO']);
    expect(consulta.gte).toHaveBeenCalledWith('ticket_fecha_alta', '2026-09-01T03:00:00.000Z');
    expect(consulta.lte).toHaveBeenCalledWith('ticket_fecha_alta', '2026-09-10T02:59:59.999Z');
    expect(consulta.eq).toHaveBeenCalledWith('activo_codigo', 'PC-001');
    expect(consulta.eq).toHaveBeenCalledWith('activo.espacio.area.area_id', 4);
  });

  test('para filtrar por area fuerza el join hasta el area', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ idArea: 4 });

    const columnas = consulta.select.mock.calls[0][0];
    expect(columnas).toContain('activo!inner (');
    expect(columnas).toContain('espacio!inner (');
    expect(columnas).toContain('area!inner (');
  });

  test('sin filtro de area no fuerza el join, para no perder tickets sin area', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ estado: 'Creado' });

    expect(consulta.select.mock.calls[0][0]).not.toContain('!inner');
  });

  test('traduce ABIERTO a "Creado" al devolver la lista', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([filaTicket({ ticket_id: 2, ticket_estado: 'ABIERTO' })])
    );

    const [ticket] = await obtenerTodos();

    expect(ticket.estado).toBe('Creado');
  });
});

describe('obtenerPorId', () => {
  test('arma el ticket completo con activo, area, usuario, evidencia y OT', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(filaTicket()));

    const ticket = await obtenerPorId(5);

    expect(ticket).toMatchObject({
      id: 5,
      estado: 'Validado',
      codigoActivo: 'C-01',
      evidencia: 'https://fotos/silla.jpg',
      activo: { codigo: 'C-01', nombreTipo: 'Mobiliario', nombreEdificio: 'Edificio central', espacio_num: '1' },
      idArea: 4,
      nombreArea: 'Secretaria',
      registradoPor: { legajo: '1234', nombre: 'Martin Guimenez' },
      ot: { id: 1, estado: 'Creada', descripcion: 'Reparar silla' },
    });
  });

  test('un ticket sin OT, sin evidencia y sin area lo dice con nulos y vacios', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve(
        filaTicket({
          ticket_evidencia: null,
          orden_trabajo: [],
          activo: {
            activo_codigo: 'AC-001',
            activo_estado: 'Operativo',
            tipo_activo: { tipo_activo_nom: 'Aires' },
            espacio: { espacio_id: 3, espacio_num: '11', edificio: { edificio_nom: 'Central' }, area: [] },
          },
        })
      )
    );

    const ticket = await obtenerPorId(5);

    expect(ticket.ot).toBeNull();
    expect(ticket.evidencia).toBeNull();
    expect(ticket.idArea).toBeNull();
    expect(ticket.nombreArea).toBe('');
  });

  test('avisa si el ticket no existe', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve(null));

    await expect(obtenerPorId(9999)).rejects.toThrow('No existe el ticket 9999.');
  });
});

describe('crear', () => {
  test('guarda el ticket nuevo en estado "Creado"', async () => {
    const consulta = consultaQueDevuelve({
      ticket_id: 9,
      activo_codigo: 'AC-001',
      ticket_desc: 'Hace ruido',
      ticket_estado: 'Creado',
      ticket_evidencia: null,
      ticket_fecha_alta: '2026-09-13T16:00:00+00:00',
    });
    supabase.from.mockReturnValue(consulta);

    const nuevo = await crear({ codigoActivo: 'AC-001', descripcion: 'Hace ruido' });

    expect(consulta.insert).toHaveBeenCalledWith(expect.objectContaining({ ticket_estado: 'Creado' }));
    expect(nuevo.estado).toBe('Creado');
  });
});
