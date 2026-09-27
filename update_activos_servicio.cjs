const fs = require('fs');

const path = 'backend/src/servicios/activos.servicio.js';
let content = fs.readFileSync(path, 'utf8');

const regex = /export async function validarImportacion[\s\S]*?export async function confirmarImportacion[\s\S]*?\n}/;

const newCode = `export async function validarImportacion(filas) {
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
        espaciosExistentes.add(\`\${e.edificio_id}-\${e.espacio_num}\`);
        mapEspacios.set(\`\${e.edificio_id}-\${e.espacio_num}\`, e.espacio_id);
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
      errores.push(\`El estado "\${activoEstado}" no es válido.\`);
    }

    if (tipoActivoId && !tiposExistentesPorId.has(Number(tipoActivoId))) {
      errores.push(\`El tipo de activo ID \${tipoActivoId} no existe.\`);
    } else if (!tipoActivoId && tipoActivoNom) {
      const idExistente = tiposExistentesPorNombre.get(tipoActivoNom.toLowerCase());
      if (idExistente) {
        fila.tipoActivoId = idExistente;
      }
    }

    if (edificioId && espacioNum) {
      const key = \`\${edificioId}-\${espacioNum}\`;
      if (!espaciosExistentes.has(key)) {
        errores.push(\`El espacio \${espacioNum} en el edificio \${edificioId} no existe.\`);
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
      mapEspacios.set(\`\${e.edificio_id}-\${e.espacio_num}\`, e.espacio_id);
    });
  }

  const records = filasValidas.map(f => {
    const espacio_id = f.espacio_id || mapEspacios.get(\`\${f.edificioId}-\${f.espacioNum}\`);
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
}`;

content = content.replace(regex, newCode);
fs.writeFileSync(path, content, 'utf8');
