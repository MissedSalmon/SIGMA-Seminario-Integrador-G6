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
import { eliminarItem, listarItems } from '@/servicios/inventario.js';

export default function PantallaInventario() {
  const { mostrarToast } = useToast();
  const [items, setItems] = useState([]);
  const [clase, setClase] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarItems(clase || null).then(setItems).catch((fallo) => setError(fallo.message)).finally(() => setCargando(false));
  }, [clase, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    try {
      await eliminarItem(aEliminar.codigo);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino el item "${aEliminar.codigo}".` });
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
    { clave: 'codigo', encabezado: 'Codigo', render: (item) => <span className="fw-semibold">{item.codigo}</span> },
    { clave: 'nombre', encabezado: 'Nombre', render: (item) => item.nombre },
    { clave: 'clase', encabezado: 'Clase', render: (item) => item.clase },
    { clave: 'nombreTipo', encabezado: 'Tipo', render: (item) => <span className="text-body-secondary">{item.nombreTipo || '-'}</span> },
    { clave: 'stock', encabezado: 'Stock minimo', render: (item) => item.clase === 'Material' ? item.stockMinimo : '-' },
    { clave: 'estado', encabezado: 'Estado', render: (item) => item.estado },
    {
      clave: 'acciones', encabezado: 'Acciones', alinearDerecha: true, render: (item) => (
        <CButtonGroup size="sm">
          <BotonEnlace href={`/inventario/${encodeURIComponent(item.codigo)}/editar`} variante="ghost" className="btn-icono" title="Editar"><CIcon icon={cilPencil} /></BotonEnlace>
          <CButton variant="ghost" color="danger" className="btn-icono" onClick={() => setAEliminar(item)} title="Eliminar"><CIcon icon={cilTrash} /></CButton>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Materiales y herramientas" descripcion="Catalogo del deposito y sus existencias." accion={{ texto: 'Agregar item', direccion: '/inventario/agregar' }} />
      <Aviso mensaje={error} onCerrar={() => setError('')} />
      <CCard><CCardBody><TablaDatos filas={items} claveFila={(item) => item.codigo} columnas={columnas} buscarPor={['codigo', 'nombre', 'descripcion', 'nombreTipo']} placeholderBusqueda="Buscar por codigo, nombre o tipo..." filtros={<CFormSelect value={clase} onChange={(evento) => setClase(evento.target.value)} aria-label="Filtrar por clase" style={{ maxWidth: '15rem' }}><option value="">Todos</option><option value="Material">Materiales</option><option value="Herramienta">Herramientas</option></CFormSelect>} cargando={cargando} textoVacio="Todavia no hay materiales ni herramientas cargados." accionVacio={{ texto: 'Agregar item', direccion: '/inventario/agregar' }} /></CCardBody></CCard>
      <DialogoEliminar visible={Boolean(aEliminar)} eliminando={eliminando} onConfirmar={confirmarBaja} onCancelar={() => setAEliminar(null)}><p className="mb-0">Se va a eliminar <strong>{aEliminar?.nombre}</strong>.</p><p className="text-body-secondary mt-2 mb-0">No se puede eliminar un item que tenga ingresos o consumos registrados.</p></DialogoEliminar>
    </>
  );
}
