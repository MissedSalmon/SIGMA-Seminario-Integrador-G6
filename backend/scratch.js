import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase.from('tipoactivo').select('*');
  console.log('Data:', data);
  console.log('Error:', error);
  if (error && error.message.includes('relation "tipoactivo" does not exist')) {
    // try uppercase?
    const { data: d2, error: e2 } = await supabase.from('TipoActivo').select('*');
    console.log(e2);
  }
}
run();
