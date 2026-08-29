/**
 * Carga y valida las variables de entorno del backend.
 */
import dotenv from 'dotenv';

dotenv.config();

/**
 * Variables que necesita la conexion a Supabase.
 *
 * TEMPORAL: mientras la base de datos no exista, faltar estas variables NO
 * frena el arranque, solo avisa. Los modulos del Sprint 1 trabajan con los
 * datos de prueba de src/datos-mock/, asi que el equipo puede levantar la API
 * sin tener las claves.
 *
 * CUANDO ESTE LA BASE: volver a cortar el arranque (process.exit(1)) si falta
 * alguna. Es preferible fallar aca, al inicio, que fallar mas tarde con un
 * error confuso.
 */
const DE_SUPABASE = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const faltantes = DE_SUPABASE.filter((nombre) => !process.env[nombre]);
const haySupabase = faltantes.length === 0;

if (!haySupabase) {
  console.warn('\nAviso: la API arranca SIN conexion a Supabase.');
  faltantes.forEach((nombre) => console.warn(`  - falta ${nombre}`));
  console.warn('Los datos que devuelve son de prueba (backend/src/datos-mock/)');
  console.warn('y se pierden al reiniciar el servidor.');
  console.warn('Para conectar la base: copia backend/.env.example a backend/.env.\n');
}

export const env = {
  entorno: process.env.NODE_ENV ?? 'development',
  puerto: Number(process.env.PORT ?? 4000),
  haySupabase,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Origenes del frontend que tienen permiso para llamar a esta API.
  // Se cargan separados por coma: "http://localhost:3000,https://sigma.vercel.app"
  origenesPermitidos: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean),
};

export const esProduccion = env.entorno === 'production';
