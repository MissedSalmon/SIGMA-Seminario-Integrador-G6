/**
 * Reglas de negocio de las areas funcionales (HU-3).
 *
 * Un area es una unidad organizacional de la facultad (Departamento de
 * Sistemas, Infraestructura, Bedelia) y se ubica en un espacio.
 *
 * El responsable del area NO se carga aca: la dependencia circular
 * areas <-> autorizados se resolvio dejando el FK al area del lado de
 * `autorizados` (contexto.md, pregunta abierta 4). El responsable se asigna
 * al dar de alta al usuario autorizado, en el Sprint 6.
 *
 * TEMPORAL: trabaja contra src/datos-mock/ hasta que exista la base de datos.
 */
import { tablas, proximoId } from '../datos-mock/estructuraEdilicia.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

function mismoNombre(a, b) {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function validar({ nombre, idEspacio }, idIgnorado = null) {
  const nombreLimpio = limpiar(nombre);
  const espacio = Number(idEspacio);

  if (!nombreLimpio) {
    throw datoInvalido('El nombre del area es obligatorio.');
  }

  if (!Number.isInteger(espacio)) {
    throw datoInvalido('Hay que elegir en que espacio funciona el area.');
  }

  if (!tablas.espacios.some((fila) => fila.idEspacio === espacio)) {
    throw datoInvalido(`No existe el espacio ${espacio}.`);
  }

  // El nombre del area es unico en toda la facultad: es la unidad
  // organizacional a la que despues se le asignan los tickets.
  const duplicado = tablas.areas.some(
    (area) => area.idArea !== idIgnorado && mismoNombre(area.nombre, nombreLimpio)
  );

  if (duplicado) {
    throw conflicto(`Ya existe un area con el nombre "${nombreLimpio}".`);
  }

  return { nombre: nombreLimpio, idEspacio: espacio };
}

/** Le agrega al area el nombre de su espacio y el de su edificio. */
function conUbicacion(area) {
  const espacio = tablas.espacios.find((fila) => fila.idEspacio === area.idEspacio);
  const edificio = espacio
    ? tablas.edificios.find((fila) => fila.idEdificio === espacio.idEdificio)
    : null;

  return {
    ...area,
    nombreEspacio: espacio?.nombre ?? '(espacio eliminado)',
    nombreEdificio: edificio?.nombre ?? '',
  };
}

export async function obtenerTodos() {
  return tablas.areas
    .map(conUbicacion)
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

export async function obtenerPorId(idArea) {
  const area = tablas.areas.find((fila) => fila.idArea === idArea);

  if (!area) {
    throw noEncontrado(`No existe el area ${idArea}.`);
  }

  return conUbicacion(area);
}

export async function crear(datos) {
  const validados = validar(datos);

  const nueva = {
    idArea: proximoId('areas', 'idArea'),
    ...validados,
  };

  tablas.areas.push(nueva);
  return conUbicacion(nueva);
}

export async function actualizar(idArea, datos) {
  const area = tablas.areas.find((fila) => fila.idArea === idArea);

  if (!area) {
    throw noEncontrado(`No existe el area ${idArea}.`);
  }

  Object.assign(area, validar(datos, idArea));
  return conUbicacion(area);
}

export async function eliminar(idArea) {
  const area = tablas.areas.find((fila) => fila.idArea === idArea);

  if (!area) {
    throw noEncontrado(`No existe el area ${idArea}.`);
  }

  const posicion = tablas.areas.indexOf(area);
  tablas.areas.splice(posicion, 1);

  return area;
}
