const fs = require('fs');
const path = 'frontend/src/app/activos/DialogoImportar.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "activoCodigo: 'INV-123', activoDesc: 'Escritorio', tipoActivoId: '1', edificioId: '1', espacioNum: '101', activoFechaAlta: '2023-01-01', activoFechaInst: '2023-01-01', activoEstado: 'Operativo'",
  "activoCodigo: 'INV-123', activoDesc: 'Escritorio', tipoActivoId: '1', tipoActivoNom: '', edificioId: '1', espacioNum: '101', activoFechaAlta: '2023-01-01', activoFechaInst: '2023-01-01', activoEstado: 'Operativo'"
);

content = content.replace(
  "encabezado: 'Tipo ID'",
  "encabezado: 'Tipo ID'"
);

// We need to add Tipo Nombre to the preview table
content = content.replace(
  "{ clave: 'tipoActivoId', encabezado: 'Tipo ID' },",
  "{ clave: 'tipoActivoId', encabezado: 'Tipo ID' },\n    { clave: 'tipoActivoNom', encabezado: 'Tipo Nombre' },"
);

fs.writeFileSync(path, content, 'utf8');
