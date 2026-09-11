'use client';

import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarTipoInventario, listarTiposInventario } from '@/servicios/inventario.js';

export default function PantallaTiposInventario() {
  const { mostrarToast } = useToast();
  const [tipos, setTipos] = useState([]);
  const [clase, setClase] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarTiposInventario(clase || null).then(setTipos).catch((fallo) => setError(fallo.message)).finally(() => setCargando(false));
  }, [clase, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    try {
      await eliminarTipoInventario(aEliminar.idTipo);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino el tipo "${aEliminar.nombre}".` });
      setAEliminar(null);
      setRecarga((numero) => numero + 1);
    } catch (fallo) {
      setError(fallo.message);
      setAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  const columnas = [
    { clave: 'nombre', encabezado: 'Nombre', render: (tipo) => <span className="fw-semibold">{tipo.nombre}</span> },
    { clave: 'clase', encabezado: 'Clase', render: (tipo) => tipo.clase },
    { clave: 'descripcion', encabezado: 'Descripcion', render: (tipo) => <span className="text-body-secondary">{tipo.descripcion || '-'}</span> },
    {
      clave: 'acciones', encabezado: 'Acciones', alinearDerecha: true, render: (tipo) => (
        <CButtonGroup size="sm">
          <BotonEnlace href={`/inventario/tipos/${tipo.idTipo}/editar`} variante="ghost" className="btn-icono" title="Editar"><CIcon icon={cilPencil} /></BotonEnlace>
          <CButton variant="ghost" color="danger" className="btn-icono" onClick={() => setAEliminar(tipo)} title="Eliminar"><CIcon icon={cilTrash} /></CButton>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Tipos de materiales y herramientas" descripcion="Categorias para ordenar el catalogo del deposito." accion={{ texto: 'Agregar tipo', direccion: '/inventario/tipos/agregar' }} />
      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <CCard><CCardBody><TablaDatos filas={tipos} claveFila={(tipo) => tipo.idTipo} columnas={columnas} buscarPor={['nombre', 'descripcion', 'clase']} placeholderBusqueda="Buscar por nombre o clase..." filtros={<CFormSelect value={clase} onChange={(evento) => setClase(evento.target.value)} aria-label="Filtrar por clase" style={{ maxWidth: '15rem' }}><option value="">Todos</option><option value="Material">Materiales</option><option value="Herramienta">Herramientas</option></CFormSelect>} cargando={cargando} textoVacio="Todavia no hay tipos cargados." accionVacio={{ texto: 'Agregar tipo', direccion: '/inventario/tipos/agregar' }} /></CCardBody></CCard>
      <DialogoEliminar visible={Boolean(aEliminar)} eliminando={eliminando} onConfirmar={confirmarBaja} onCancelar={() => setAEliminar(null)}><p className="mb-0">Se va a eliminar el tipo <strong>{aEliminar?.nombre}</strong>.</p><p className="text-body-secondary mt-2 mb-0">Solo puede eliminarse si no tiene items asociados.</p></DialogoEliminar>
    </>
  );
}
