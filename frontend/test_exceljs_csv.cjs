const ExcelJS = require('exceljs');
const { Readable } = require('stream');

async function test() {
  const wb = new ExcelJS.Workbook();
  const csvData = "activoCodigo,activoDesc\n1,Prueba";
  const stream = Readable.from([csvData]);
  await wb.csv.read(stream);
  const ws = wb.worksheets[0];
  ws.eachRow((row, rowNumber) => {
    console.log(rowNumber, row.values);
  });
}
test().catch(console.error);
