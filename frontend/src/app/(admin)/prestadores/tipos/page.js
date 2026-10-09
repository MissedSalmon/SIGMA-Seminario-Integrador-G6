'use client';

/**
 * /prestadores/tipos - listado de tipos de prestador de servicio (HU-24).
 *
 * Es una tabla de apoyo del modulo de prestadores (HU-33): aca se cargan los
 * tipos que despues aparecen al dar de alta un prestador.
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
import { listarTiposPrestador, eliminarTipoPrestador } from '@/servicios/tiposPrestador.js';

export default function PantallaTiposPrestador() {
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
        const filas = await listarTiposPrestador();
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
      await eliminarTipoPrestador(aEliminar.idTipoPrestador);
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se eliminó el tipo de prestador "${aEliminar.nombre}".`,
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
      encabezado: 'Descripción',
      render: (tipo) => <span className="text-body-secondary">{tipo.descripcion || '-'}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (tipo) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/prestadores/tipos/${tipo.idTipoPrestador}/editar`}
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
        titulo="Tipos de prestador"
        accion={{ direccion: '/prestadores/tipos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tipos}
            claveFila={(tipo) => tipo.idTipoPrestador}
            columnas={columnas}
            buscarPor={['nombre', 'descripcion']}
            placeholderBusqueda="Buscar por nombre o descripción"
            cargando={cargando}
            textoVacio="Todavia no hay tipos de prestador cargados."
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
          Se va a eliminar el tipo de prestador <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no hay prestadores que lo esten usando.
        </p>
      </DialogoEliminar>
    </>
  );
}
