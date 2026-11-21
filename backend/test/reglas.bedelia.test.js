/**
 * Escenario completo de Bedelía (21/11/2026): un área con todas las aulas y su
 * solicitante. Controla las reglas de negocio de punta a punta con los
 * servicios reales de áreas y tickets:
 *
 *   - un espacio es de un área como máximo;
 *   - un área puede tener espacios en varios edificios;
 *   - el solicitante reporta sólo los activos de los espacios de su área,
 *     menos los retirados;
 *   - el ticket queda en el área del espacio de su activo;
 *   - el administrador no registra tickets.
 *
 * En vez de respuestas fijas usa una base en memoria que entiende las
 * consultas de esos servicios, así cada paso ve lo que dejó el anterior.
 * Es el mismo caso que se probó contra la base real el 21/11/2026.
 */
import { jest } from '@jest/globals';

const RETIRADO = 4;

let tablas;

function cargarEscenario() {
  tablas = {
    edificio: [
      { edificio_id: 1, edificio_nom: 'Edificio Central' },
      { edificio_id: 2, edificio_nom: 'Anexo I' },
    ],
    tipo_espacio: [
      { tipo_espacio_id: 2, tipo_espacio_nom: 'Aula' },
      { tipo_espacio_id: 4, tipo_espacio_nom: 'Laboratorio' },
    ],
    area: [
      { area_id: 1, area_nom: 'Departamento de Ingeniería en Sistemas de Información', autorizado_legajo: '1235' },
      { area_id: 3, area_nom: 'Departamento de Ingeniería Electromecánica', autorizado_legajo: '1234' },
    ],
    espacio: [
      { espacio_id: 3, espacio_num: '1.1', edificio_id: 1, tipo_espacio_id: 2, area_id: 3 },
      { espacio_id: 9, espacio_num: '1.6', edificio_id: 1, tipo_espacio_id: 2, area_id: null },
      { espacio_id: 5, espacio_num: '0.2', edificio_id: 2, tipo_espacio_id: 2, area_id: null },
      { espacio_id: 4, espacio_num: '1.2', edificio_id: 1, tipo_espacio_id: 4, area_id: 1 },
    ],
    tipo_activo: [{ tipo_activo_id: 1, tipo_activo_nom: 'Aires acondicionados' }],
    activo: [
      { activo_codigo: 'AC-001', espacio_id: 3, tipo_activo_id: 1, activo_estado: 1 },
      { activo_codigo: 'AC-007', espacio_id: 5, tipo_activo_id: 1, activo_estado: 1 },
      { activo_codigo: 'PC-005', espacio_id: 9, tipo_activo_id: 1, activo_estado: 1 },
      { activo_codigo: 'PC-099', espacio_id: 9, tipo_activo_id: 1, activo_estado: RETIRADO },
      { activo_codigo: 'AC-002', espacio_id: 4, tipo_activo_id: 1, activo_estado: 1 },
    ],
    autorizado: [
      { autorizado_legajo: '1234', autorizado_nom_ape: 'Martin Guimenez' },
      { autorizado_legajo: '1235', autorizado_nom_ape: 'Maria Paz' },
      { autorizado_legajo: '7001', autorizado_nom_ape: 'Bedelía Prueba' },
    ],
    ticket: [],
  };
}

const CLAVES = { area: 'area_id', ticket: 'ticket_id' };
const buscar = (tabla, columna, valor) => tablas[tabla].find((fila) => fila[columna] === valor) ?? null;

/** La fila con sus relaciones, como las arma Supabase en los select embebidos. */
function conRelaciones(tabla, fila) {
  if (!fila) return null;
  if (tabla === 'espacio') {
    return {
      ...fila,
      area: buscar('area', 'area_id', fila.area_id),
      tipo_espacio: buscar('tipo_espacio', 'tipo_espacio_id', fila.tipo_espacio_id),
      edificio: buscar('edificio', 'edificio_id', fila.edificio_id),
    };
  }
  if (tabla === 'area') {
    return {
      ...fila,
      espacio: tablas.espacio.filter((e) => e.area_id === fila.area_id).map((e) => conRelaciones('espacio', e)),
    };
  }
  if (tabla === 'activo') {
    return {
      ...fila,
      espacio: conRelaciones('espacio', buscar('espacio', 'espacio_id', fila.espacio_id)),
      tipo_activo: buscar('tipo_activo', 'tipo_activo_id', fila.tipo_activo_id),
    };
  }
  if (tabla === 'ticket') {
    return {
      ...fila,
      activo: conRelaciones('activo', buscar('activo', 'activo_codigo', fila.activo_codigo)),
      autorizado: buscar('autorizado', 'autorizado_legajo', fila.autorizado_legajo),
      orden_trabajo: [],
    };
  }
  return { ...fila };
}

/** "area.autorizado_legajo" sobre la fila con relaciones. */
const valorEn = (fila, ruta) => ruta.split('.').reduce((actual, parte) => actual?.[parte], fila);

function consulta(tabla) {
  const filtros = [];
  let operacion = { tipo: 'select' };

  const ejecutar = () => {
    const pasa = (fila) => filtros.every((filtro) => filtro(conRelaciones(tabla, fila)));

    if (operacion.tipo === 'insert') {
      const fila = { [CLAVES[tabla]]: tablas[tabla].length + 100, ...operacion.datos };
      tablas[tabla].push(fila);
      return [conRelaciones(tabla, fila)];
    }
    if (operacion.tipo === 'update') {
      const cambiadas = tablas[tabla].filter(pasa);
      cambiadas.forEach((fila) => Object.assign(fila, operacion.datos));
      return cambiadas.map((fila) => conRelaciones(tabla, fila));
    }
    return tablas[tabla].filter(pasa).map((fila) => conRelaciones(tabla, fila));
  };

  const cadena = {
    select: () => cadena,
    order: () => cadena,
    insert: (datos) => ((operacion = { tipo: 'insert', datos }), cadena),
    update: (datos) => ((operacion = { tipo: 'update', datos }), cadena),
    eq: (columna, valor) => (filtros.push((fila) => valorEn(fila, columna) === valor), cadena),
    neq: (columna, valor) => (filtros.push((fila) => valorEn(fila, columna) !== valor), cadena),
    in: (columna, valores) => (filtros.push((fila) => valores.includes(valorEn(fila, columna))), cadena),
    ilike: (columna, valor) =>
      (filtros.push((fila) => String(valorEn(fila, columna)).toLowerCase() === String(valor).toLowerCase()), cadena),
    not: (columna, operador, valor) => {
      if (operador === 'is') filtros.push((fila) => valorEn(fila, columna) !== valor);
      if (operador === 'in') {
        const lista = valor.replace(/[()]/g, '').split(',').map(Number);
        filtros.push((fila) => !lista.includes(valorEn(fila, columna)));
      }
      return cadena;
    },
    maybeSingle: () => Promise.resolve({ data: ejecutar()[0] ?? null, error: null }),
    single: () => Promise.resolve({ data: ejecutar()[0] ?? null, error: null }),
    then: (ok, mal) => Promise.resolve({ data: ejecutar(), error: null }).then(ok, mal),
  };
  return cadena;
}

jest.unstable_mockModule('../src/config/supabase.js', () => ({
  supabase: { from: jest.fn((tabla) => consulta(tabla)) },
}));

const areas = await import('../src/servicios/areas.servicio.js');
const tickets = await import('../src/servicios/tickets.servicio.js');

const BEDELIA = { rol: 'autorizado', identificador: '7001' };
const MARTIN = { rol: 'autorizado', identificador: '1234' };
const MARIA_PAZ = { rol: 'autorizado', identificador: '1235' };
const codigos = (lista) => lista.map((activo) => activo.codigo).sort();

describe('Bedelía con todas las aulas', () => {
  let idBedelia;

  beforeAll(() => cargarEscenario());

  test('no se puede armar con el Aula 1.1 mientras sea de Electromecánica', async () => {
    await expect(areas.crear({ nombre: 'Bedelía', idsEspacios: [3, 9, 5] })).rejects.toMatchObject({
      estado: 409,
      message: expect.stringContaining('Electromecánica'),
    });
    expect(tablas.area.some((area) => area.area_nom === 'Bedelía')).toBe(false);
  });

  test('Electromecánica suelta el aula y Bedelía se arma con las 3 aulas de dos edificios', async () => {
    await areas.actualizar(3, { nombre: 'Departamento de Ingeniería Electromecánica', idsEspacios: [] });
    const bedelia = await areas.crear({ nombre: 'Bedelía', idsEspacios: [3, 9, 5] });
    idBedelia = bedelia.idArea;

    expect(bedelia.espacios.map((espacio) => `${espacio.nombreEdificio} - ${espacio.nombre}`)).toEqual([
      'Anexo I - Aula 0.2',
      'Edificio Central - Aula 1.1',
      'Edificio Central - Aula 1.6',
    ]);
    expect(bedelia.nombreEdificio).toBe('Anexo I / Edificio Central');
    expect(tablas.espacio.find((espacio) => espacio.espacio_id === 3).area_id).toBe(idBedelia);
  });

  test('no se repite el nombre del área, sin importar mayúsculas', async () => {
    await expect(areas.crear({ nombre: 'bedelía', idsEspacios: [] })).rejects.toMatchObject({ estado: 409 });
  });

  test('otra área no le puede sacar un aula a Bedelía', async () => {
    await expect(
      areas.actualizar(1, { nombre: 'Departamento de Ingeniería en Sistemas de Información', idsEspacios: [4, 9] })
    ).rejects.toMatchObject({ estado: 409, message: expect.stringContaining('Bedelía') });
    expect(tablas.espacio.find((espacio) => espacio.espacio_id === 9).area_id).toBe(idBedelia);
  });

  test('el solicitante de Bedelía ve sólo los activos de sus aulas, sin los retirados', async () => {
    // El alta del solicitante (autorizados.servicio) lo deja como responsable del área.
    tablas.area.find((area) => area.area_id === idBedelia).autorizado_legajo = '7001';

    expect(codigos(await tickets.activosQuePuedeReportar('7001'))).toEqual(['AC-001', 'AC-007', 'PC-005']);
  });

  test('Electromecánica, sin espacios, ya no ve ningún activo', async () => {
    expect(await tickets.activosQuePuedeReportar('1234')).toEqual([]);
    await expect(
      tickets.crear({ codigoActivo: 'AC-001', descripcion: 'No enfría' }, MARTIN)
    ).rejects.toMatchObject({ estado: 400 });
  });

  test('las otras áreas no cambian', async () => {
    expect(codigos(await tickets.activosQuePuedeReportar('1235'))).toEqual(['AC-002']);
  });

  test('Bedelía registra un ticket de un aula del Anexo I y queda en su área', async () => {
    const nuevo = await tickets.crear({ codigoActivo: 'AC-007', descripcion: 'El aire no enfría' }, BEDELIA);
    const detalle = await tickets.obtenerPorId(nuevo.id, BEDELIA);

    expect(detalle.estado).toBe('Creado');
    expect(detalle.registradoPor.legajo).toBe('7001');
    expect(detalle.idArea).toBe(idBedelia);
    expect(detalle.nombreArea).toBe('Bedelía');
    expect(`${detalle.activo.nombreEdificio} — ${detalle.activo.nombreEspacio}`).toBe('Anexo I — Aula 0.2');
  });

  test('Bedelía no puede reportar un activo de un laboratorio ni uno retirado', async () => {
    const antes = tablas.ticket.length;

    await expect(tickets.crear({ codigoActivo: 'AC-002', descripcion: 'x' }, BEDELIA)).rejects.toMatchObject({ estado: 400 });
    await expect(tickets.crear({ codigoActivo: 'PC-099', descripcion: 'x' }, BEDELIA)).rejects.toMatchObject({ estado: 400 });
    expect(tablas.ticket).toHaveLength(antes);
  });

  test('otro solicitante no puede abrir el ticket de Bedelía', async () => {
    const [deBedelia] = tablas.ticket;
    await expect(tickets.obtenerPorId(deBedelia.ticket_id, MARIA_PAZ)).rejects.toMatchObject({ estado: 404 });
  });

  test('el administrador no registra tickets, ni de las aulas', async () => {
    await expect(
      tickets.crear({ codigoActivo: 'AC-007', descripcion: 'x' }, { rol: 'administrador', identificador: '1' })
    ).rejects.toMatchObject({ estado: 403 });
  });
});
