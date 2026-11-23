/**
 * Pruebas de la tabla de notificaciones leidas y eliminadas: las nuevas se
 * agregan sin leer, las que ya no se calculan se borran, y leer o eliminar una
 * que no existe responde 404.
 */
import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { sincronizar, marcarLeida, eliminar } = await import('../src/servicios/estadoNotificaciones.servicio.js');

/** Una cadena de Supabase que, al esperarla, devuelve { data, error }. */
function cadena(data = [], error = null) {
  const resultado = { data, error };
  const c = {};
  ['select', 'eq', 'in', 'delete', 'update', 'upsert'].forEach((metodo) => {
    c[metodo] = jest.fn(() => c);
  });
  c.then = (resolver, rechazar) => Promise.resolve(resultado).then(resolver, rechazar);
  return c;
}

beforeEach(() => jest.clearAllMocks());

test('agrega las nuevas sin leer, borra las que ya no estan y devuelve el estado de cada una', async () => {
  const lectura = cadena([
    { notif_clave: 'stock-CA-1', notif_fecha: '2026-11-20T12:00:00Z', notif_leida: true, notif_eliminada: false },
    { notif_clave: 'stock-VIEJO', notif_fecha: '2026-11-01T12:00:00Z', notif_leida: false, notif_eliminada: true },
  ]);
  const alta = cadena(null);
  const baja = cadena(null);
  supabase.from.mockReturnValueOnce(lectura).mockReturnValueOnce(alta).mockReturnValueOnce(baja);

  const estados = await sincronizar('Admin', ['stock-CA-1', 'ticket-nuevo-4']);

  expect(lectura.eq).toHaveBeenCalledWith('identificador', 'Admin');
  expect(alta.upsert.mock.calls[0][0]).toEqual([
    expect.objectContaining({ identificador: 'Admin', notif_clave: 'ticket-nuevo-4' }),
  ]);
  expect(baja.delete).toHaveBeenCalled();
  expect(baja.in).toHaveBeenCalledWith('notif_clave', ['stock-VIEJO']);
  expect(estados.get('stock-CA-1')).toEqual({ fecha: '2026-11-20T12:00:00Z', leida: true, eliminada: false });
  expect(estados.get('ticket-nuevo-4')).toMatchObject({ leida: false, eliminada: false });
  expect(estados.has('stock-VIEJO')).toBe(false);
});

test('si no hay nada nuevo ni viejo, sólo lee', async () => {
  supabase.from.mockReturnValueOnce(
    cadena([{ notif_clave: 'tarea-1-1', notif_fecha: '2026-11-20T12:00:00Z', notif_leida: false, notif_eliminada: false }])
  );

  await sincronizar('T-100', ['tarea-1-1']);

  expect(supabase.from).toHaveBeenCalledTimes(1);
});

test('eliminar una notificacion la deja eliminada y leida', async () => {
  const actualizacion = cadena([{ notif_clave: 'tarea-1-1' }]);
  supabase.from.mockReturnValueOnce(actualizacion);

  await eliminar('T-100', 'tarea-1-1');

  expect(actualizacion.update).toHaveBeenCalledWith({ notif_eliminada: true, notif_leida: true });
  expect(actualizacion.eq).toHaveBeenCalledWith('identificador', 'T-100');
  expect(actualizacion.eq).toHaveBeenCalledWith('notif_clave', 'tarea-1-1');
});

test('marcar una notificacion que no es del usuario responde 404', async () => {
  supabase.from.mockReturnValueOnce(cadena([]));

  await expect(marcarLeida('T-100', 'stock-CA-1', true)).rejects.toMatchObject({ estado: 404 });
});
