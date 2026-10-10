/**
 * Los datos enumerados del diccionario de datos (Sprint 3, 07/10/2026).
 *
 * Un dato enumerado es una columna que sólo puede tomar unos pocos valores fijos:
 * los estados (de activo, ticket, OT, tarea, técnico asignado y herramienta) y la
 * prioridad (de la tarea y de la OT). En la base cada valor se guarda como un
 * número entero: ocupa menos que el texto y la base no deja guardar uno que no
 * exista (ver supabase/migrations/20261010120000_datos_enumerados.sql). La API, en
 * cambio, sigue hablando con el texto ("Operativo", "En ejecución"), así que
 * las pantallas no se enteran del cambio.
 *
 * Este archivo es el ÚNICO lugar donde se dice qué número es cada texto. Cada
 * lista está en el orden del diccionario: el número es la posición + 1.
 *
 *   ENUM_ESTADO_ACTIVO.codigo('Retirado')  -> 4   (para guardar o filtrar)
 *   ENUM_ESTADO_ACTIVO.texto(4)            -> 'Retirado'   (para mostrar)
 *   ENUM_ESTADO_ACTIVO.textos              -> ['Operativo', ...]   (para listar)
 *
 * Si se agrega un valor nuevo, va al final de su lista (para no correr los
 * números que ya están guardados) y en una migración nueva se amplía el CHECK.
 */
import { datoInvalido } from './errores.js';

function crearEnumerado(nombre, textos) {
  return {
    textos,

    /** El numero que se guarda en la base. Un texto que no esta es un error. */
    codigo(texto) {
      const posicion = textos.indexOf(texto);
      if (posicion === -1) {
        throw datoInvalido(`"${texto}" no es ${nombre} válido. Son: ${textos.join(', ')}.`);
      }
      return posicion + 1;
    },

    /** El texto que se muestra. Un numero que no esta devuelve null. */
    texto(codigo) {
      return textos[Number(codigo) - 1] ?? null;
    },

    /** Si el texto es uno de los valores de este enumerado. */
    incluye(texto) {
      return textos.includes(texto);
    },
  };
}

export const ENUM_ESTADO_ACTIVO = crearEnumerado('un estado de activo', [
  'Operativo',
  'En mantenimiento',
  'Fuera de servicio',
  'Retirado',
]);

export const ENUM_ESTADO_TICKET = crearEnumerado('un estado de ticket', [
  'Creado',
  'Validado',
  'Asignado',
  'En ejecución',
  'Finalizado',
  'Cerrado',
  'Rechazado',
]);

export const ENUM_ESTADO_OT = crearEnumerado('un estado de orden de trabajo', [
  'Creada',
  'Asignada',
  'En ejecución',
  'Finalizada',
  'Cancelada',
]);

export const ENUM_ESTADO_TAREA = crearEnumerado('un estado de tarea', [
  'Creada',
  'Asignada',
  'En ejecución',
  'Pendiente',
  'Finalizada',
  'Cancelada',
]);

/**
 * De más urgente a menos. Vale para la prioridad de la tarea y para la que el
 * administrador le pone a mano a la OT. Con este orden se calcula la sugerida.
 */
export const ENUM_PRIORIDAD = crearEnumerado('una prioridad', ['Alta', 'Media', 'Baja']);

export const ENUM_ESTADO_ASIGNACION_TECNICO = crearEnumerado('un estado de asignación', [
  'Pendiente',
  'Asignada',
  'En curso',
  'Finalizada',
  'Cancelada',
]);

export const ENUM_ESTADO_HERRAMIENTA = crearEnumerado('un estado de herramienta', [
  'Disponible',
  'En uso',
  'Fuera de servicio',
]);
