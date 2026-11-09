/**
 * La regla de la contraseña nueva, compartida por el alta de usuarios y el cambio de contraseña.
 */
import { validarPasswordNueva } from '../src/utiles/contrasenas.js';

describe('validarPasswordNueva', () => {
  test('acepta desde 6 caracteres, espacios incluidos', () => {
    expect(validarPasswordNueva('123456')).toBeNull();
    expect(validarPasswordNueva('  ab  ')).toBeNull();
  });

  test('rechaza menos de 6 caracteres o un valor que no es texto', () => {
    expect(validarPasswordNueva('12345')).toMatch(/al menos 6/);
    expect(validarPasswordNueva(undefined)).toMatch(/al menos 6/);
    expect(validarPasswordNueva(123456)).toMatch(/al menos 6/);
  });

  test('rechaza más de 72 bytes, que bcrypt no llega a mirar', () => {
    expect(validarPasswordNueva('a'.repeat(72))).toBeNull();
    expect(validarPasswordNueva('a'.repeat(73))).toMatch(/más de 72/);
    // Cada "ñ" ocupa 2 bytes.
    expect(validarPasswordNueva('ñ'.repeat(37))).toMatch(/más de 72/);
  });
});
