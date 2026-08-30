/**
 * Servicio de especialidades.
 *
 * HU-4 (el ABM completo de especialidades) todavia no esta implementada en el
 * proyecto: la tabla Especialidad existe en la base (con datos de semilla,
 * ver supabase/migrations/20260829210000_tecnico_datos_personales.sql) pero
 * no hay ninguna pantalla para darlas de alta todavia. Este servicio solo
 * expone lo que Tecnicos (HU-5) necesita para su selector: listarlas.
 */
import { supabase } from '../config/supabase.js';

export async function obtenerTodos() {
  const { data, error } = await supabase
    .from('especialidad')
    .select('*')
    .order('especialidadnom', { ascending: true });

  if (error) throw new Error(error.message);

  return data.map((especialidad) => ({
    idEspecialidad: especialidad.especialidadid,
    nombre: especialidad.especialidadnom,
  }));
}
