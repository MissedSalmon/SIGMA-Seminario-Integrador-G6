/**
 * Pruebas de los datos enumerados (src/utiles/enumerados.js).
 *
 * Los numeros ya estan guardados en la base: si alguien cambia el orden de una
 * lista, los datos viejos pasan a significar otra cosa. Estas pruebas fijan el
 * numero de cada valor tal como esta en la migracion 20261010120000.
 */
import {
  ENUM_ESTADO_ACTIVO,
  ENUM_ESTADO_ASIGNACION_TECNICO,
  ENUM_ESTADO_HERRAMIENTA,
  ENUM_ESTADO_OT,
  ENUM_ESTADO_TAREA,
  ENUM_ESTADO_TICKET,
  ENUM_PRIORIDAD,
} from '../src/utiles/enumerados.js';

describe('el numero de cada valor no cambia', () => {
  test.each([
    [ENUM_ESTADO_ACTIVO, ['Operativo', 'En mantenimiento', 'Fuera de servicio', 'Retirado']],
    [ENUM_ESTADO_TICKET, ['Creado', 'Validado', 'Asignado', 'En ejecución', 'Finalizado', 'Cerrado', 'Rechazado']],
    [ENUM_ESTADO_OT, ['Creada', 'Asignada', 'En ejecución', 'Finalizada', 'Cancelada']],
    [ENUM_ESTADO_TAREA, ['Creada', 'Asignada', 'En ejecución', 'Pendiente', 'Finalizada', 'Cancelada']],
    [ENUM_PRIORIDAD, ['Alta', 'Media', 'Baja']],
    [ENUM_ESTADO_ASIGNACION_TECNICO, ['Pendiente', 'Asignada', 'En curso', 'Finalizada', 'Cancelada']],
    [ENUM_ESTADO_HERRAMIENTA, ['Disponible', 'En uso', 'Fuera de servicio']],
  ])('%#', (enumerado, textos) => {
    expect(enumerado.textos).toEqual(textos);
    textos.forEach((texto, posicion) => {
      expect(enumerado.codigo(texto)).toBe(posicion + 1);
      expect(enumerado.texto(posicion + 1)).toBe(texto);
    });
  });
});

describe('codigo', () => {
  test('un texto que no es del enumerado es un error 400', () => {
    expect(() => ENUM_ESTADO_TICKET.codigo('ABIERTO')).toThrow('no es un estado de ticket válido');

    try {
      ENUM_ESTADO_TICKET.codigo('ABIERTO');
    } catch (error) {
      expect(error.estado).toBe(400);
    }
  });
});

describe('texto', () => {
  test('acepta el numero escrito como texto', () => {
    expect(ENUM_PRIORIDAD.texto('1')).toBe('Alta');
  });

  test('un numero fuera de la lista o vacio devuelve null', () => {
    expect(ENUM_PRIORIDAD.texto(0)).toBeNull();
    expect(ENUM_PRIORIDAD.texto(4)).toBeNull();
    expect(ENUM_PRIORIDAD.texto(null)).toBeNull();
  });
});
