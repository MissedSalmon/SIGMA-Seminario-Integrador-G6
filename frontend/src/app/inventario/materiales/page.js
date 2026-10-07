'use client';

/**
 * /inventario/materiales - catalogo y stock de materiales del deposito
 * (HU-15 y HU-16). Los materiales se manejan distinto que las herramientas
 * (llevan stock, no se prestan), por eso tienen su propia pantalla en vez de
 * compartir el listado.
 *
 * Muestra el stock minimo y el actual de cada material, sin un texto de
 * estado (devolucion del Sprint 3): la fila del que esta por debajo del minimo
 * se tiñe apenas de rojo, y abajo de la tabla una referencia explica el color.
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription, cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { eliminarItem, listarItems } from '@/servicios/inventario.js';

/* El filtro de stock: separa los que hay que reponer de los demas. */
const BAJO_MINIMO = 'Por debajo del mínimo';
const SUFICIENTE = 'Suficiente';

export default function PantallaMateriales() {
  const { mostrarToast } = useToast();
  const [materiales, setMateriales] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [filtroStock, setFiltroStock] = useState('');
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

  const filasVisibles = materiales
    .filter((fila) => !categoria || fila.nombreTipo === categoria)
    .filter((fila) => !filtroStock || fila.bajoMinimo === (filtroStock === BAJO_MINIMO));

  const categorias = [...new Set(materiales.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
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
      render: (fila) =>
        fila.bajoMinimo ? <span className="sigma-stock-bajo">{fila.stockActual}</span> : fila.stockActual,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/inventario/materiales/${encodeURIComponent(fila.codigo)}`}
            variante="ghost"
            className="btn-icono"
            title="Ver la ficha y el historial de movimientos"
          >
            <CIcon icon={cilDescription} />
          </BotonEnlace>
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
            claseFila={(fila) => (fila.bajoMinimo ? 'sigma-fila-bajo-minimo' : undefined)}
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
                etiqueta: 'Stock',
                valor: filtroStock,
                alCambiar: setFiltroStock,
                opciones: [BAJO_MINIMO, SUFICIENTE].map((texto) => ({ valor: texto, texto })),
              },
            ]}
            alLimpiar={() => {
              setCategoria('');
              setFiltroStock('');
            }}
            cargando={cargando}
            textoVacio="Todavia no hay materiales cargados."
          />

          {materiales.some((fila) => fila.bajoMinimo) && (
            <div className="sigma-referencia">
              <span className="sigma-referencia-muestra" aria-hidden="true" />
              El stock actual está por debajo del mínimo
            </div>
          )}
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
