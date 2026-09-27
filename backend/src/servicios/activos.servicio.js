import { supabase } from '../config/supabase.js';
import { datoInvalido, noEncontrado, conflicto } from '../utiles/errores.js';

export const ESTADOS = ["Operativo", "En mantenimiento", "Retirado", "Fuera de servicio"];
export const ESTADO_INICIAL = 'Operativo';
const ESTADO_BAJA = 'Retirado';
export const ESTADOS_MANUALES = ['Operativo', 'Fuera de servicio', 'Retirado'];

function hoy() {
  return new Date().toISOString().split('T')[0];
}

function limpiar(texto) {
  if (typeof texto !== 'string') return null;
  const limpio = texto.trim();
  return limpio === '' ? null : limpio;
}

const COLUMNAS = `
  activo_codigo,
  tipo_activo_id,
  edificio_id,
  espacio_id,
  activo_fecha_alta,
  activo_fecha_baja,
  activo_fecha_ult_maint,
  activo_estado,
  tipo_activo (
    tipo_activo_nom
  ),
  espacio (
    espacio_num,
    edificio (
      edificio_nom
    )
  )
`;

function aActivo(fila) {
  return {
    codigo: fila.activo_codigo,
    idTipoActivo: fila.tipo_activo_id,
    nombreTipo: fila.tipo_activo ? fila.tipo_activo.tipo_activo_nom : '',
    idEdificio: fila.edificio_id,
    espacio_id: fila.espacio_id,
    espacio_num: fila.espacio ? fila.espacio.espacio_num : '',
    nombreEspacio: fila.espacio ? fila.espacio.espacio_num : '',
    nombreEdificio: fila.espacio && fila.espacio.edificio ? fila.espacio.edificio.edificio_nom : '',
    fechaAlta: fila.activo_fecha_alta,
    fechaUltimoMantenimiento: fila.activo_fecha_ult_maint,
    fechaUltimaReubicacion: null,
    estado: fila.activo_estado || ESTADO_INICIAL,
  };
}

async function verificarEspacio(idEdificio, espacio_num) {
  const { data } = await supabase
    .from('espacio')
    .select('espacio_id')
    .eq('edificio_id', idEdificio)
    .eq('espacio_num', espacio_num)
    .maybeSingle();

  if (!data) {
    throw datoInvalido(`No existe el espacio ${espacio_num} en el edificio ${idEdificio}.`);
  }
  return data.espacio_id;
}

async function obtenerEdificioDeEspacio(espacio_id) {
  const { data } = await supabase.from('espacio').select('edificio_id').eq('espacio_id', espacio_id).maybeSingle();
  if (!data) throw datoInvalido(`No existe el espacio ${espacio_id}.`);
  return data.edificio_id;
}

async function verificarTipo(idTipoActivo) {
  const { data } = await supabase
    .from('tipo_activo')
    .select('tipo_activo_id')
    .eq('tipo_activo_id', idTipoActivo)
    .maybeSingle();

  if (!data) {
    throw datoInvalido(`No existe el tipo de activo ${idTipoActivo}.`);
  }
}

function leerUbicacion(datos) {
  const espacio_id = Number(datos.espacio_id);
  const idTipoActivo = Number(datos.idTipoActivo);

  if (!Number.isInteger(espacio_id)) {
    throw datoInvalido('Hay que indicar en qué espacio está el activo.');
  }

  if (!Number.isInteger(idTipoActivo)) {
    throw datoInvalido('Hay que indicar el tipo de activo.');
  }

  return { espacio_id, idTipoActivo };
}

export async function obtenerTodos(filtros = {}) {
  let consulta = supabase.from('activo').select(COLUMNAS).order('activo_codigo');

  if (filtros.idEdificio) {
    consulta = consulta.eq('edificio_id', filtros.idEdificio);
  }

  if (filtros.idTipoActivo) {
    consulta = consulta.eq('tipo_activo_id', filtros.idTipoActivo);
  }

  if (filtros.estado) {
    consulta = consulta.eq('activo_estado', filtros.estado);
  }

  const { data, error } = await consulta;
  if (error) throw new Error(error.message);

  let result = data;
  
  if (filtros.espacio_num) {
      result = result.filter(a => a.espacio && a.espacio.espacio_num === filtros.espacio_num);
  }

  return result.map(aActivo);
}

export async function obtenerPorId(codigo) {
  const { data, error } = await supabase
    .from('activo')
    .select(COLUMNAS)
    .eq('activo_codigo', codigo)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}

export async function crear(datos) {
  const codigo = limpiar(datos.codigo);
  if (!codigo) throw datoInvalido('El código de inventario es obligatorio.');

  const { espacio_id, idTipoActivo } = leerUbicacion(datos);

  const { data: repetido } = await supabase
    .from('activo')
    .select('activo_codigo')
    .ilike('activo_codigo', codigo)
    .maybeSingle();

  if (repetido) throw conflicto(`Ya hay un activo con el código "${codigo}".`);

  await verificarTipo(idTipoActivo);

  const idEdificio = await obtenerEdificioDeEspacio(espacio_id);

  const { data, error } = await supabase
    .from('activo')
    .insert({
      activo_codigo: codigo,
      tipo_activo_id: idTipoActivo,
      edificio_id: idEdificio,
      espacio_id: espacio_id,
      activo_fecha_alta: limpiar(datos.fechaAlta) ?? hoy(),
      activo_estado: ESTADO_INICIAL,
    })
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);
  return aActivo(data);
}

export async function actualizar(codigo, datos) {
  const actual = await obtenerPorId(codigo);

  if (actual.estado === ESTADO_BAJA) {
    throw conflicto(`El activo "${codigo}" está retirado y no se puede modificar.`);
  }

  const { espacio_id, idTipoActivo } = leerUbicacion(datos);
  const estado = limpiar(datos.estado) ?? actual.estado;

  if (estado !== actual.estado && !ESTADOS_MANUALES.includes(estado)) {
    throw datoInvalido(`"${estado}" no es un estado que se pueda poner a mano. Los estados posibles son: ${ESTADOS_MANUALES.join(', ')}.`);
  }

  await verificarTipo(idTipoActivo);
  const idEdificio = await obtenerEdificioDeEspacio(espacio_id);

  const cambios = {
    tipo_activo_id: idTipoActivo,
    edificio_id: idEdificio,
    espacio_id: espacio_id,
    activo_fecha_alta: limpiar(datos.fechaAlta) ?? actual.fechaAlta,
    activo_estado: estado,
  };

  if (estado === ESTADO_BAJA) {
    cambios.activo_fecha_baja = hoy();
  }

  const { data, error } = await supabase
    .from('activo')
    .update(cambios)
    .eq('activo_codigo', codigo)
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}

export async function darDeBaja(codigo) {
  const actual = await obtenerPorId(codigo);

  if (actual.estado === ESTADO_BAJA) {
    throw conflicto(`El activo "${codigo}" ya estaba retirado.`);
  }

  const { data, error } = await supabase
    .from('activo')
    .update({ activo_estado: ESTADO_BAJA, activo_fecha_baja: hoy() })
    .eq('activo_codigo', codigo)
    .select(COLUMNAS)
    .single();

  if (error) throw new Error(error.message);
  if (!data) throw noEncontrado(`No existe el activo "${codigo}".`);

  return aActivo(data);
}

export async function validarImportacion(filas) {
  const codigosVistos = new Set();
  const resultados = [];

  const codigos = filas.map(f => f.activoCodigo).filter(Boolean);
  const tiposIds = [...new Set(filas.map(f => f.tipoActivoId).filter(Boolean))];
  const tiposNoms = [...new Set(filas.map(f => f.tipoActivoNom).filter(Boolean))];
  const edificioIds = [...new Set(filas.map(f => f.edificioId).filter(Boolean))];

  let codigosExistentes = new Set();
  if (codigos.length > 0) {
    const { data: activosDB } = await supabase.from('activo').select('activo_codigo').in('activo_codigo', codigos);
    if (activosDB) {
      activosDB.forEach(a => codigosExistentes.add(a.activo_codigo));
    }
  }

  let tiposExistentesPorId = new Set();
  if (tiposIds.length > 0) {
    const { data: tiposDB } = await supabase.from('tipo_activo').select('tipo_activo_id').in('tipo_activo_id', tiposIds);
    if (tiposDB) {
      tiposDB.forEach(t => tiposExistentesPorId.add(t.tipo_activo_id));
    }
  }

  let tiposExistentesPorNombre = new Map();
  if (tiposNoms.length > 0) {
    const { data: tiposNomsDB } = await supabase.from('tipo_activo').select('tipo_activo_id, tipo_activo_nom').in('tipo_activo_nom', tiposNoms);
    if (tiposNomsDB) {
      tiposNomsDB.forEach(t => tiposExistentesPorNombre.set(t.tipo_activo_nom.toLowerCase(), t.tipo_activo_id));
    }
  }

  let espaciosExistentes = new Set();
  let mapEspacios = new Map();
  if (edificioIds.length > 0) {
    const { data: espaciosDB } = await supabase.from('espacio').select('espacio_id, edificio_id, espacio_num').in('edificio_id', edificioIds);
    if (espaciosDB) {
      espaciosDB.forEach(e => {
        espaciosExistentes.add(`${e.edificio_id}-${e.espacio_num}`);
        mapEspacios.set(`${e.edificio_id}-${e.espacio_num}`, e.espacio_id);
      });
    }
  }

  for (const fila of filas) {
    const errores = [];
    const { activoCodigo, activoDesc, tipoActivoId, tipoActivoNom, edificioId, espacioNum, activoEstado } = fila;

    if (!activoCodigo) errores.push("Falta el código del activo.");
    if (!activoDesc) errores.push("Falta la descripción del activo.");
    if (!activoEstado) errores.push("Falta el estado del activo.");

    if (!tipoActivoId && !tipoActivoNom) {
      errores.push("Falta el tipo de activo (proveer ID o Nombre).");
    }

    if (activoCodigo) {
      if (codigosVistos.has(activoCodigo)) {
        errores.push("El código está duplicado en el archivo.");
      } else {
        codigosVistos.add(activoCodigo);
      }

      if (codigosExistentes.has(activoCodigo)) {
        errores.push("El código ya existe en el catálogo.");
      }
    }

    if (activoEstado && !ESTADOS.includes(activoEstado)) {
      errores.push(`El estado "${activoEstado}" no es válido.`);
    }

    if (tipoActivoId && !tiposExistentesPorId.has(Number(tipoActivoId))) {
      errores.push(`El tipo de activo ID ${tipoActivoId} no existe.`);
    } else if (!tipoActivoId && tipoActivoNom) {
      const idExistente = tiposExistentesPorNombre.get(tipoActivoNom.toLowerCase());
      if (idExistente) {
        fila.tipoActivoId = idExistente;
      }
    }

    if (edificioId && espacioNum) {
      const key = `${edificioId}-${espacioNum}`;
      if (!espaciosExistentes.has(key)) {
        errores.push(`El espacio ${espacioNum} en el edificio ${edificioId} no existe.`);
      } else {
        fila.espacio_id = mapEspacios.get(key);
      }
    } else {
      if (!edificioId) errores.push("Falta el edificio.");
      if (!espacioNum) errores.push("Falta el número de espacio.");
    }

    resultados.push({ fila, errores });
  }

  return resultados;
}

export async function confirmarImportacion(filasValidas) {
  if (!filasValidas || filasValidas.length === 0) return [];
  
  // Procesar creación de nuevos tipos de activos on-the-fly
  const tiposACrear = new Map();
  for (const f of filasValidas) {
    if (!f.tipoActivoId && f.tipoActivoNom) {
      tiposACrear.set(f.tipoActivoNom.toLowerCase(), f.tipoActivoNom);
    }
  }

  if (tiposACrear.size > 0) {
    const recordsNuevosTipos = Array.from(tiposACrear.values()).map(nom => ({ tipo_activo_nom: nom }));
    const { data: nuevosTiposGuardados, error: errTipos } = await supabase.from('tipo_activo').insert(recordsNuevosTipos).select('tipo_activo_id, tipo_activo_nom');
    
    if (errTipos) throw new Error("Error al crear nuevos tipos de activo: " + errTipos.message);
    
    // Mapear los IDs generados a las filas
    const mapaNuevosTipos = new Map();
    nuevosTiposGuardados.forEach(t => mapaNuevosTipos.set(t.tipo_activo_nom.toLowerCase(), t.tipo_activo_id));

    for (const f of filasValidas) {
      if (!f.tipoActivoId && f.tipoActivoNom) {
        f.tipoActivoId = mapaNuevosTipos.get(f.tipoActivoNom.toLowerCase());
      }
    }
  }

  const edificioIds = [...new Set(filasValidas.map(f => f.edificioId).filter(Boolean))];
  const { data: espaciosDB } = await supabase.from('espacio').select('espacio_id, edificio_id, espacio_num').in('edificio_id', edificioIds);
  
  const mapEspacios = new Map();
  if (espaciosDB) {
    espaciosDB.forEach(e => {
      mapEspacios.set(`${e.edificio_id}-${e.espacio_num}`, e.espacio_id);
    });
  }

  const records = filasValidas.map(f => {
    const espacio_id = f.espacio_id || mapEspacios.get(`${f.edificioId}-${f.espacioNum}`);
    return {
      activo_codigo: f.activoCodigo,
      tipo_activo_id: Number(f.tipoActivoId),
      edificio_id: Number(f.edificioId),
      espacio_id: espacio_id,
      activo_fecha_alta: f.activoFechaAlta ? f.activoFechaAlta : hoy(),
      activo_estado: f.activoEstado
    };
  });

  const { data, error } = await supabase.from('activo').insert(records).select(COLUMNAS);
  if (error) throw new Error(error.message);
  
  return data ? data.map(aActivo) : [];
}
