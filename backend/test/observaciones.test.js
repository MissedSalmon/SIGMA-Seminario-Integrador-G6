import { jest } from '@jest/globals';
import express from 'express';
import jwt from 'jsonwebtoken';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));
const { supabase } = await import('../src/config/supabase.js');
const observaciones = await import('../src/servicios/observaciones.servicio.js');
const { default: rutas } = await import('../src/rutas/tareas.rutas.js');
const { manejadorErrores: manejador } = await import('../src/middlewares/manejadorErrores.js');
const fila = {
  observacion_id: 1, ot_id: 9, tarea_id: 2, usuario_id: 'uuid-tecnico',
  observacion_texto: 'Actividad adicional', observacion_autor_nombre: 'Ana Pérez',
  observacion_fecha: '2026-10-13T12:00:00+00:00',
};
let servidor;
let direccion;
beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use('/tareas', rutas);
  app.use(manejador);
  servidor = app.listen(0, '127.0.0.1');
  await new Promise((resolver) => servidor.once('listening', resolver));
  direccion = `http://127.0.0.1:${servidor.address().port}/tareas/mias/9/2/observaciones`;
});
afterAll(() => new Promise((resolver) => servidor.close(resolver)));
beforeEach(() => jest.clearAllMocks());

async function enviar(cuerpo, rol = 'tecnico', identificador = '2030') {
  const token = jwt.sign({ rol, identificador }, process.env.JWT_SECRET || 'supersecret123');
  return fetch(direccion, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(cuerpo),
  });
}

test('crea desde API usando la sesión e ignora autor y fecha enviados', async () => {
  supabase.rpc.mockResolvedValue({ data: fila, error: null });
  const respuesta = await enviar({ texto: ' Actividad adicional ', autor: 'Falso', fecha: '1900-01-01', identificador: 'otro' });
  expect(respuesta.status).toBe(201);
  expect(supabase.rpc).toHaveBeenCalledWith('registrar_observacion_tarea', {
    p_identificador: '2030', p_ot_id: 9, p_tarea_id: 2, p_texto: 'Actividad adicional',
  });
  expect((await respuesta.json()).datos).toMatchObject({ autor: 'Ana Pérez', idUsuario: 'uuid-tecnico', fecha: fila.observacion_fecha });
});
test('rechaza solicitudes sin sesión', async () => {
  expect((await fetch(direccion, { method: 'POST' })).status).toBe(401);
  expect(supabase.rpc).not.toHaveBeenCalled();
});
test('rechaza otros roles', async () => {
  expect((await enviar({ texto: 'Nota' }, 'administrador')).status).toBe(403);
  expect(supabase.rpc).not.toHaveBeenCalled();
});
test('rechaza un técnico no asignado mediante API', async () => {
  supabase.rpc.mockResolvedValue({ data: null, error: { code: 'P0002' } });
  expect((await enviar({ texto: 'Nota' }, 'tecnico', 'otro')).status).toBe(404);
});
test.each(['', '  \n\t ', null, 123, 'a'.repeat(501)])('rechaza texto inválido (%#)', async (texto) => {
  expect((await enviar({ texto })).status).toBe(400);
  expect(supabase.rpc).not.toHaveBeenCalled();
});
test('errores de persistencia no se presentan como éxito', async () => {
  supabase.rpc.mockResolvedValue({ error: { message: 'Base no disponible' } });
  expect((await enviar({ texto: 'Nota' })).status).toBe(500);
});

function consulta(datos) {
  const cadena = {
    select: jest.fn(() => cadena), eq: jest.fn(() => cadena), order: jest.fn(() => cadena),
    then: (resolver, rechazar) => Promise.resolve({ data: datos, error: null }).then(resolver, rechazar),
  };
  return cadena;
}
test('consulta múltiples observaciones de la tarea por fecha e id', async () => {
  const segunda = { ...fila, observacion_id: 2, observacion_texto: '<script>alert(1)</script>' };
  const cadena = consulta([fila, segunda]);
  supabase.from.mockReturnValue(cadena);
  const lista = await observaciones.observacionesDeLaTarea(9, 2);
  expect(lista).toHaveLength(2);
  expect(lista[1].texto).toBe(segunda.observacion_texto);
  expect(cadena.eq).toHaveBeenCalledWith('ot_id', 9);
  expect(cadena.eq).toHaveBeenCalledWith('tarea_id', 2);
  expect(cadena.order.mock.calls).toEqual([
    ['observacion_fecha', { ascending: true }], ['observacion_id', { ascending: true }],
  ]);
});
test('el historial consulta el activo sin copiar ni duplicar observaciones', async () => {
  const cadena = consulta([fila]);
  supabase.from.mockReturnValue(cadena);
  expect(await observaciones.observacionesDelActivo('AC-001')).toEqual([expect.objectContaining({ id: 1, idOt: 9, idTarea: 2 })]);
  expect(supabase.from).toHaveBeenCalledWith('activo_historial_observacion');
  expect(cadena.eq).toHaveBeenCalledWith('activo_codigo', 'AC-001');
});
