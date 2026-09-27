const fs = require('fs');
const path = 'frontend/src/app/activos/DialogoImportar.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(
  "'activoCodigo', 'activoDesc', 'tipoActivoId', 'edificioId',",
  "'activoCodigo', 'activoDesc', 'tipoActivoId', 'tipoActivoNom', 'edificioId',"
);

fs.writeFileSync(path, content, 'utf8');
