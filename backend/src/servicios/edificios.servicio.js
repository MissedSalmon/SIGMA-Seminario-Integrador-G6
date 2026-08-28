import { supabase } from '../config/supabase.js';

/**
 * Obtiene todos los edificios de la base de datos.
 */
export const obtenerTodos = async () => {
  const { data, error } = await supabase
    .from('edificios')
    .select('*')
    .order('idEdificio');

  if (error) {
    throw new Error(`Error al obtener edificios: ${error.message}`);
  }

  return data;
};

/**
 * Crea un nuevo edificio.
 */
export const crear = async (datosEdificio) => {
  const { data, error } = await supabase
    .from('edificios')
    .insert([datosEdificio])
    .select()
    .single();

  if (error) {
    throw new Error(`Error al crear edificio: ${error.message}`);
  }

  return data;
};
