import { supabase } from '../config/supabase.js';

/**
 * Prestadores de servicio: las empresas o profesionales de afuera que hacen
 * los trabajos que el equipo propio no cubre.
 *
 * Por ahora es SOLO LECTURA, y existe porque al armar la OT hay que poder
 * elegir un prestador como responsable de una tarea (HU-14, correccion #13 de
 * la profe). El alta, la edicion y la baja son la HU-33 (Sprint 4): cuando se
 * haga, se agregan aca.
 */

function mapear(fila) {
  return {
    idPrestador: fila.prestador_serv_id,
    nombre: fila.prestador_serv_nom,
    cuil: fila.prestador_serv_cuil,
    telefono: fila.prestador_serv_tel,
  };
}

export async function obtenerTodos() {
  const { data, error } = await supabase
    .from('prestador_servicio')
    .select('prestador_serv_id, prestador_serv_nom, prestador_serv_cuil, prestador_serv_tel')
    .order('prestador_serv_nom', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map(mapear);
}
