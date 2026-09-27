const fs = require('fs');
const path = 'frontend/src/app/activos/page.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import * as xlsx from 'xlsx';", "import ExcelJS from 'exceljs';\nimport { saveAs } from 'file-saver';");

const oldExportFn = `  const exportarActivos = () => {
    // The columns should be: Código, Tipo, Edificio, Espacio, Estado
    const datosExportar = activos.map(a => ({
      'Código': a.codigo,
      'Tipo': a.nombreTipo,
      'Edificio': a.nombreEdificio,
      'Espacio': a.nombreEspacio,
      'Estado': a.estado,
    }));
    const hoja = xlsx.utils.json_to_sheet(datosExportar);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Activos');
    xlsx.writeFile(libro, 'activos_exportados.xlsx');
  };`;

const newExportFn = `  const exportarActivos = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Activos');
    
    worksheet.columns = [
      { header: 'Código', key: 'codigo', width: 20 },
      { header: 'Tipo', key: 'tipo', width: 30 },
      { header: 'Edificio', key: 'edificio', width: 20 },
      { header: 'Espacio', key: 'espacio', width: 20 },
      { header: 'Estado', key: 'estado', width: 20 }
    ];

    activos.forEach(a => {
      worksheet.addRow({
        codigo: a.codigo,
        tipo: a.nombreTipo,
        edificio: a.nombreEdificio,
        espacio: a.nombreEspacio,
        estado: a.estado
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'activos_exportados.xlsx');
  };`;

content = content.replace(oldExportFn, newExportFn);
fs.writeFileSync(path, content, 'utf8');
