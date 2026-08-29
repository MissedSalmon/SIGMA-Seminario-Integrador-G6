/**
 * Reglas de negocio de los edificios (HU-1).
 *
 * TEMPORAL: trabaja contra src/datos-mock/ porque la base de datos todavia no
 * existe. Cuando este, se reemplazan estas funciones por consultas a Supabase
 * y el resto del sistema no se entera: los controladores siguen igual.
 */
import { tablas, proximoId } from '../datos-mock/estructuraEdilicia.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

/** Limpia un texto que llega del formulario. Devuelve null si queda vacio. */
function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/** Compara nombres sin distinguir mayusculas ni espacios de mas. */
function mismoNombre(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Valida los datos de un edificio.
 * @param {number|null} idIgnorado - al editar, el propio edificio no cuenta
 *   como duplicado de si mismo.
 */
function validar({ nombre, direccion }, idIgnorado = null) {
  const nombreLimpio = limpiar(nombre);

  if (!nombreLimpio) {
    throw datoInvalido('El nombre del edificio es obligatorio.');
  }

  const duplicado = tablas.edificios.some(
    (edificio) =>
      edificio.idEdificio !== idIgnorado && mismoNombre(edificio.nombre, nombreLimpio)
  );

  if (duplicado) {
    throw conflicto(`Ya existe un edificio con el nombre "${nombreLimpio}".`);
  }

  return { nombre: nombreLimpio, direccion: limpiar(direccion) };
}

/** Lista todos los edificios, ordenados por nombre. */
export async function obtenerTodos() {
  return [...tablas.edificios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

/** Busca un edificio por su id. Si no esta, lanza 404. */
export async function obtenerPorId(idEdificio) {
  const edificio = tablas.edificios.find((fila) => fila.idEdificio === idEdificio);

  if (!edificio) {
    throw noEncontrado(`No existe el edificio ${idEdificio}.`);
  }

  return edificio;
}

/** Da de alta un edificio. */
export async function crear(datos) {
  const validados = validar(datos);

  const nuevo = {
    idEdificio: proximoId('edificios', 'idEdificio'),
    ...validados,
  };

  tablas.edificios.push(nuevo);
  return nuevo;
}

/** Modifica un edificio existente. */
export async function actualizar(idEdificio, datos) {
  const edificio = await obtenerPorId(idEdificio);
  const validados = validar(datos, idEdificio);

  Object.assign(edificio, validados);
  return edificio;
}

/**
 * Da de baja un edificio.
 *
 * No se puede borrar un edificio que todavia tiene espacios cargados: se
 * perderia la ubicacion de los activos que estan en esos espacios.
 */
export async function eliminar(idEdificio) {
  const edificio = await obtenerPorId(idEdificio);

  const espaciosDelEdificio = tablas.espacios.filter(
    (espacio) => espacio.idEdificio === idEdificio
  ).length;

  if (espaciosDelEdificio > 0) {
    throw conflicto(
      `No se puede eliminar "${edificio.nombre}" porque tiene ${espaciosDelEdificio} ` +
        'espacio(s) cargado(s). Elimina primero los espacios.'
    );
  }

  const posicion = tablas.edificios.indexOf(edificio);
  tablas.edificios.splice(posicion, 1);

  return edificio;
}
