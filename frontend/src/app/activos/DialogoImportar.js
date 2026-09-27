import { useState } from 'react';
import {
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CButton,
  CFormInput,
  CAlert,
  CBadge
} from '@coreui/react';
import * as xlsx from 'xlsx';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { validarImportacion, confirmarImportacion } from '@/servicios/activos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function DialogoImportar({ visible, onCerrar, onRecargar }) {
  const [archivo, setArchivo] = useState(null);
  const [filasValidadas, setFilasValidadas] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [errorGlobal, setErrorGlobal] = useState('');
  const { mostrarToast } = useToast();

  const manejarCambioArchivo = (e) => {
    setArchivo(e.target.files[0] || null);
    setFilasValidadas([]);
    setErrorGlobal('');
  };

  const descargarPlantilla = () => {
    const encabezados = [
      'activoCodigo', 'activoDesc', 'tipoActivoId', 'tipoActivoNom', 'edificioId',
      'espacioNum', 'activoFechaAlta', 'activoFechaInst', 'activoEstado'
    ];
    const hoja = xlsx.utils.aoa_to_sheet([encabezados]);
    const libro = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(libro, hoja, 'Plantilla');
    xlsx.writeFile(libro, 'plantilla_activos.xlsx');
  };

  const validarArchivo = async () => {
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
      onCerrar();
      onRecargar();
      setArchivo(null);
      setFilasValidadas([]);
    } catch (e) {
      setErrorGlobal(e.message || 'Error al confirmar la importación');
    } finally {
      setCargando(false);
    }
  };

  const columnas = [
    {
      clave: 'filaInfo',
      encabezado: 'Fila (Datos)',
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
    <CModal visible={visible} onClose={onCerrar} size="xl" backdrop="static">
      <CModalHeader closeButton>
        <CModalTitle>Importar Activos</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {errorGlobal && <CAlert color="danger">{errorGlobal}</CAlert>}
        
        <div className="mb-3">
          <p className="text-body-secondary mb-2">
            Puedes descargar una plantilla con las columnas esperadas antes de subir tu archivo.
          </p>
          <CButton color="secondary" variant="outline" size="sm" onClick={descargarPlantilla}>
            Descargar Plantilla
          </CButton>
        </div>

        <div className="mb-3">
          <CFormInput
            type="file"
            accept=".xlsx, .csv"
            onChange={manejarCambioArchivo}
            disabled={cargando}
          />
        </div>

        {archivo && !hayFilas && (
          <CButton color="primary" onClick={validarArchivo} disabled={cargando}>
            {cargando ? 'Validando...' : 'Validar Archivo'}
          </CButton>
        )}

        {hayFilas && (
          <div className="mt-4">
            <h5 className="mb-3">Vista previa</h5>
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <TablaDatos
                filas={filasValidadas}
                claveFila={(item, index) => index}
                columnas={columnas}
                textoVacio="No hay datos."
              />
            </div>
            <div className="mt-3">
              <p>
                <strong>{cantidadValidas}</strong> fila(s) válida(s) de un total de {filasValidadas.length}.
              </p>
            </div>
          </div>
        )}
      </CModalBody>
      <CModalFooter>
        <CButton color="secondary" onClick={onCerrar} disabled={cargando}>
          Cancelar
        </CButton>
        {hayFilas && (
          <CButton color="success" onClick={confirmar} disabled={cargando || cantidadValidas === 0} className="text-white">
            Confirmar Importación
          </CButton>
        )}
      </CModalFooter>
    </CModal>
  );
}
