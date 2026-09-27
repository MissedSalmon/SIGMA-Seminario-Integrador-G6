'use client';

/**
 * /inventario/materiales - catalogo y stock de materiales del deposito
 * (HU-15 y HU-16). Los materiales se manejan distinto que las herramientas
 * (llevan stock, no se prestan), por eso tienen su propia pantalla en vez de
 * compartir el listado.
 *
 * Muestra el stock minimo y actual de cada material (el actual en negrita si
 * esta por debajo del minimo).
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

const ESTADOS_STOCK = ['Sin stock', 'Stock mínimo', 'Stock suficiente'];

function estadoStockDe(fila) {
  if (fila.stockActual === 0) return 'Sin stock';
  return fila.bajoMinimo ? 'Stock mínimo' : 'Stock suficiente';
}

export default function PantallaMateriales() {
  const { mostrarToast } = useToast();
  const [materiales, setMateriales] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [estadoStock, setEstadoStock] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarItems('Material')
      .then(setMateriales)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [recarga]);

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

  const filas = materiales.map((fila) => ({ ...fila, estadoStock: estadoStockDe(fila) }));
  const filasVisibles = filas
    .filter((fila) => !categoria || fila.nombreTipo === categoria)
    .filter((fila) => !estadoStock || fila.estadoStock === estadoStock);

  const categorias = [...new Set(filas.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const columnas = [
    {
      clave: 'codigo',
      encabezado: 'Código',
      render: (fila) => <span className="fw-semibold">{fila.codigo}</span>,
    },
    { clave: 'nombre', encabezado: 'Nombre', render: (fila) => fila.nombre },
    {
      clave: 'nombreTipo',
      encabezado: 'Categoría',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    { clave: 'stockMinimo', encabezado: 'Stock mínimo', render: (fila) => fila.stockMinimo },
    {
      clave: 'stockActual',
      encabezado: 'Stock actual',
      render: (fila) => (fila.bajoMinimo ? <strong>{fila.stockActual}</strong> : fila.stockActual),
    },
    { clave: 'estadoStock', encabezado: 'Estado', render: (fila) => fila.estadoStock },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/inventario/materiales/${encodeURIComponent(fila.codigo)}/editar`}
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
      <EncabezadoPagina titulo="Materiales" accion={{ direccion: '/inventario/materiales/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'descripcion', 'nombreTipo']}
            placeholderBusqueda="Buscar por código, nombre o categoría"
            filtros={[
              // Solo tiene sentido si ya hay mas de una categoria cargada.
              ...(categorias.length > 1
                ? [
                    {
                      etiqueta: 'Categoría',
                      valor: categoria,
                      alCambiar: setCategoria,
                      opciones: categorias.map((texto) => ({ valor: texto, texto })),
                    },
                  ]
                : []),
              {
                etiqueta: 'Estado',
                valor: estadoStock,
                alCambiar: setEstadoStock,
                opciones: ESTADOS_STOCK.map((texto) => ({ valor: texto, texto })),
              },
            ]}
            alLimpiar={() => {
              setCategoria('');
              setEstadoStock('');
            }}
            cargando={cargando}
            textoVacio="Todavia no hay materiales cargados."
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
