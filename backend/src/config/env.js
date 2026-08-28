/**
 * Carga y valida las variables de entorno del backend.
 *
 * Si falta alguna variable obligatoria, el servidor no arranca y avisa cual es.
 * Es preferible fallar aca, al inicio, que fallar mas tarde con un error confuso.
 */
import dotenv from 'dotenv';

dotenv.config();

/** Variables sin las cuales el backend no puede funcionar. */
const OBLIGATORIAS = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const faltantes = OBLIGATORIAS.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error('\nFaltan variables de entorno obligatorias:');
  faltantes.forEach((nombre) => console.error(`  - ${nombre}`));
  console.error('\nCopia backend/.env.example a backend/.env y completa los valores.\n');
  process.exit(1);
}

export const env = {
  entorno: process.env.NODE_ENV ?? 'development',
  puerto: Number(process.env.PORT ?? 4000),
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
