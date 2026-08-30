'use client';

/**
 * /edificios - listado de edificios (HU-1).
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
import { listarEdificios, eliminarEdificio } from '@/servicios/edificios.js';

export default function PantallaEdificios() {
  const { mostrarToast } = useToast();

  const [edificios, setEdificios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // El edificio que se esta por eliminar. null = no hay dialogo abierto.
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarEdificios();
        if (!vigente) return;
        setEdificios(filas);
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
      await eliminarEdificio(aEliminar.idEdificio);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino el edificio "${aEliminar.nombre}".` });
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
      render: (edificio) => <span className="fw-semibold">{edificio.nombre}</span>,
    },
    {
      clave: 'direccion',
      encabezado: 'Direccion',
      render: (edificio) => <span className="text-body-secondary">{edificio.direccion ?? '-'}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (edificio) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/edificios/${edificio.idEdificio}/editar`}
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
            onClick={() => setAEliminar(edificio)}
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
        titulo="Edificios"
        accion={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={edificios}
            claveFila={(edificio) => edificio.idEdificio}
            columnas={columnas}
            buscarPor={['nombre', 'direccion']}
            placeholderBusqueda="Buscar por nombre o direccion..."
            cargando={cargando}
            textoVacio="Todavia no hay edificios cargados."
            accionVacio={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }}
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
          Se va a eliminar el edificio <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene espacios cargados.
        </p>
      </DialogoEliminar>
    </>
  );
}
