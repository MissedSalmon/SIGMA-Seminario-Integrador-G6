'use client';

/**
 * /areas - listado de areas funcionales (HU-3).
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
import { listarAreas, eliminarArea } from '@/servicios/areas.js';

export default function PantallaAreas() {
  const { mostrarToast } = useToast();

  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarAreas();
        if (!vigente) return;
        setAreas(filas);
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
      await eliminarArea(aEliminar.idArea);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino el area "${aEliminar.nombre}".` });
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
      render: (area) => <span className="fw-semibold">{area.nombre}</span>,
    },
    {
      clave: 'espacio',
      encabezado: 'Espacio',
      render: (area) => <span className="text-body-secondary">{area.nombreEspacio}</span>,
    },
    {
      clave: 'edificio',
      encabezado: 'Edificio',
      render: (area) => <span className="text-body-secondary">{area.nombreEdificio}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (area) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/areas/${area.idArea}/editar`}
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
            onClick={() => setAEliminar(area)}
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
        titulo="Áreas"
        accion={{ texto: 'Agregar área', direccion: '/areas/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={areas}
            claveFila={(area) => area.idArea}
            columnas={columnas}
            buscarPor={['nombre', 'nombreEspacio', 'nombreEdificio']}
            placeholderBusqueda="Buscar por nombre, espacio o edificio..."
            cargando={cargando}
            textoVacio="Todavia no hay areas cargadas."
            accionVacio={{ texto: 'Agregar area', direccion: '/areas/agregar' }}
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
          Se va a eliminar el area <strong>{aEliminar?.nombre}</strong>.
        </p>
      </DialogoEliminar>
    </>
  );
}
