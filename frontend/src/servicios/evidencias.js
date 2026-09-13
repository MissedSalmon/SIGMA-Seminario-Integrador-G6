/**
 * Subida de las fotos de los tickets (HU-9).
 *
 * Las fotos NO pasan por el backend: el navegador las manda directo a Supabase
 * Storage con la ANON KEY, que es lo que dice la arquitectura (ver
 * .claude/contexto/arquitectura.md, "Las dos conexiones a Supabase"). Al ticket
 * se le guarda sólo la dirección de la imagen, que entra en los 255 caracteres
 * de ticketEvidencia.
 *
 * Para que esto funcione hacen falta dos cosas, y las dos están pendientes:
 *   1. frontend/.env.local con NEXT_PUBLIC_SUPABASE_URL y ..._ANON_KEY.
 *   2. Un bucket público llamado "evidencias" en el panel de Supabase.
 */

/** El bucket donde van las fotos. Si el equipo le pone otro nombre, se cambia acá. */
const BUCKET = 'evidencias';

/** 5 MB: una foto de celular entra de sobra y no tapa la conexión de la facultad. */
export const TAMANO_MAXIMO = 5 * 1024 * 1024;

/**
 * Un nombre de archivo que no se repita y que no rompa la dirección: la fecha
 * en milisegundos adelante, y el nombre original sin acentos ni espacios.
 */
function nombreParaGuardar(archivo) {
  const limpio = archivo.name
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .toLowerCase();

  return `${Date.now()}-${limpio}`;
}

/**
 * Sube la foto y devuelve su dirección pública.
 *
 * El cliente de Supabase se importa acá adentro a propósito: si faltan las
 * claves, ese módulo tira error apenas se lo carga. Importándolo recién en el
 * momento de subir, la pantalla del ticket abre igual y el problema se avisa
 * solamente a quien intenta subir una foto.
 */
export async function subirEvidencia(archivo) {
  let supabase;
  try {
    ({ supabase } = await import('@/lib/supabase.js'));
  } catch {
    throw new Error(
      'Todavía no se pueden subir fotos: falta crear frontend/.env.local con las claves públicas de Supabase.'
    );
  }

  const nombre = nombreParaGuardar(archivo);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(nombre, archivo, { contentType: archivo.type });

  if (error) {
    throw new Error(
      `No se pudo subir la foto: ${error.message}. Fijate que exista el bucket "${BUCKET}" en Supabase.`
    );
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(nombre);
  return data.publicUrl;
}
