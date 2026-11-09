import { diasEntre, soloDia, sumarDias, sumarPeriodo } from '../src/utiles/periodicidad.js';

describe('sumarPeriodo', () => {
  test('ejemplo de la consigna: cada aire cuenta desde su propia alta', () => {
    expect(sumarPeriodo('2026-06-13', 6, 'meses')).toBe('2026-12-13');
    expect(sumarPeriodo('2026-08-20', 6, 'meses')).toBe('2027-02-20');
  });

  test('fin de mes: si el mes destino es más corto, queda en su último día', () => {
    expect(sumarPeriodo('2027-01-31', 1, 'meses')).toBe('2027-02-28');
    expect(sumarPeriodo('2028-01-31', 1, 'meses')).toBe('2028-02-29');
    expect(sumarPeriodo('2026-08-31', 6, 'meses')).toBe('2027-02-28');
    expect(sumarPeriodo('2026-03-31', 1, 'meses')).toBe('2026-04-30');
  });

  test('años bisiestos', () => {
    expect(sumarPeriodo('2028-02-29', 1, 'anios')).toBe('2029-02-28');
    expect(sumarPeriodo('2028-02-29', 4, 'anios')).toBe('2032-02-29');
    expect(sumarPeriodo('2028-02-28', 1, 'dias')).toBe('2028-02-29');
  });

  test('semanas y días cruzando el año', () => {
    expect(sumarPeriodo('2026-12-28', 1, 'semanas')).toBe('2027-01-04');
    expect(sumarPeriodo('2026-12-31', 1, 'dias')).toBe('2027-01-01');
    expect(sumarPeriodo('2026-11-15', 2, 'meses')).toBe('2027-01-15');
  });

  test('acepta la fecha con hora, como viene de una columna timestamptz', () => {
    expect(sumarPeriodo('2026-10-27T22:55:16.214+00:00', 6, 'meses')).toBe('2027-04-27');
  });

  test('rechaza unidad o intervalo inválidos', () => {
    expect(() => sumarPeriodo('2026-01-01', 1, 'horas')).toThrow('no es una unidad de frecuencia');
    expect(() => sumarPeriodo('2026-01-01', 0, 'meses')).toThrow('mayor que 0');
  });
});

describe('sumarDias, diasEntre y soloDia', () => {
  test('cuentan días calendario', () => {
    expect(sumarDias('2026-11-28', 7)).toBe('2026-12-05');
    expect(diasEntre('2026-11-03', '2026-11-10')).toBe(7);
    expect(diasEntre('2026-11-10', '2026-11-03')).toBe(-7);
    expect(soloDia(null)).toBeNull();
  });
});
