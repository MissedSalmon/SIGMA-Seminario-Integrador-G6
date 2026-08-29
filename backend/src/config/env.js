/**
 * Carga y valida las variables de entorno del backend.
 */
import dotenv from 'dotenv';

dotenv.config();

/**
 * Variables que necesita la conexion a Supabase.
 *
 * Como ya no trabajamos con datos en memoria (mocks), si faltan estas
 * variables el servidor debe cortarse, ya que no podria operar la base de datos.
 */
const DE_SUPABASE = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];

const faltantes = DE_SUPABASE.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  console.error('\n❌ ERROR CRITICO: Faltan credenciales de Supabase en backend/.env');
  faltantes.forEach((nombre) => console.error(`   Falta -> ${nombre}`));
  console.error('Buscalas en Project Settings -> API en el panel de Supabase.');
  console.error('El servidor backend no puede arrancar.\n');
  process.exit(1);
}

const haySupabase = true;

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
