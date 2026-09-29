const fs = require('fs');
const path = 'frontend/src/app/activos/DialogoImportar.js';
let content = fs.readFileSync(path, 'utf8');

// Add import
content = content.replace(
  "import ExcelJS from 'exceljs';",
  "import ExcelJS from 'exceljs';\nimport Papa from 'papaparse';"
);

const oldValidarFn = `  const validarArchivo = async () => {
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

const newValidarFn = `  const validarArchivo = async () => {
    if (!archivo) return;
    setCargando(true);
    setErrorGlobal('');
    try {
      let json = [];
      
      if (archivo.name.toLowerCase().endsWith('.csv')) {
        const text = await archivo.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parsed.errors.length > 0) {
          throw new Error('Error al parsear el archivo CSV. Asegúrate de que el formato sea correcto.');
        }
        json = parsed.data;
      } else {
        const buffer = await archivo.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        
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
      }

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
