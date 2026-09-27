const fs = require('fs');
const path = 'frontend/src/app/activos/DialogoImportar.js';
let content = fs.readFileSync(path, 'utf8');

content = content.replace("import * as xlsx from 'xlsx';", "import ExcelJS from 'exceljs';\nimport { saveAs } from 'file-saver';");

const oldDescargarFn = `  const descargarPlantilla = () => {
    const encabezados = [
      'activoCodigo', 'activoDesc', 'tipoActivoId', 'tipoActivoNom', 'edificioId',
      'espacioNum', 'activoFechaAlta', 'activoFechaInst', 'activoEstado'
    ];
    const hoja = xlsx.utils.aoa_to_sheet([encabezados]);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Plantilla');
    xlsx.writeFile(libro, 'plantilla_activos.xlsx');
  };`;

const newDescargarFn = `  const descargarPlantilla = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');
    worksheet.addRow([
      'activoCodigo', 'activoDesc', 'tipoActivoId', 'tipoActivoNom', 'edificioId',
      'espacioNum', 'activoFechaAlta', 'activoFechaInst', 'activoEstado'
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'plantilla_activos.xlsx');
  };`;

content = content.replace(oldDescargarFn, newDescargarFn);

const oldValidarFn = `  const validarArchivo = async () => {
    if (!archivo) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      const buffer = await archivo.arrayBuffer();
      const libro = xlsx.read(buffer, { type: 'array' });
      const nombrePrimeraHoja = libro.SheetNames[0];
      const hoja = libro.Sheets[nombrePrimeraHoja];
      const json = xlsx.utils.sheet_to_json(hoja, { defval: null });
      
      const resultado = await validarImportacion(json);
      setFilasValidadas(resultado);
    } catch (e) {
      setErrorGlobal(e.message || 'Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };`;

const newValidarFn = `  const validarArchivo = async () => {
    if (!archivo) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      const buffer = await archivo.arrayBuffer();
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      
      const json = [];
      let headers = [];
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          headers = row.values.slice(1);
        } else {
          const rowData = {};
          row.values.slice(1).forEach((val, i) => {
            rowData[headers[i]] = val;
          });
          json.push(rowData);
        }
      });

      const resultado = await validarImportacion(json);
      setFilasValidadas(resultado);
    } catch (e) {
      setErrorGlobal(e.message || 'Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };`;

content = content.replace(oldValidarFn, newValidarFn);

fs.writeFileSync(path, content, 'utf8');
