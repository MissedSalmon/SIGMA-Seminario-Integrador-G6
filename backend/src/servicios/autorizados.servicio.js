/**
 * Usuarios autorizados (HU-8).
 *
 * Un usuario autorizado es la persona responsable de un area: es la que puede
 * cargar tickets sobre los activos de esa area (HU-9). Por eso el alta no se
 * completa sin area, y por eso no se puede borrar uno que ya cargo tickets.
 *
 * DONDE VIVE EL AREA. No esta en la tabla autorizado sino del otro lado, en
 * area.autorizado_legajo, que es la relacion del modelo. Asignarle un area a un
 * usuario es escribir su legajo en esa columna del area elegida. Dos
 * consecuencias:
 *
 *   - un area tiene un solo responsable, y el sistema no lo pisa sin avisar:
 *     si el area ya esta tomada, el alta falla con un 409;
 *   - la obligatoriedad del area no la puede exigir la base (la columna esta en
 *     la otra tabla), asi que la exige este servicio.
 */
import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';
import {
  normalizarCuil,
  normalizarDni,
  normalizarTelefono,
  validarCuil,
  validarDni,
  validarEmail,
  validarTelefono,
} from '../utiles/validaciones.js';

/**
 * El area viaja como relacion inversa: la trae PostgREST siguiendo la clave
 * ajena de area hacia autorizado, por eso llega como lista y no como objeto.
 */
const COLUMNAS_CON_AREA = `*,
  area (
    area_id,
    area_nom
  )
`;

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

/**
 * Aplana la fila de la base al objeto que entiende el frontend.
 *
 * El area se devuelve en dos campos sueltos (idArea y nombreArea) y no como
 * objeto anidado, porque el buscador de la tabla solo mira los campos de
 * primer nivel.
 */
function aAutorizado(fila) {
  const areas = fila.area ?? [];
  const area = areas[0] ?? null;

  return {
    legajo: fila.autorizado_legajo,
    nombre: fila.autorizado_nom_ape,
    dni: fila.autorizado_dni,
    cuil: fila.autorizado_cuil,
    email: fila.autorizado_email,
    telefono: fila.autorizado_tel,
    fechaNacimiento: fila.autorizado_fecha_nac,
    idArea: area ? area.area_id : null,
    nombreArea: area ? area.area_nom : '',
  };
}

/**
 * Revisa y normaliza los datos de la persona. No mira el legajo: eso lo hace
 * `crear`, que es el unico que lo puede tocar.
 */
function validarDatos(datos) {
  const nombre = limpiar(datos.nombre);
  const email = limpiar(datos.email);
  const fechaNacimiento = limpiar(datos.fechaNacimiento);
  const idArea = Number(datos.idArea);

  if (!nombre) throw datoInvalido('El nombre y apellido es obligatorio.');

  // El area es lo que habilita a cargar tickets: sin area el usuario no sirve.
  if (!Number.isInteger(idArea) || idArea <= 0) {
    throw datoInvalido('Hay que asignarle un área de la que sea responsable.');
  }

  if (!String(datos.dni ?? '').trim()) throw datoInvalido('El DNI es obligatorio.');
  if (!fechaNacimiento) throw datoInvalido('La fecha de nacimiento es obligatoria.');

  // Estos campos siguen las reglas de utiles/validaciones.js, las mismas que
  // usa la pantalla.
  const problema =
    validarDni(datos.dni) ||
    validarCuil(datos.cuil, datos.dni) ||
    validarTelefono(datos.telefono) ||
    validarEmail(email);

  if (problema) throw datoInvalido(problema);

  const dni = normalizarDni(datos.dni);
  const cuil = normalizarCuil(datos.cuil);
  const telefono = normalizarTelefono(datos.telefono);

  const fechaNac = new Date(fechaNacimiento);
  const hace18Anios = new Date();
  hace18Anios.setFullYear(hace18Anios.getFullYear() - 18);

  if (fechaNac > new Date()) {
    throw datoInvalido('La fecha de nacimiento no puede ser posterior a hoy.');
  }
  
  if (fechaNac > hace18Anios) {
    throw datoInvalido('El usuario autorizado debe tener al menos 18 años.');
  }

  return { nombre, dni, cuil, email, telefono, fechaNacimiento, idArea };
}

/**
 * Corta el alta/edicion si el area no existe o si ya tiene otro responsable.
 * Que este tomada por el mismo usuario que estamos editando no es un problema.
 */
async function validarAreaLibre(idArea, legajo) {
  const { data, error } = await supabase
    .from('area')
    .select('area_id, area_nom, autorizado_legajo')
    .eq('area_id', idArea)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw datoInvalido(`No existe el área ${idArea}.`);

  if (data.autorizado_legajo && data.autorizado_legajo !== legajo) {
    throw conflicto(
      `El area "${data.area_nom}" ya tiene un responsable asignado. Sacaselo primero o elegi otra area.`
    );
  }
}

/**
 * Deja al usuario como responsable de una sola area: le suelta las que tenia y
 * se anota en la elegida. Se usa igual en el alta y en la edicion.
 */
async function asignarArea(legajo, idArea) {
  const { error: errorSoltar } = await supabase
    .from('area')
    .update({ autorizado_legajo: null })
    .eq('autorizado_legajo', legajo);

  if (errorSoltar) throw new Error(errorSoltar.message);

  const { error } = await supabase
    .from('area')
    .update({ autorizado_legajo: legajo })
    .eq('area_id', idArea);

  if (error) throw new Error(error.message);
}

/** @param {object} [filtros] - `area_id` para ver solo los responsables de un area. */
export async function obtenerTodos({ area_id } = {}) {
  const { data, error } = await supabase
    .from('autorizado')
    .select(COLUMNAS_CON_AREA)
    .order('autorizado_nom_ape', { ascending: true });

  if (error) throw new Error(error.message);

  const autorizados = data.map(aAutorizado);

  // El area cuelga de una relacion, y PostgREST no deja filtrar la tabla
  // principal por una columna de la relacion: el filtro se aplica aca.
  if (area_id) {
    const idNumerico = Number(area_id);
    return autorizados.filter((autorizado) => autorizado.idArea === idNumerico);
  }

  return autorizados;
}

export async function obtenerPorId(legajo) {
  const { data, error } = await supabase
    .from('autorizado')
    .select(COLUMNAS_CON_AREA)
    .eq('autorizado_legajo', legajo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el usuario autorizado ${legajo}.`);

  return aAutorizado(data);
}

export async function crear(datos) {
  const legajo = limpiar(datos.legajo);
  if (!legajo) throw datoInvalido('El legajo es obligatorio.');

  const limpio = validarDatos(datos);

  const { data: existente } = await supabase
    .from('autorizado')
    .select('autorizado_legajo')
    .eq('autorizado_legajo', legajo)
    .maybeSingle();

  if (existente) throw conflicto(`El legajo ${legajo} ya pertenece a otro usuario autorizado.`);

  await validarAreaLibre(limpio.idArea, legajo);

  const { error } = await supabase.from('autorizado').insert({
    autorizado_legajo: legajo,
    autorizado_nom_ape: limpio.nombre,
    autorizado_dni: limpio.dni,
    autorizado_cuil: limpio.cuil,
    autorizado_email: limpio.email,
    autorizado_tel: limpio.telefono,
    autorizado_fecha_nac: limpio.fechaNacimiento,
  });

  if (error) throw new Error(error.message);

  await asignarArea(legajo, limpio.idArea);

  return obtenerPorId(legajo);
}

export async function actualizar(legajo, datos) {
  const limpio = validarDatos(datos);

  await validarAreaLibre(limpio.idArea, legajo);

  const { data, error } = await supabase
    .from('autorizado')
    .update({
      autorizado_nom_ape: limpio.nombre,
      autorizado_dni: limpio.dni,
      autorizado_cuil: limpio.cuil,
      autorizado_email: limpio.email,
      autorizado_tel: limpio.telefono,
      autorizado_fecha_nac: limpio.fechaNacimiento,
    })
    .eq('autorizado_legajo', legajo)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el usuario autorizado ${legajo}.`);

  await asignarArea(legajo, limpio.idArea);

  return obtenerPorId(legajo);
}

/**
 * Baja de un usuario autorizado.
 *
 * Si cargo algun ticket no se borra: el ticket tiene que seguir diciendo quien
 * lo reporto. Si no cargo ninguno, primero se le suelta el area (el area lo
 * apunta con una clave ajena, y si no se suelta la base rechaza el borrado).
 */
export async function eliminar(legajo) {
  const { data: tickets, error: errorTickets } = await supabase
    .from('ticket')
    .select('ticket_id')
    .eq('autorizado_legajo', legajo)
    .limit(1);

  if (errorTickets) throw new Error(errorTickets.message);

  if (tickets && tickets.length > 0) {
    throw conflicto(
      'No se puede eliminar: el usuario ya cargo tickets y hay que poder ver quien los reporto.'
    );
  }

  const { error: errorSoltar } = await supabase
    .from('area')
    .update({ autorizado_legajo: null })
    .eq('autorizado_legajo', legajo);

  if (errorSoltar) throw new Error(errorSoltar.message);

  const { data, error } = await supabase
    .from('autorizado')
    .delete()
    .eq('autorizado_legajo', legajo)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el usuario autorizado ${legajo}.`);

  return { legajo: data.autorizado_legajo, nombre: data.autorizado_nom_ape };
}
