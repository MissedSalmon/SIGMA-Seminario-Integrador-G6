import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

// Load the environment variables manually since it's a raw script
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function seed() {
  console.log("Iniciando seeder del usuario Admin...");
  
  // Verificamos si ya existe el usuario
  const { data: usuarioExistente } = await supabase
    .from('usuario')
    .select('usuario_id')
    .eq('identificador', 'Admin')
    .single();
    
  if (usuarioExistente) {
    console.log("El usuario Admin ya existe. Saliendo...");
    return;
  }

  // Si no existe, lo creamos
  const hash = await bcrypt.hash('Admin1234', 10);
  const { data, error } = await supabase.from('usuario').insert({
    identificador: 'Admin',
    password_hash: hash,
    rol: 'administrador',
    require_password_change: true,
    admin_legajo: 'Admin'
  });
  
  if (error) {
    console.error('Error creando usuario Admin:', error);
  } else {
    console.log('Usuario Admin creado exitosamente. Puedes loguearte con Admin / Admin1234');
  }
}

seed();
