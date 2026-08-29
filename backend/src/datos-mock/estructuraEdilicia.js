/**
 * DATOS DE PRUEBA - TEMPORAL
 *
 * La base de datos todavia no existe: el modelo de tablas se esta rehaciendo
 * por las correcciones de la catedra (ver contexto.md, seccion 11).
 *
 * Mientras tanto, los modulos de edificios, espacios y areas trabajan contra
 * este archivo, que guarda todo en memoria. Sirve para desarrollar y probar
 * las pantallas del Sprint 1 sin depender de Supabase.
 *
 * COMO SE BORRA ESTO CUANDO ESTE LA BASE:
 *   1. Se escribe base-de-datos/migraciones/001_estructura_edilicia.sql.
 *   2. En cada archivo de src/servicios/ se reemplazan las funciones de este
 *      modulo por consultas con `supabase.from('...')`.
 *   3. Se borra la carpeta src/datos-mock/ completa.
 *
 * IMPORTANTE: al estar en memoria, los datos se pierden cada vez que se
 * reinicia el servidor. Es lo esperado.
 *
 * Los nombres de los campos siguen el modelo corregido (contexto.md 11.1):
 *   edificios(idEdificio, nombre, direccion)
 *   espacios(idEspacio, idEdificio, nombre, tipo, piso, numero, dimensiones)
 *   areas(idArea, idEspacio, nombre)
 *
 * Pendiente de confirmar: el modelo corregido tambien lleva
 * `edificios.idFacultad`, pero todavia no hay ABM de facultad (ninguna HU lo
 * cubre), asi que aca no se carga.
 */

/** Tipos de espacio validos. Salen del alcance del producto (contexto.md 3.4). */
export const TIPOS_DE_ESPACIO = [
  'Aula',
  'Laboratorio',
  'Oficina',
  'Pasillo',
  'Area comun',
];

/** Tablas en memoria. */
export const tablas = {
  edificios: [
    { idEdificio: 1, nombre: 'Edificio Central', direccion: 'French 414, Resistencia' },
    { idEdificio: 2, nombre: 'Anexo', direccion: 'French 414, Resistencia' },
  ],
  espacios: [
    {
      idEspacio: 1,
      idEdificio: 1,
      nombre: 'Aula 1',
      tipo: 'Aula',
      piso: 'Planta baja',
      numero: '1',
      dimensiones: '8 x 6 m',
    },
    {
      idEspacio: 2,
      idEdificio: 1,
      nombre: 'Laboratorio de Informatica',
      tipo: 'Laboratorio',
      piso: 'Primer piso',
      numero: '12',
      dimensiones: '10 x 7 m',
    },
    {
      idEspacio: 3,
      idEdificio: 2,
      nombre: 'Secretaria de Infraestructura',
      tipo: 'Oficina',
      piso: 'Planta baja',
      numero: '3',
      dimensiones: '5 x 4 m',
    },
  ],
  areas: [
    { idArea: 1, idEspacio: 2, nombre: 'Departamento de Sistemas' },
    { idArea: 2, idEspacio: 3, nombre: 'Infraestructura' },
  ],
};

/**
 * Devuelve el proximo id libre de una tabla.
 * Reemplaza lo que en la base va a hacer un SERIAL.
 */
export function proximoId(nombreTabla, campoId) {
  const filas = tablas[nombreTabla];
  const maximo = filas.reduce((mayor, fila) => Math.max(mayor, fila[campoId]), 0);
  return maximo + 1;
}
