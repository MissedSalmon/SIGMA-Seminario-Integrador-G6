/**
 * Pruebas de las notificaciones de la campana: cada rol recibe las suyas.
 *
 * Las alertas de stock y las tareas del tecnico ya tienen sus propias pruebas;
 * aca se simulan esos dos servicios y se mira que le toca a cada rol.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/servicios/inventario.servicio.js', () => ({
  obtenerAlertasStock: jest.fn(),
}));

jest.unstable_mockModule('../src/servicios/tareas.servicio.js', () => ({
  obtenerDelTecnico: jest.fn(),
}));

const { obtenerAlertasStock } = await import('../src/servicios/inventario.servicio.js');
const { obtenerDelTecnico } = await import('../src/servicios/tareas.servicio.js');
const { obtenerDelUsuario } = await import('../src/servicios/notificaciones.servicio.js');

function tarea(idOt, idTarea) {
  return { idOt, idTarea, descripcion: `Tarea ${idOt}-${idTarea}`, prioridad: 'Alta', estado: 'Asignada' };
}

afterEach(() => {
  jest.clearAllMocks();
});

describe('obtenerDelUsuario', () => {
  test('el administrador recibe las alertas de stock minimo', async () => {
    obtenerAlertasStock.mockResolvedValue([
      { codigo: 'CA-1', nombre: 'Cable', stockActual: 2, stockMinimo: 10, faltante: 8 },
    ]);

    const resultado = await obtenerDelUsuario({ rol: 'administrador', identificador: 'admin' });

    expect(resultado).toEqual({
      verMas: '/notificaciones',
      notificaciones: [
        {
          clave: 'stock-CA-1',
          titulo: 'Stock bajo: Cable',
          detalle: 'Quedan 2 · mínimo 10',
          enlace: '/inventario/materiales/CA-1',
        },
      ],
    });
    expect(obtenerDelTecnico).not.toHaveBeenCalled();
  });

  test('el tecnico recibe sus tareas pendientes, buscadas por el legajo de la sesion', async () => {
    obtenerDelTecnico.mockResolvedValue({ tareas: [tarea(1, 1)], pendientes: 1 });

    const resultado = await obtenerDelUsuario({ rol: 'tecnico', identificador: 'T-100' });

    expect(obtenerDelTecnico).toHaveBeenCalledWith('T-100', { soloPendientes: true });
    expect(obtenerAlertasStock).not.toHaveBeenCalled();
    expect(resultado.verMas).toBe('/notificaciones');
    expect(resultado.notificaciones).toEqual([
      {
        clave: 'tarea-1-1',
        titulo: 'Te asignaron la tarea «Tarea 1-1»',
        detalle: 'Es de la OT #1. Prioridad alta.',
        enlace: '/tareas/1/1',
      },
    ]);
  });

  test('al tecnico le llega primero la ultima tarea asignada', async () => {
    obtenerDelTecnico.mockResolvedValue({ tareas: [tarea(1, 1), tarea(1, 2), tarea(3, 1)], pendientes: 3 });

    const { notificaciones } = await obtenerDelUsuario({ rol: 'tecnico', identificador: 'T-100' });

    expect(notificaciones.map((notificacion) => notificacion.clave)).toEqual(['tarea-3-1', 'tarea-1-2', 'tarea-1-1']);
  });

  describe('el mensaje de cada tarea del tecnico', () => {
    beforeEach(() => {
      // Las 23 en Argentina: en UTC ya es el 26, y la tarea del 25 todavia no tiene que figurar atrasada.
      jest.useFakeTimers({ now: new Date('2026-10-26T02:00:00Z') });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    async function mensajeDe(datos) {
      obtenerDelTecnico.mockResolvedValue({ tareas: [{ ...tarea(7, 2), ...datos }], pendientes: 1 });
      const { notificaciones } = await obtenerDelUsuario({ rol: 'tecnico', identificador: 'T-100' });
      return { titulo: notificaciones[0].titulo, detalle: notificaciones[0].detalle };
    }

    test('una tarea sin empezar dice donde es y cuando empieza', async () => {
      const mensaje = await mensajeDe({
        fechaPrevista: '2026-10-25',
        ubicacion: { edificio: 'Edificio Central', espacio: 'Aula 3' },
      });

      expect(mensaje).toEqual({
        titulo: 'Te asignaron la tarea «Tarea 7-2»',
        detalle: 'Es de la OT #7 en Edificio Central, Aula 3. Prioridad alta. Empieza el 25/10/2026.',
      });
    });

    test('una tarea sin empezar con la fecha prevista ya pasada figura atrasada', async () => {
      const mensaje = await mensajeDe({ estado: 'Pendiente', fechaPrevista: '2026-10-20' });

      expect(mensaje).toEqual({
        titulo: 'Tarea «Tarea 7-2» está atrasada',
        detalle: 'Es de la OT #7. Prioridad alta. Tenía que empezar el 20/10/2026.',
      });
    });

    test('una tarea en ejecucion avisa que falta finalizarla, aunque su fecha haya pasado', async () => {
      const mensaje = await mensajeDe({ estado: 'En ejecución', fechaPrevista: '2026-10-20' });

      expect(mensaje).toEqual({
        titulo: 'Falta finalizar la tarea «Tarea 7-2»',
        detalle: 'Es de la OT #7. Prioridad alta.',
      });
    });
  });

  test('un rol sin notificaciones recibe la lista vacia', async () => {
    const resultado = await obtenerDelUsuario({ rol: 'autorizado', identificador: 'A-1' });

    expect(resultado).toEqual({ verMas: null, notificaciones: [] });
    expect(obtenerAlertasStock).not.toHaveBeenCalled();
    expect(obtenerDelTecnico).not.toHaveBeenCalled();
  });
});
