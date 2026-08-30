'use client';

/**
 * /tipos-activos - listado de tipos de activo.
 *
 * Un tipo de activo agrupa a los activos por categoria (aires acondicionados,
 * luminarias, mobiliario). La columna "Activos" muestra cuantos hay de cada
 * uno: si tiene alguno, no se puede eliminar.
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
import { listarTiposActivos, eliminarTipoActivo } from '@/servicios/tiposActivos.js';

export default function PantallaTiposActivos() {
  const { mostrarToast } = useToast();

  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarTiposActivos();
        if (!vigente) return;
        setTipos(filas);
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
  }, [recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarTipoActivo(aEliminar.idTipoActivo);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se elimino el tipo de activo "${aEliminar.nombre}".`,
      });
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
      clave: 'nombre',
      encabezado: 'Nombre',
      render: (tipo) => <span className="fw-semibold">{tipo.nombre}</span>,
    },
    {
      clave: 'descripcion',
      encabezado: 'Descripcion',
      render: (tipo) => <span className="text-body-secondary">{tipo.descripcion || '-'}</span>,
    },
    {
      clave: 'cantidadActivos',
      encabezado: 'Activos',
      render: (tipo) => <span className="text-body-secondary">{tipo.cantidadActivos || 0}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (tipo) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/tipos-activos/${tipo.idTipoActivo}/editar`}
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
            onClick={() => setAEliminar(tipo)}
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
        titulo="Tipos de activos"
        descripcion="Las categorias con las que se agrupa el inventario."
        accion={{ texto: 'Agregar tipo de activo', direccion: '/tipos-activos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tipos}
            claveFila={(tipo) => tipo.idTipoActivo}
            columnas={columnas}
            buscarPor={['nombre', 'descripcion']}
            placeholderBusqueda="Buscar por nombre o descripcion..."
            cargando={cargando}
            textoVacio="Todavia no hay tipos de activos cargados."
            accionVacio={{
              texto: 'Agregar tipo de activo',
              direccion: '/tipos-activos/agregar',
            }}
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
          Se va a eliminar el tipo de activo <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene activos clasificados en el.
        </p>
      </DialogoEliminar>
    </>
  );
}
