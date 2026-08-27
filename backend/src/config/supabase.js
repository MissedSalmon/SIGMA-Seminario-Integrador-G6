/**
 * Conexion a Supabase desde el backend.
 *
 * Este cliente usa la SERVICE ROLE KEY, que saltea las reglas de seguridad de la
 * base de datos. Por eso solo puede vivir en el servidor: nunca en el frontend.
 *
 * Se exporta una unica instancia y todos los servicios la reutilizan.
 * Ejemplo de uso dentro de src/servicios/:
 *
 *   import { supabase } from '../config/supabase.js';
 *   const { data, error } = await supabase.from('tickets').select('*');
 */
import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

export const supabase = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
  auth: {
    // El backend no maneja sesiones de usuario en memoria: cada pedido es independiente.
    persistSession: false,
    autoRefreshToken: false,
  },
});
