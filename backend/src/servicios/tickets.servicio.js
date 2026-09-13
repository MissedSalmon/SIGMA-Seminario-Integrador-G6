import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado } from '../utiles/errores.js';

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

export async function crear(datos) {
  const codigoActivo = limpiar(datos.codigoActivo);
  const idEdificio = datos.idEdificio ? Number(datos.idEdificio) : null;
  const espacioNum = limpiar(datos.espacioNum);
  const descripcion = limpiar(datos.descripcion);
  const evidencia = limpiar(datos.evidencia);

  if (!descripcion) {
    throw datoInvalido('La descripción del problema es obligatoria.');
  }

  if (!codigoActivo && (!idEdificio || !espacioNum)) {
    throw datoInvalido('Debe indicar el activo o el espacio afectado.');
  }

  // OJO: La base de datos actual (refactor_modelo_mantenimiento.sql) 
  // exige que activo_codigo y autorizado_legajo NO sean nulos. 
  // Si el frontend envía un "espacio" en lugar de un "activo", fallará 
  // a menos que modifiquemos la BD.
  // Por ahora, usaremos un autorizado ficticio si no viene, y 
  // lanzaremos error si intentan guardar un ticket de espacio sin modificar la BD.
  
  if (!codigoActivo) {
    throw datoInvalido('El modelo de datos actual exige que todo ticket esté asociado a un activo.');
  }

  const { data, error } = await supabase.from('ticket').insert({
    activo_codigo: codigoActivo,
    autorizado_legajo: '0000', // Reemplazar con el usuario logueado en el futuro
    ticket_desc: descripcion,
    ticket_evidencia: evidencia
  }).select().single();

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: data.ticket_id,
    codigoActivo: data.activo_codigo,
    descripcion: data.ticket_desc,
    estado: data.ticket_estado,
    evidencia: data.ticket_evidencia,
    fechaAlta: data.ticket_fecha_alta
  };
}
