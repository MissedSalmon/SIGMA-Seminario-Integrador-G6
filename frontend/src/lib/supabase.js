/**
 * Conexion a Supabase desde el navegador.
 *
 * Este cliente usa la ANON KEY, que es publica y esta pensada para el frontend.
 * Respeta las reglas de seguridad (RLS) de la base de datos.
 *
 * Se usa para lo que Supabase resuelve directo desde el navegador:
 * autenticacion y subida de archivos (por ejemplo, las fotos de los tickets).
 *
 * Para todo lo demas -tickets, ordenes de trabajo, inventario- se llama a la
 * API del backend a traves de src/servicios/api.js, porque ahi viven las
 * reglas de negocio.
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    'Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY. ' +
      'Copia frontend/.env.local.example a frontend/.env.local y completa los valores.'
  );
}

export const supabase = createClient(url, anonKey);
