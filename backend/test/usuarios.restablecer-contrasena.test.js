import { jest } from '@jest/globals';

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn(), rpc: jest.fn() },
}));

const { supabase } = await import('../src/config/supabase.js');
const { restablecerContrasena } = await import('../src/servicios/usuarios.servicio.js');

const usuario = {
  usuario_id: 'uuid-autorizado',
  identificador: '2042',
};

beforeEach(() => jest.clearAllMocks());

function consultaUsuario(data = usuario, error = null) {
  const cadena = {
    select: jest.fn(() => cadena),
    eq: jest.fn(() => cadena),
    maybeSingle: jest.fn().mockResolvedValue({ data, error }),
  };
  return cadena;
}

test('genera la contraseña provisoria para cualquier rol y registra al administrador', async () => {
  const cadena = consultaUsuario();
  supabase.from.mockReturnValue(cadena);
  supabase.rpc.mockResolvedValue({ data: null, error: null });

  const datos = await restablecerContrasena('2042', 'uuid-administrador');
  const argumentos = supabase.rpc.mock.calls[0][1];

  expect(datos).toMatchObject({ identificador: usuario.identificador });
  expect(datos.contrasenaProvisoria).toHaveLength(24);
  expect(argumentos.p_password_hash).toMatch(/^\$2[aby]\$/);
  expect(supabase.from).toHaveBeenCalledWith('usuario');
  expect(cadena.eq).toHaveBeenCalledWith('identificador', '2042');
  expect(supabase.rpc).toHaveBeenCalledWith('restablecer_contrasena_usuario', {
    p_usuario_id: usuario.usuario_id,
    p_password_hash: argumentos.p_password_hash,
    p_administrador_usuario_id: 'uuid-administrador',
  });
});

test('responde 404 si el usuario no tiene una cuenta', async () => {
  supabase.from.mockReturnValue(consultaUsuario(null));

  await expect(restablecerContrasena('2042', 'uuid-administrador'))
    .rejects.toMatchObject({ estado: 404 });
  expect(supabase.rpc).not.toHaveBeenCalled();
});

test('rechaza el restablecimiento sin identidad de administrador', async () => {
  await expect(restablecerContrasena('2042', null))
    .rejects.toMatchObject({ estado: 403 });
  expect(supabase.from).not.toHaveBeenCalled();
  expect(supabase.rpc).not.toHaveBeenCalled();
});

test('no devuelve la contraseña si falla el guardado del hash o la auditoría', async () => {
  supabase.from.mockReturnValue(consultaUsuario());
  supabase.rpc.mockResolvedValue({ error: { message: 'Base no disponible' } });

  await expect(restablecerContrasena('2042', 'uuid-administrador'))
    .rejects.toThrow('Base no disponible');
});