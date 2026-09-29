'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody, CButton, CAlert, CBadge } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCloudUpload, cilFile, cilCloudDownload } from '@coreui/icons';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { validarImportacion, confirmarImportacion } from '@/servicios/activos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function PantallaImportarActivos() {
  const router = useRouter();
  const { mostrarToast } = useToast();
  
  const [archivosProcesados, setArchivosProcesados] = useState(new Set());
  const [datosAcumulados, setDatosAcumulados] = useState([]);
  const [arrastrando, setArrastrando] = useState(false);
  const [filasValidadas, setFilasValidadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  
  const inputRef = useRef(null);

  const procesarArchivo = async (archivoSeleccionado) => {
    if (!archivoSeleccionado) return;
    
    const archivoKey = `${archivoSeleccionado.name}-${archivoSeleccionado.size}`;
    if (archivosProcesados.has(archivoKey)) {
      return; // Ignorar si es exactamente el mismo archivo
    }

    setCargando(true);
    setErrorGlobal('');
    try {
      let nuevosJSON = [];
      
      if (archivoSeleccionado.name.toLowerCase().endsWith('.csv')) {
        const text = await archivoSeleccionado.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        if (parsed.errors.length > 0) {
          throw new Error('Error al parsear el archivo CSV. Asegúrate de que el formato sea correcto.');
        }
        nuevosJSON = parsed.data;
      } else {
        const buffer = await archivoSeleccionado.arrayBuffer();
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
            nuevosJSON.push(rowData);
          }
        });
      }

      const nuevoTotal = [...datosAcumulados, ...nuevosJSON];
      const resultado = await validarImportacion(nuevoTotal);
      
      setDatosAcumulados(nuevoTotal);
      setFilasValidadas(resultado);
      
      const nuevosProcesados = new Set(archivosProcesados);
      nuevosProcesados.add(archivoKey);
      setArchivosProcesados(nuevosProcesados);

    } catch (e) {
      setErrorGlobal(e.message || 'Error al procesar el archivo');
    } finally {
      setCargando(false);
    }
  };

  const descargarPlantilla = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Plantilla');
    worksheet.addRow([
      'activoCodigo', 'activoDesc', 'tipoActivoId', 'tipoActivoNom', 'edificioId',
      'espacioNum', 'activoFechaAlta', 'activoFechaInst', 'activoEstado'
    ]);
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Plantilla Base.xlsx');
  };

  const confirmar = async () => {
    const filasValidas = filasValidadas.filter(f => f.errores.length === 0).map(f => f.fila);
    if (filasValidas.length === 0) {
      setErrorGlobal('No hay filas válidas para importar.');
      return;
    }

    setCargando(true);
    try {
      await confirmarImportacion(filasValidas);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se importaron ${filasValidas.length} activos exitosamente.`,
      });
      router.push('/activos');
    } catch (e) {
      setErrorGlobal(e.message || 'Error al confirmar la importación');
      setCargando(false);
    }
  };

  

  const columnas = [
    {
      clave: 'filaInfo',
      encabezado: 'Datos de la Fila',
      render: (item) => (
        <div style={{ fontSize: '0.85em', wordBreak: 'break-all' }}>
          {Object.entries(item.fila).map(([k, v]) => (
            <div key={k}><strong>{k}:</strong> {v}</div>
          ))}
        </div>
      ),
    },
    {
      clave: 'errores',
      encabezado: 'Estado',
      render: (item) => {
        if (item.errores.length === 0) {
          return <CBadge color="success">Válido</CBadge>;
        }
        return (
          <div>
            <CBadge color="danger">Errores</CBadge>
            <ul className="text-danger mt-1 mb-0 ps-3" style={{ fontSize: '0.85em' }}>
              {item.errores.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        );
      },
    }
  ];

  const hayFilas = filasValidadas.length > 0;
  const cantidadValidas = filasValidadas.filter(f => f.errores.length === 0).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Importar Activos"
        
      />

      <CCard className="mb-4">
        <CCardBody>
          {errorGlobal && <CAlert color="danger">{errorGlobal}</CAlert>}
          
          <div className="d-flex flex-wrap align-items-center justify-content-between mb-4">
            <p className="text-body-secondary mb-0">
              Sube un archivo Excel (.xlsx) o CSV con el formato requerido.
            </p>
            <CButton color="primary" variant="outline" size="sm" className="text-nowrap fw-bold" onClick={descargarPlantilla}>
              <CIcon icon={cilCloudDownload} className="me-2" />
              Plantilla Base
            </CButton>
          </div>

          {!hayFilas && (
            <div
              className={`p-5 mb-4 text-center border rounded ${arrastrando ? 'bg-light border-primary' : 'bg-white border-secondary'}`}
              style={{ borderStyle: 'dashed !important', borderWidth: '2px', cursor: 'pointer', transition: 'all 0.2s' }}
              onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
              onDragLeave={() => setArrastrando(false)}
              onDrop={(e) => {
                e.preventDefault();
                setArrastrando(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  procesarArchivo(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => inputRef.current?.click()}
            >
              <CIcon icon={cilCloudUpload} size="3xl" className="text-secondary mb-3" style={{ width: '64px', height: '64px' }} />
              <div>
                <h5 className="mb-1">{cargando ? 'Procesando archivo...' : 'Haz clic o arrastra un archivo aquí'}</h5>
                <p className="text-body-secondary mb-0">Soporta .xlsx y .csv</p>
              </div>
              <input
                type="file"
                accept=".xlsx, .csv"
                className="d-none"
                ref={inputRef}
                onChange={(e) => {
                  procesarArchivo(e.target.files[0]);
                  e.target.value = null; // reset so same file can be selected again if needed
                }}
              />
            </div>
          )}

          {!hayFilas && (
            <div className="d-flex justify-content-end gap-2 mt-4">
              <CButton color="secondary" variant="ghost" onClick={() => router.push('/activos')} disabled={cargando}>
                Cancelar
              </CButton>
            </div>
          )}

          {hayFilas && (
            <div>
              <h5 className="mb-3">Vista previa de importación</h5>
              <div className="border rounded mb-3">
                <TablaDatos
                  filas={filasValidadas}
                  claveFila={(item) => item.fila.activoCodigo + '-' + Math.random().toString(36).substr(2, 9)}
                  columnas={columnas}
                  textoVacio="No hay datos."
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mt-3">
                <p className="mb-0">
                  <strong>{cantidadValidas}</strong> fila(s) válida(s) de un total de {filasValidadas.length}.
                </p>
                <div className="d-flex gap-2">
                  <CButton color="secondary" variant="ghost" onClick={() => router.push('/activos')} disabled={cargando}>
                    Cancelar
                  </CButton>
                  <CButton color="secondary" variant="outline" onClick={() => inputRef.current?.click()} disabled={cargando}>
                    {cargando ? 'Procesando...' : 'Cargar otro archivo'}
                  </CButton>
                  <CButton color="success" onClick={confirmar} disabled={cargando || cantidadValidas === 0} className="text-white">
                    {cargando ? 'Importando...' : 'Confirmar Importación'}
                  </CButton>
                </div>
                
                {/* Hidden input for concatenating files after the first one */}
                <input
                  type="file"
                  accept=".xlsx, .csv"
                  className="d-none"
                  ref={inputRef}
                  onChange={(e) => {
                    procesarArchivo(e.target.files[0]);
                    e.target.value = null;
                  }}
                />
              </div>
            </div>
          )}
        </CCardBody>
      </CCard>
    </>
  );
}
