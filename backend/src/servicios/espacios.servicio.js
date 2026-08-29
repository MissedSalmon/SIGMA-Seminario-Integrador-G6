/**
 * Reglas de negocio de los espacios (HU-2).
 *
 * Un espacio es un lugar dentro de un edificio: aula, laboratorio, oficina,
 * pasillo o area comun. Siempre pertenece a un edificio.
 *
 * TEMPORAL: trabaja contra src/datos-mock/ hasta que exista la base de datos.
 */
import {
  tablas,
  proximoId,
  TIPOS_DE_ESPACIO,
} from '../datos-mock/estructuraEdilicia.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

function mismoNombre(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function validar({ idEdificio, nombre, tipo, piso, numero, dimensiones }, idIgnorado = null) {
  const nombreLimpio = limpiar(nombre);
  const tipoLimpio = limpiar(tipo);
  const edificio = Number(idEdificio);

  if (!nombreLimpio) {
    throw datoInvalido('El nombre del espacio es obligatorio.');
  }

  if (!Number.isInteger(edificio)) {
    throw datoInvalido('Hay que elegir a que edificio pertenece el espacio.');
  }

  const existeEdificio = tablas.edificios.some((fila) => fila.idEdificio === edificio);
  if (!existeEdificio) {
    throw datoInvalido(`No existe el edificio ${edificio}.`);
  }

  if (!tipoLimpio) {
    throw datoInvalido('Hay que elegir el tipo de espacio.');
  }

  if (!TIPOS_DE_ESPACIO.includes(tipoLimpio)) {
    throw datoInvalido(
      `El tipo "${tipoLimpio}" no es valido. Opciones: ${TIPOS_DE_ESPACIO.join(', ')}.`
    );
  }

  // Dos espacios pueden llamarse igual si estan en edificios distintos
  // (Aula 1 del Central y Aula 1 del Anexo), pero no dentro del mismo.
  const duplicado = tablas.espacios.some(
    (espacio) =>
      espacio.idEspacio !== idIgnorado &&
      espacio.idEdificio === edificio &&
      mismoNombre(espacio.nombre, nombreLimpio)
  );

  if (duplicado) {
    throw conflicto(`Ese edificio ya tiene un espacio llamado "${nombreLimpio}".`);
  }

  return {
    idEdificio: edificio,
    nombre: nombreLimpio,
    tipo: tipoLimpio,
    piso: limpiar(piso),
    numero: limpiar(numero),
    dimensiones: limpiar(dimensiones),
  };
}

/**
 * Le agrega a un espacio el nombre de su edificio.
 * El listado lo necesita para no mostrar un numero suelto.
 */
function conEdificio(espacio) {
  const edificio = tablas.edificios.find((fila) => fila.idEdificio === espacio.idEdificio);
  return { ...espacio, nombreEdificio: edificio?.nombre ?? '(edificio eliminado)' };
}

/**
 * Lista los espacios.
 * @param {number} [idEdificio] - si viene, devuelve solo los de ese edificio.
 */
export async function obtenerTodos(idEdificio = null) {
  const filas = idEdificio
    ? tablas.espacios.filter((espacio) => espacio.idEdificio === idEdificio)
    : tablas.espacios;

  return filas
    .map(conEdificio)
    .sort(
      (a, b) =>
        a.nombreEdificio.localeCompare(b.nombreEdificio, 'es') ||
        a.nombre.localeCompare(b.nombre, 'es')
    );
}

export async function obtenerPorId(idEspacio) {
  const espacio = tablas.espacios.find((fila) => fila.idEspacio === idEspacio);

  if (!espacio) {
    throw noEncontrado(`No existe el espacio ${idEspacio}.`);
  }

  return conEdificio(espacio);
}

export async function crear(datos) {
  const validados = validar(datos);

  const nuevo = {
    idEspacio: proximoId('espacios', 'idEspacio'),
    ...validados,
  };

  tablas.espacios.push(nuevo);
  return conEdificio(nuevo);
}

export async function actualizar(idEspacio, datos) {
  const espacio = tablas.espacios.find((fila) => fila.idEspacio === idEspacio);

  if (!espacio) {
    throw noEncontrado(`No existe el espacio ${idEspacio}.`);
  }

  Object.assign(espacio, validar(datos, idEspacio));
  return conEdificio(espacio);
}

/** No se puede borrar un espacio que tiene areas asociadas. */
export async function eliminar(idEspacio) {
  const espacio = tablas.espacios.find((fila) => fila.idEspacio === idEspacio);

  if (!espacio) {
    throw noEncontrado(`No existe el espacio ${idEspacio}.`);
  }

  const areasDelEspacio = tablas.areas.filter((area) => area.idEspacio === idEspacio).length;

  if (areasDelEspacio > 0) {
    throw conflicto(
      `No se puede eliminar "${espacio.nombre}" porque tiene ${areasDelEspacio} ` +
        'area(s) asociada(s). Elimina primero las areas.'
    );
  }

  const posicion = tablas.espacios.indexOf(espacio);
  tablas.espacios.splice(posicion, 1);

  return espacio;
}

/** La lista de tipos, para que el formulario arme el desplegable. */
export async function obtenerTipos() {
  return TIPOS_DE_ESPACIO;
}
