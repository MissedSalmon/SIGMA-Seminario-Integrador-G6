import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function sincronizarUsuarios() {
  console.log('Iniciando sincronización de usuarios (técnicos y autorizados)...');

  // 1. Obtener técnicos
  const { data: tecnicos, error: errorTecnicos } = await supabase.from('tecnico').select('*');
  if (errorTecnicos) {
    console.error('Error al obtener técnicos:', errorTecnicos);
    return;
  }

  for (const tec of tecnicos) {
    const legajo = String(tec.tecnico_legajo);
    const { data: existe } = await supabase.from('usuario').select('usuario_id').eq('identificador', legajo).maybeSingle();
    if (!existe) {
      const hash = await bcrypt.hash(legajo, 10);
      const { error: insertError } = await supabase.from('usuario').insert({
        identificador: legajo,
        password_hash: hash,
        rol: 'tecnico',
        require_password_change: true,
        activo: true,
        tecnico_legajo: legajo,
      });
      if (insertError) {
        console.error(`Error al crear usuario para técnico ${legajo}:`, insertError.message);
      } else {
        console.log(`Usuario creado para técnico ${legajo} (${tec.tecnico_nom_ape}) con clave inicial: ${legajo}`);
      }
    } else {
      console.log(`Usuario técnico ${legajo} ya existe.`);
    }
  }

  // 2. Obtener autorizados
  const { data: autorizados, error: errorAutorizados } = await supabase.from('autorizado').select('*');
  if (errorAutorizados) {
    console.error('Error al obtener autorizados:', errorAutorizados);
    return;
  }

  for (const aut of autorizados) {
    const legajo = String(aut.autorizado_legajo);
    const { data: existe } = await supabase.from('usuario').select('usuario_id').eq('identificador', legajo).maybeSingle();
    if (!existe) {
      const hash = await bcrypt.hash(legajo, 10);
      const { error: insertError } = await supabase.from('usuario').insert({
        identificador: legajo,
        password_hash: hash,
        rol: 'autorizado',
        require_password_change: true,
        activo: true,
        autorizado_legajo: legajo,
      });
      if (insertError) {
        console.error(`Error al crear usuario para autorizado ${legajo}:`, insertError.message);
      } else {
        console.log(`Usuario creado para autorizado ${legajo} (${aut.autorizado_nom_ape}) con clave inicial: ${legajo}`);
      }
    } else {
      console.log(`Usuario autorizado ${legajo} ya existe.`);
    }
  }

  console.log('Sincronización de usuarios completada con éxito.');
}

sincronizarUsuarios().catch(console.error);
