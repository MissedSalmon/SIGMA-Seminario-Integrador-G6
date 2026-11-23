/**
 * Pruebas de las notificaciones de la campana: cada rol recibe las suyas,
 * todas juntas y de la mas nueva a la mas vieja, con si estan leidas y sin
 * las eliminadas.
 *
 * Las alertas de stock, las tareas, los tickets y las OT ya tienen sus propias
 * pruebas; aca se simulan esos servicios y la tabla de leidas/eliminadas.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/servicios/inventario.servicio.js', () => ({
  obtenerAlertasStock: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/tareas.servicio.js', () => ({
  obtenerDelTecnico: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/tickets.servicio.js', () => ({
  obtenerTodos: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/ordenesTrabajo.servicio.js', () => ({
  obtenerTodas: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/estadoNotificaciones.servicio.js', () => ({
  sincronizar: jest.fn(),
  marcarLeida: jest.fn(),
  marcarTodasLeidas: jest.fn(),
  eliminar: jest.fn(),
}));

const { obtenerAlertasStock } = await import('../src/servicios/inventario.servicio.js');
const { obtenerDelTecnico } = await import('../src/servicios/tareas.servicio.js');
const { obtenerTodos: obtenerTickets } = await import('../src/servicios/tickets.servicio.js');
const { obtenerTodas: obtenerOrdenes } = await import('../src/servicios/ordenesTrabajo.servicio.js');
const estado = await import('../src/servicios/estadoNotificaciones.servicio.js');
const { obtenerDelUsuario, marcarLeida, marcarTodasLeidas, eliminar } = await import(
  '../src/servicios/notificaciones.servicio.js'
);

/** La primera vez que se mostro, para las que no tienen fecha propia. */
const PRIMERA_VEZ = '2026-11-20T12:00:00.000Z';

/** Lo guardado en la tabla: por defecto, nada leido ni eliminado. */
let guardado = {};

function tarea(idOt, idTarea, datos = {}) {
  return { idOt, idTarea, descripcion: `Tarea ${idOt}-${idTarea}`, prioridad: 'Alta', estado: 'Asignada', ...datos };
}

beforeEach(() => {
  guardado = {};
  obtenerTickets.mockResolvedValue([]);
  obtenerOrdenes.mockResolvedValue([]);
  obtenerAlertasStock.mockResolvedValue([]);
  estado.sincronizar.mockImplementation(async (_identificador, claves) => {
    return new Map(
      claves.map((clave) => [clave, { fecha: PRIMERA_VEZ, leida: false, eliminada: false, ...guardado[clave] }])
    );
  });
  jest.useFakeTimers({ now: new Date('2026-11-23T15:00:00Z') });
});

afterEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
});

describe('obtenerDelUsuario', () => {
  test('el administrador recibe las alertas de stock minimo, fechadas la primera vez que se mostraron', async () => {
    obtenerAlertasStock.mockResolvedValue([
      { codigo: 'CA-1', nombre: 'Cable', unidadMedida: 'metro', stockActual: 2, stockMinimo: 10, faltante: 8 },
    ]);

    const resultado = await obtenerDelUsuario({ rol: 'administrador', identificador: 'Admin' });

    expect(estado.sincronizar).toHaveBeenCalledWith('Admin', ['stock-CA-1']);
    expect(resultado).toEqual({
      verMas: '/notificaciones',
      noLeidas: 1,
      notificaciones: [
        {
          clave: 'stock-CA-1',
          tipo: 'Stock',
          titulo: 'Stock bajo: Cable',
          detalle: 'Quedan 2 metro · mínimo 10 metro',
          enlace: '/inventario/materiales/CA-1',
          accion: 'Ver material',
          fecha: PRIMERA_VEZ,
          leida: false,
        },
      ],
    });
  });

  test('el administrador recibe todo en una sola lista, de la mas nueva a la mas vieja', async () => {
    obtenerTickets.mockResolvedValue([
      {
        id: 4,
        fechaAlta: '2026-11-22T12:00:00Z',
        codigoActivo: 'AA-01',
        activo: { nombreEdificio: 'Edificio Central', nombreEspacio: 'Aula 3' },
        registradoPor: { legajo: 'A-1', nombre: 'Ana Pérez' },
      },
    ]);
    obtenerOrdenes.mockResolvedValue([
      { id: 9, idTicket: 2, codigoActivo: 'AA-02', fechaCierre: '2026-11-21T13:00:00Z' },
      { id: 8, idTicket: 1, codigoActivo: 'AA-03', fechaCierre: '2026-11-01T13:00:00Z' },
    ]);
    obtenerAlertasStock.mockResolvedValue([
      { codigo: 'CA-1', nombre: 'Cable', unidadMedida: 'metro', stockActual: 2, stockMinimo: 10, faltante: 8 },
    ]);

    const { notificaciones } = await obtenerDelUsuario({ rol: 'administrador', identificador: 'Admin' });

    expect(obtenerTickets).toHaveBeenCalledWith({ estado: 'Creado' });
    expect(obtenerOrdenes).toHaveBeenCalledWith({ estado: 'Finalizada' });
    // La OT 8 finalizo hace mas de una semana: no aparece.
    expect(notificaciones.map((notificacion) => notificacion.clave)).toEqual([
      'ticket-nuevo-4',
      'ot-finalizada-9',
      'stock-CA-1',
    ]);
    expect(notificaciones[0]).toMatchObject({
      tipo: 'Ticket',
      titulo: 'Nuevo ticket #4',
      detalle: 'Ana Pérez reportó un problema en el activo AA-01 en Edificio Central, Aula 3. Falta validarlo o rechazarlo.',
      enlace: '/tickets/4',
      accion: 'Ver ticket',
      fecha: '2026-11-22T12:00:00Z',
    });
    expect(notificaciones[1]).toMatchObject({
      tipo: 'Orden de trabajo',
      titulo: 'OT #9 finalizada',
      detalle: 'Del ticket #2, activo AA-02. Finalizó el 21/11/2026.',
      enlace: '/ordenes-trabajo/9',
      accion: 'Ver OT',
    });
  });

  test('marca las leidas, no muestra las eliminadas y cuenta las no leidas', async () => {
    obtenerAlertasStock.mockResolvedValue([
      { codigo: 'CA-1', nombre: 'Cable', unidadMedida: 'metro', stockActual: 2, stockMinimo: 10, faltante: 8 },
      { codigo: 'CA-2', nombre: 'Caño', unidadMedida: 'metro', stockActual: 1, stockMinimo: 5, faltante: 4 },
      { codigo: 'CA-3', nombre: 'Codo', unidadMedida: 'unidad', stockActual: 0, stockMinimo: 5, faltante: 5 },
    ]);
    guardado = {
      'stock-CA-1': { leida: true },
      'stock-CA-2': { eliminada: true, leida: true },
    };

    const resultado = await obtenerDelUsuario({ rol: 'administrador', identificador: 'Admin' });

    expect(resultado.notificaciones.map(({ clave, leida }) => ({ clave, leida }))).toEqual([
      { clave: 'stock-CA-1', leida: true },
      { clave: 'stock-CA-3', leida: false },
    ]);
    expect(resultado.noLeidas).toBe(1);
  });

  test('el tecnico recibe sus tareas pendientes, la ultima asignada primero', async () => {
    obtenerDelTecnico.mockResolvedValue({
      tareas: [
        tarea(1, 1, { fechaAsignacion: '2026-11-10T10:00:00Z' }),
        tarea(1, 2, { fechaAsignacion: '2026-11-12T10:00:00Z' }),
        tarea(3, 1, { fechaAsignacion: '2026-11-15T10:00:00Z' }),
      ],
      pendientes: 3,
    });

    const { notificaciones } = await obtenerDelUsuario({ rol: 'tecnico', identificador: 'T-100' });

    expect(obtenerDelTecnico).toHaveBeenCalledWith('T-100', { soloPendientes: true });
    expect(obtenerAlertasStock).not.toHaveBeenCalled();
    expect(notificaciones.map((notificacion) => notificacion.clave)).toEqual(['tarea-3-1', 'tarea-1-2', 'tarea-1-1']);
    expect(notificaciones[2]).toEqual({
      clave: 'tarea-1-1',
      tipo: 'Tarea',
      titulo: 'Te asignaron la tarea «Tarea 1-1»',
      detalle: 'Es de la OT #1. Prioridad alta.',
      enlace: '/tareas/1/1',
      accion: 'Ver tarea',
      fecha: '2026-11-10T10:00:00Z',
      leida: false,
    });
  });

  describe('el mensaje de cada tarea del tecnico', () => {
    beforeEach(() => {
      // Las 23 en Argentina: en UTC ya es el 26, y la tarea del 25 todavia es de hoy.
      jest.setSystemTime(new Date('2026-10-26T02:00:00Z'));
    });

    async function primeraDe(datos) {
      obtenerDelTecnico.mockResolvedValue({ tareas: [tarea(7, 2, datos)], pendientes: 1 });
      const { notificaciones } = await obtenerDelUsuario({ rol: 'tecnico', identificador: 'T-100' });
      return notificaciones[0];
    }

    test('una tarea sin empezar dice donde es y cuando empieza', async () => {
      const notificacion = await primeraDe({
        fechaPrevista: '2026-10-27',
        ubicacion: { edificio: 'Edificio Central', espacio: 'Aula 3' },
      });

      expect(notificacion).toMatchObject({
        titulo: 'Te asignaron la tarea «Tarea 7-2»',
        detalle: 'Es de la OT #7 en Edificio Central, Aula 3. Prioridad alta. Empieza el 27/10/2026.',
      });
    });

    test('una tarea cuya fecha prevista es hoy avisa que hay que realizarla, con otra clave', async () => {
      const notificacion = await primeraDe({ fechaPrevista: '2026-10-25', fechaAsignacion: '2026-10-01T10:00:00Z' });

      expect(notificacion).toEqual({
        clave: 'tarea-7-2-hoy',
        tipo: 'Tarea',
        titulo: 'Hoy tenés que realizar la tarea «Tarea 7-2»',
        detalle: 'Es de la OT #7. Prioridad alta. Fecha prevista: hoy, 25/10/2026.',
        enlace: '/tareas/7/2',
        accion: 'Ver tarea',
        // No la de la asignacion: la de cuando se le mostro el aviso de hoy.
        fecha: PRIMERA_VEZ,
        leida: false,
      });
    });

    test('una tarea sin empezar con la fecha prevista ya pasada figura atrasada', async () => {
      const notificacion = await primeraDe({ estado: 'Pendiente', fechaPrevista: '2026-10-20' });

      expect(notificacion).toMatchObject({
        titulo: 'Tarea «Tarea 7-2» está atrasada',
        detalle: 'Es de la OT #7. Prioridad alta. Tenía que empezar el 20/10/2026.',
      });
    });

    test('una tarea en ejecucion avisa que falta finalizarla, aunque su fecha haya pasado', async () => {
      const notificacion = await primeraDe({ estado: 'En ejecución', fechaPrevista: '2026-10-20' });

      expect(notificacion).toMatchObject({
        titulo: 'Falta finalizar la tarea «Tarea 7-2»',
        detalle: 'Es de la OT #7. Prioridad alta.',
      });
    });
  });

  describe('el solicitante', () => {
    test('recibe sus tickets validados, rechazados y resueltos, el mas nuevo primero', async () => {
      obtenerTickets.mockResolvedValue([
        {
          id: 3,
          estado: 'Rechazado',
          fechaAlta: '2026-11-22T12:00:00Z',
          motivoRechazo: 'Está duplicado.',
          codigoActivo: 'AA-01',
        },
        {
          id: 2,
          estado: 'Cerrado',
          fechaAlta: '2026-11-15T12:00:00Z',
          codigoActivo: 'AA-02',
          ot: { id: 9, estado: 'Finalizada', fechaAlta: '2026-11-17T12:00:00Z', fechaCierre: '2026-11-21T13:00:00Z' },
        },
        { id: 1, estado: 'Creado', fechaAlta: '2026-11-23T10:00:00Z', codigoActivo: 'AA-03', ot: null },
      ]);

      const { verMas, notificaciones } = await obtenerDelUsuario({ rol: 'autorizado', identificador: 'A-1' });

      expect(obtenerTickets).toHaveBeenCalledWith({}, { rol: 'autorizado', identificador: 'A-1' });
      expect(verMas).toBe('/notificaciones');
      expect(notificaciones).toEqual([
        {
          clave: 'ticket-rechazado-3',
          tipo: 'Ticket',
          titulo: 'Tu ticket #3 fue rechazado',
          detalle: 'Motivo: Está duplicado.',
          enlace: '/tickets/3',
          accion: 'Ver ticket',
          fecha: '2026-11-22T12:00:00Z',
          leida: false,
        },
        {
          clave: 'ot-finalizada-9',
          tipo: 'Orden de trabajo',
          titulo: 'Se resolvió tu ticket #2',
          detalle: 'La OT #9 del activo AA-02 finalizó el 21/11/2026.',
          enlace: '/tickets/2',
          accion: 'Ver ticket',
          fecha: '2026-11-21T13:00:00Z',
          leida: false,
        },
        {
          clave: 'ticket-validado-2',
          tipo: 'Ticket',
          titulo: 'Tu ticket #2 fue validado',
          detalle: 'Se generó la OT #9 para el activo AA-02.',
          enlace: '/tickets/2',
          accion: 'Ver ticket',
          fecha: '2026-11-17T12:00:00Z',
          leida: false,
        },
      ]);
    });

    test('lo que paso hace mas de una semana ya no aparece', async () => {
      obtenerTickets.mockResolvedValue([
        { id: 5, estado: 'Rechazado', fechaAlta: '2026-11-01T12:00:00Z' },
        {
          id: 6,
          estado: 'Cerrado',
          fechaAlta: '2026-10-01T12:00:00Z',
          ot: { id: 10, estado: 'Finalizada', fechaAlta: '2026-10-02T12:00:00Z', fechaCierre: '2026-10-10T12:00:00Z' },
        },
      ]);

      const { notificaciones } = await obtenerDelUsuario({ rol: 'autorizado', identificador: 'A-1' });

      expect(notificaciones).toEqual([]);
    });
  });

  test('un rol sin notificaciones recibe la lista vacia y no toca la tabla', async () => {
    const resultado = await obtenerDelUsuario({ rol: 'desconocido', identificador: 'X-1' });

    expect(resultado).toEqual({ verMas: null, noLeidas: 0, notificaciones: [] });
    expect(estado.sincronizar).not.toHaveBeenCalled();
  });
});

describe('leer y eliminar', () => {
  test('cada accion se hace sobre el usuario de la sesion', async () => {
    const usuario = { rol: 'tecnico', identificador: 'T-100' };

    await marcarLeida(usuario, 'tarea-1-1', false);
    await marcarTodasLeidas(usuario);
    await eliminar(usuario, 'tarea-1-2');

    expect(estado.marcarLeida).toHaveBeenCalledWith('T-100', 'tarea-1-1', false);
    expect(estado.marcarTodasLeidas).toHaveBeenCalledWith('T-100');
    expect(estado.eliminar).toHaveBeenCalledWith('T-100', 'tarea-1-2');
  });
});
