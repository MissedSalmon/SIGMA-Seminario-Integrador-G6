'use client';

/**
 * /activos - inventario de activos (HU-7).
 *
 * Se puede filtrar por espacio, por tipo y por estado, y los tres se combinan.
 * El buscador de arriba busca por codigo, tipo.
 *
 * Dar de baja no borra: pasa el activo a Retirado y lo deja en la lista, para
 * conservar su historial de intervenciones.
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash, cilCloudUpload, cilCloudDownload } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';
import { listarActivos, darDeBajaActivo } from '@/servicios/activos.js';
import {
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem
} from '@coreui/react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';


const ESTADOS = ['Operativo', 'En mantenimiento', 'Fuera de servicio', 'Retirado'];

export default function PantallaActivos() {
  const { mostrarToast } = useToast();

  const [activos, setActivos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [tipos, setTipos] = useState([]);

  // El espacio se guarda como "edificio|numero" porque su clave son dos datos.
  const [filtroEspacio, setFiltroEspacio] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aDarDeBaja, setADarDeBaja] = useState(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);

  // Los espacios y los tipos se cargan una sola vez: son los desplegables.
  useEffect(() => {
    Promise.all([listarEspacios(), listarTiposActivos()])
      .then(([listaEspacios, listaTipos]) => {
        setEspacios(listaEspacios);
        setTipos(listaTipos);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      const [idEdificio, espacio_num] = filtroEspacio ? filtroEspacio.split('|') : [];

      try {
        const filas = await listarActivos({
          idEdificio: idEdificio || null,
          espacio_num: espacio_num || null,
          idTipoActivo: filtroTipo || null,
          estado: filtroEstado || null,
        });
        if (!vigente) return;
        setActivos(filas);
        setError('');
      } catch (fallo) {
        if (vigente) setError(fallo.message);
      } finally {
        if (vigente) setCargando(false);
      }
    }

    pedir();

    return () => {
      vigente = false;
    };
  }, [filtroEspacio, filtroTipo, filtroEstado, recarga]);

  async function confirmarBaja() {
    setDandoDeBaja(true);
    setError('');

    try {
      await darDeBajaActivo(aDarDeBaja.codigo);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se dio de baja el activo "${aDarDeBaja.codigo}". Queda como Retirado.`,
      });
      setADarDeBaja(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setADarDeBaja(null);
    } finally {
      setDandoDeBaja(false);
    }
  }

  

  const exportarActivos = async () => {
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
    saveAs(new Blob([buffer]), 'listado activos.xlsx');
  };

  const hayFiltros = Boolean(filtroEspacio || filtroTipo || filtroEstado);

  const columnas = [
    {
      clave: 'codigo',
      encabezado: 'Código',
      render: (activo) => <span className="fw-semibold">{activo.codigo}</span>,
    },

    {
      clave: 'tipo',
      encabezado: 'Tipo',
      render: (activo) => <span className="text-body-secondary">{activo.nombreTipo}</span>,
    },
    {
      clave: 'ubicacion',
      encabezado: 'Ubicación',
      render: (activo) => (
        <span className="text-body-secondary">
          {activo.nombreEdificio} — {activo.nombreEspacio}
        </span>
      ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (activo) => <span className="text-body-secondary">{activo.estado}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (activo) => (
        <CButtonGroup size="sm">
          {/* Un activo retirado se conserva como historial: ya no se toca. */}
          {activo.estado !== 'Retirado' && (
            <>
              <BotonEnlace
                href={`/activos/${encodeURIComponent(activo.codigo)}/editar`}
                variante="ghost"
                className="btn-icono"
                title="Editar"
              >
                <CIcon icon={cilPencil} />
              </BotonEnlace>
              <CButton
                variant="ghost"
                color="danger"
                className="btn-icono"
                onClick={() => setADarDeBaja(activo)}
                title="Dar de baja"
              >
                <CIcon icon={cilTrash} />
              </CButton>
            </>
          )}
        </CButtonGroup>
      ),
    },
  ];

  const dropdownOpciones = (
    <CDropdown>
      <CDropdownToggle color="secondary" variant="outline">
        Opciones
      </CDropdownToggle>
      <CDropdownMenu>
        <CDropdownItem href="/activos/importar">
          <CIcon icon={cilCloudUpload} className="me-2" />
          Importar
        </CDropdownItem>
        <CDropdownItem as="button" onClick={exportarActivos}>
          <CIcon icon={cilCloudDownload} className="me-2" />
          Exportar
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Activos"
        accion={{ direccion: '/activos/agregar' }}
        accionesExtra={dropdownOpciones}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={activos}
            claveFila={(activo) => activo.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombreTipo']}
            placeholderBusqueda="Buscar por código o tipo"
            filtros={[
              {
                etiqueta: 'Espacio',
                valor: filtroEspacio,
                alCambiar: setFiltroEspacio,
                opciones: espacios.map((espacio) => ({
                  valor: `${espacio.idEdificio}|${espacio.espacio_num}`,
                  texto: `${espacio.nombreEdificio} — ${espacio.nombre || espacio.espacio_num}`,
                })),
              },
              {
                etiqueta: 'Tipo',
                valor: filtroTipo,
                alCambiar: setFiltroTipo,
                opciones: tipos.map((tipo) => ({
                  valor: tipo.idTipoActivo,
                  texto: tipo.nombre,
                })),
              },
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: ESTADOS.map((unEstado) => ({ valor: unEstado, texto: unEstado })),
              },
            ]}
            cargando={cargando}
            textoVacio={
              hayFiltros
                ? 'No hay activos que cumplan con esos filtros.'
                : 'Todavia no hay activos cargados.'
            }
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aDarDeBaja)}
        titulo="Confirmar la baja"
        eliminando={dandoDeBaja}
        onConfirmar={confirmarBaja}
        onCancelar={() => setADarDeBaja(null)}
      >
        <p className="mb-0">
          Se va a dar de baja el activo <strong>{aDarDeBaja?.codigo}</strong>
          .
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Pasa a estado <strong>Retirado</strong> y deja de estar disponible, pero no se elimina:
          se conserva su historial de intervenciones.
        </p>
      </DialogoEliminar>

      
    </>
  );
}
