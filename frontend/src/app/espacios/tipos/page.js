'use client';

/**
 * /espacios/tipos - listado de tipos de espacio (HU-2).
 *
 * Cuelga del menu de Espacios porque es una tabla de apoyo de ese modulo:
 * aca se cargan los tipos que despues aparecen al dar de alta un espacio.
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
import { listarTiposEspacio, eliminarTipoEspacio } from '@/servicios/tiposEspacio.js';

export default function PantallaTiposEspacio() {
  const { mostrarToast } = useToast();

  const [tipos, setTipos] = useState([]);
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
        const filas = await listarTiposEspacio();
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
      await eliminarTipoEspacio(aEliminar.idTipoEspacio);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se elimino el tipo de espacio "${aEliminar.nombre}".`,
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
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (tipo) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/espacios/tipos/${tipo.idTipoEspacio}/editar`}
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
        titulo="Tipos de espacio"
        descripcion="Los tipos que se pueden elegir al cargar un espacio."
        accion={{ texto: 'Agregar tipo', direccion: '/espacios/tipos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tipos}
            claveFila={(tipo) => tipo.idTipoEspacio}
            columnas={columnas}
            buscarPor={['nombre']}
            placeholderBusqueda="Buscar tipo de espacio..."
            cargando={cargando}
            textoVacio="Todavia no hay tipos de espacio cargados."
            accionVacio={{ texto: 'Agregar tipo', direccion: '/espacios/tipos/agregar' }}
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
          Se va a eliminar el tipo de espacio <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no hay espacios que lo esten usando.
        </p>
      </DialogoEliminar>
    </>
  );
}
