/**
 * Pruebas del servicio de tickets (HU-10: consulta con filtros).
 *
 * Se prueba lo que no es evidente leyendo el codigo: que la lista salga del
 * mas nuevo al mas viejo, que los filtros se combinen, que el estado se
 * traduzca entre el numero de la base y el texto de la API (datos enumerados,
 * ver src/utiles/enumerados.js), y que el ticket salga bien tanto con OT y
 * evidencia como sin ellas.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const { supabase } = await import('../src/config/supabase.js');
const {
  obtenerTodos,
  obtenerPorId,
  crear,
  validar,
  espaciosQuePuedeReportar,
  activosQuePuedeReportar,
  rechazarPendientesDeActivoRetirado,
  ESTADOS,
  ESTADO_INICIAL,
  MOTIVO_RECHAZO_ACTIVO_RETIRADO,
} = await import('../src/servicios/tickets.servicio.js');

/** Una fila de ticket como la devuelve la base, para no repetirla en cada prueba. */
function filaTicket(cambios = {}) {
  return {
    ticket_id: 5,
    activo_codigo: 'C-01',
    autorizado_legajo: '1234',
    ticket_fecha_alta: '2026-09-05T12:30:00+00:00',
    ticket_desc: 'Falta un tornillo en la silla',
    ticket_estado: 2, // Validado
    ticket_evidencia: 'https://fotos/silla.jpg',
    activo: {
      activo_codigo: 'C-01',
      activo_estado: 1, // Operativo
      tipo_activo: { tipo_activo_nom: 'Mobiliario' },
      espacio: {
        espacio_id: 2,
        espacio_num: '1',
        edificio: { edificio_nom: 'Edificio central' },
        area: { area_id: 4, area_nom: 'Secretaria' },
      },
    },
    autorizado: { autorizado_legajo: '1234', autorizado_nom_ape: 'Martin Guimenez' },
    orden_trabajo: [
      // ot_estado 1 = Creada
      { ot_id: 1, ot_estado: 1, ot_fecha_alta: '2026-09-06T10:00:00+00:00', ot_fecha_cierre: null, ot_desc: 'Reparar silla' },
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
    not: jest.fn(() => cadena),
    neq: jest.fn(() => cadena),
    gte: jest.fn(() => cadena),
    lte: jest.fn(() => cadena),
    insert: jest.fn(() => cadena),
    update: jest.fn(() => cadena),
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

  test('filtrar por estado busca su numero en la base', async () => {
    const consulta = consultaQueDevuelve([]);
    supabase.from.mockReturnValue(consulta);

    await obtenerTodos({ estado: 'Validado' });

    expect(consulta.eq).toHaveBeenCalledWith('ticket_estado', 2);
  });

  test('filtrar por un estado que no existe es un error', async () => {
    supabase.from.mockReturnValue(consultaQueDevuelve([]));

    await expect(obtenerTodos({ estado: 'Inventado' })).rejects.toThrow('no es un estado de ticket válido');
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

    expect(consulta.eq).toHaveBeenCalledWith('ticket_estado', 1);
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

  test('devuelve el estado como texto, no como numero', async () => {
    supabase.from.mockReturnValue(
      consultaQueDevuelve([filaTicket({ ticket_id: 2, ticket_estado: 7 })])
    );

    const [ticket] = await obtenerTodos();

    expect(ticket.estado).toBe('Rechazado');
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
            activo_estado: 1, // Operativo
            tipo_activo: { tipo_activo_nom: 'Aires' },
            espacio: { espacio_id: 3, espacio_num: '11', edificio: { edificio_nom: 'Central' }, area: null },
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

/** Las consultas del alta: los espacios del área del autorizado, sus activos y el ticket nuevo. */
function consultasDelAlta(ticketNuevo) {
  const consultas = {
    espacio: consultaQueDevuelve([{ espacio_id: 3 }, { espacio_id: 8 }]),
    activo: consultaQueDevuelve([{ activo_codigo: 'AC-001', activo_estado: 1, tipo_activo: null }]),
    ticket: consultaQueDevuelve(ticketNuevo),
  };
  supabase.from.mockImplementation((tabla) => consultas[tabla]);
  return consultas;
}

describe('crear', () => {
  test('guarda el ticket nuevo en estado "Creado"', async () => {
    const { ticket: consulta } = consultasDelAlta({
      ticket_id: 9,
      activo_codigo: 'AC-001',
      ticket_desc: 'Hace ruido',
      ticket_estado: 1, // Creado
      ticket_evidencia: null,
      ticket_fecha_alta: '2026-09-13T16:00:00+00:00',
    });

    const nuevo = await crear(
      { codigoActivo: 'AC-001', descripcion: 'Hace ruido' },
      { rol: 'autorizado', identificador: '1234' }
    );

    expect(consulta.insert).toHaveBeenCalledWith(
      expect.objectContaining({ ticket_estado: 1, autorizado_legajo: '1234' })
    );
    expect(nuevo.estado).toBe('Creado');
  });

  test('busca los activos en todos los espacios del área del autorizado', async () => {
    const { espacio, activo } = consultasDelAlta({ ticket_id: 9, ticket_estado: 1 });

    await crear({ codigoActivo: 'AC-001', descripcion: 'Hace ruido' }, { rol: 'autorizado', identificador: '1234' });

    expect(espacio.eq).toHaveBeenCalledWith('area.autorizado_legajo', '1234');
    expect(activo.in).toHaveBeenCalledWith('espacio_id', [3, 8]);
  });

  test('el administrador no puede registrar tickets', async () => {
    await expect(
      crear({ codigoActivo: 'AC-001', descripcion: 'Hace ruido' }, { rol: 'administrador', identificador: '1' })
    ).rejects.toMatchObject({ estado: 403 });
    expect(supabase.from).not.toHaveBeenCalledWith('ticket');
  });

  test('no deja reportar un activo que no está en el área del autorizado', async () => {
    const { ticket } = consultasDelAlta(null);

    await expect(
      crear({ codigoActivo: 'TV-505', descripcion: 'No prende' }, { rol: 'autorizado', identificador: '1234' })
    ).rejects.toMatchObject({ estado: 400 });
    expect(ticket.insert).not.toHaveBeenCalled();
  });
});

describe('rechazo automático por activo retirado', () => {
  test('validar rechaza automáticamente un ticket Creado cuyo activo está Retirado', async () => {
    const ticketCreadoRetirado = filaTicket({
      ticket_id: 12,
      ticket_estado: 1, // Creado
      ticket_desc: 'No enfría',
      orden_trabajo: [],
      activo: {
        activo_codigo: 'AC-010',
        activo_estado: 4, // Retirado
        tipo_activo: { tipo_activo_nom: 'Aires' },
        espacio: { espacio_id: 2, espacio_num: '1', edificio: { edificio_nom: 'Central' }, area: null },
      },
    });
    const ticketRechazado = filaTicket({
      ...ticketCreadoRetirado,
      ticket_estado: 7, // Rechazado
      ticket_desc: `No enfría\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });

    const consultaLectura = consultaQueDevuelve(ticketCreadoRetirado);
    const consultaUpdate = consultaQueDevuelve(ticketRechazado);
    supabase.from
      .mockReturnValueOnce(consultaLectura)
      .mockReturnValueOnce(consultaUpdate);

    const resultado = await validar(12);

    expect(consultaUpdate.update).toHaveBeenCalledWith({
      ticket_estado: 7,
      ticket_desc: `No enfría\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });
    expect(resultado.estado).toBe('Rechazado');
    expect(resultado.motivoRechazo).toBe(MOTIVO_RECHAZO_ACTIVO_RETIRADO);
    expect(resultado.ot).toBeNull();
  });

  test('obtenerPorId rechaza automáticamente un ticket Creado existente cuyo activo está Retirado', async () => {
    const ticketCreadoRetirado = filaTicket({
      ticket_id: 15,
      ticket_estado: 1, // Creado
      ticket_desc: 'Cable cortado',
      orden_trabajo: [],
      activo: {
        activo_codigo: 'PC-099',
        activo_estado: 4, // Retirado
        tipo_activo: { tipo_activo_nom: 'PC' },
        espacio: { espacio_id: 2, espacio_num: '1', edificio: { edificio_nom: 'Central' }, area: null },
      },
    });
    const ticketRechazado = filaTicket({
      ...ticketCreadoRetirado,
      ticket_estado: 7, // Rechazado
      ticket_desc: `Cable cortado\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });

    const consultaLectura = consultaQueDevuelve(ticketCreadoRetirado);
    const consultaUpdate = consultaQueDevuelve(ticketRechazado);
    supabase.from
      .mockReturnValueOnce(consultaLectura)
      .mockReturnValueOnce(consultaUpdate);

    const resultado = await obtenerPorId(15);

    expect(consultaUpdate.update).toHaveBeenCalledWith({
      ticket_estado: 7,
      ticket_desc: `Cable cortado\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });
    expect(resultado.estado).toBe('Rechazado');
    expect(resultado.motivoRechazo).toBe(MOTIVO_RECHAZO_ACTIVO_RETIRADO);
  });

  test('obtenerTodos rechaza automáticamente tickets Creado cuyo activo está Retirado y respeta el filtro de estado', async () => {
    const ticketCreadoRetirado = filaTicket({
      ticket_id: 20,
      ticket_estado: 1, // Creado
      ticket_desc: 'Sin imagen',
      orden_trabajo: [],
      activo: {
        activo_codigo: 'TV-01',
        activo_estado: 4, // Retirado
        tipo_activo: { tipo_activo_nom: 'TV' },
        espacio: { espacio_id: 2, espacio_num: '1', edificio: { edificio_nom: 'Central' }, area: null },
      },
    });
    const ticketRechazado = filaTicket({
      ...ticketCreadoRetirado,
      ticket_estado: 7,
      ticket_desc: `Sin imagen\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });

    const consultaLista = consultaQueDevuelve([ticketCreadoRetirado]);
    const consultaUpdate = consultaQueDevuelve(ticketRechazado);
    supabase.from
      .mockReturnValueOnce(consultaLista)
      .mockReturnValueOnce(consultaUpdate);

    const resultado = await obtenerTodos({ estado: 'Creado' });

    expect(consultaUpdate.update).toHaveBeenCalledWith({
      ticket_estado: 7,
      ticket_desc: `Sin imagen\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });
    expect(resultado).toEqual([]);
  });

  test('rechazarPendientesDeActivoRetirado rechaza todos los tickets Creado del activo', async () => {
    const consultaPendientes = consultaQueDevuelve([
      { ticket_id: 31, ticket_desc: 'No prende' },
      { ticket_id: 32, ticket_desc: 'Hace chispas' },
    ]);
    const consultaUpdate1 = consultaQueDevuelve(null);
    const consultaUpdate2 = consultaQueDevuelve(null);

    supabase.from
      .mockReturnValueOnce(consultaPendientes)
      .mockReturnValueOnce(consultaUpdate1)
      .mockReturnValueOnce(consultaUpdate2);

    const cantidad = await rechazarPendientesDeActivoRetirado('AC-014');

    expect(cantidad).toBe(2);
    expect(consultaPendientes.eq).toHaveBeenCalledWith('activo_codigo', 'AC-014');
    expect(consultaPendientes.eq).toHaveBeenCalledWith('ticket_estado', 1);
    expect(consultaUpdate1.update).toHaveBeenCalledWith({
      ticket_estado: 7,
      ticket_desc: `No prende\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });
    expect(consultaUpdate2.update).toHaveBeenCalledWith({
      ticket_estado: 7,
      ticket_desc: `Hace chispas\n\n--- MOTIVO DE RECHAZO ---\n${MOTIVO_RECHAZO_ACTIVO_RETIRADO}`,
    });
  });
});

describe('espacios y activos reportables', () => {
  test('espaciosQuePuedeReportar devuelve los espacios del área del autorizado ordenados', async () => {
    const consulta = consultaQueDevuelve([
      {
        espacio_id: 8,
        espacio_num: '201',
        tipo_espacio: { tipo_espacio_nom: 'Laboratorio' },
        edificio: { edificio_nom: 'Edificio Norte' },
      },
      {
        espacio_id: 3,
        espacio_num: '101',
        tipo_espacio: { tipo_espacio_nom: 'Aula' },
        edificio: { edificio_nom: 'Edificio Central' },
      },
    ]);
    supabase.from.mockReturnValue(consulta);

    const espacios = await espaciosQuePuedeReportar('1234');

    expect(supabase.from).toHaveBeenCalledWith('espacio');
    expect(consulta.eq).toHaveBeenCalledWith('area.autorizado_legajo', '1234');
    expect(espacios).toEqual([
      { id: 3, nombre: 'Aula 101', nombreEdificio: 'Edificio Central' },
      { id: 8, nombre: 'Laboratorio 201', nombreEdificio: 'Edificio Norte' },
    ]);
  });

  test('activosQuePuedeReportar incluye el idEspacio de cada activo', async () => {
    const consultas = {
      espacio: consultaQueDevuelve([{ espacio_id: 3 }, { espacio_id: 8 }]),
      activo: consultaQueDevuelve([
        { activo_codigo: 'AC-001', activo_estado: 1, espacio_id: 3, tipo_activo: { tipo_activo_nom: 'Aire' } },
        { activo_codigo: 'PC-002', activo_estado: 1, espacio_id: 8, tipo_activo: { tipo_activo_nom: 'PC' } },
      ]),
    };
    supabase.from.mockImplementation((tabla) => consultas[tabla]);

    const activos = await activosQuePuedeReportar('1234');

    expect(activos).toEqual([
      { codigo: 'AC-001', nombreTipo: 'Aire', idEspacio: 3 },
      { codigo: 'PC-002', nombreTipo: 'PC', idEspacio: 8 },
    ]);
  });
});
