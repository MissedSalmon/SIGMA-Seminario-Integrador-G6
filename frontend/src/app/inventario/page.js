'use client';

/**
 * /inventario - listado de materiales y herramientas del deposito (HU-15).
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
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
  const [articulos, setArticulos] = useState([]);
  const [clase, setClase] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarItems(clase || null)
      .then(setArticulos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [clase, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    try {
      await eliminarItem(aEliminar.codigo);
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó "${aEliminar.nombre}".` });
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
    {
      clave: 'codigo',
      encabezado: 'Código',
      render: (fila) => <span className="fw-semibold">{fila.codigo}</span>,
    },
    { clave: 'nombre', encabezado: 'Nombre', render: (fila) => fila.nombre },
    { clave: 'clase', encabezado: 'Clase', render: (fila) => fila.clase },
    {
      clave: 'nombreTipo',
      encabezado: 'Tipo',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    {
      clave: 'stock',
      encabezado: 'Stock mínimo',
      render: (fila) => (fila.clase === 'Material' ? fila.stockMinimo : '-'),
    },
    { clave: 'estado', encabezado: 'Estado', render: (fila) => fila.estado },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/inventario/${encodeURIComponent(fila.codigo)}/editar`}
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
            onClick={() => setAEliminar(fila)}
            title="Eliminar"
          >
            <CIcon icon={cilTrash} />
          </CButton>
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Materiales y herramientas"
        accion={{ direccion: '/inventario/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={articulos}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'descripcion', 'nombreTipo']}
            placeholderBusqueda="Buscar por código, nombre o tipo"
            filtros={[
              {
                etiqueta: 'Clase',
                valor: clase,
                alCambiar: setClase,
                opciones: [
                  { valor: 'Material', texto: 'Materiales' },
                  { valor: 'Herramienta', texto: 'Herramientas' },
                ],
              },
            ]}
            cargando={cargando}
            textoVacio="Todavia no hay materiales ni herramientas cargados."
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aEliminar)}
        eliminando={eliminando}
        onConfirmar={confirmarBaja}
        onCancelar={() => setAEliminar(null)}
      >
        <p className="mb-0">
          Se va a eliminar <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene ingresos ni consumos registrados.
        </p>
      </DialogoEliminar>
    </>
  );
}
