'use client';

/**
 * /prestadores - listado de prestadores de servicio (HU-25).
 *
 * Se puede filtrar por tipo de prestador, para encontrar quien hace el trabajo
 * que se necesita. Un prestador con tareas asignadas no se puede eliminar.
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
import { listarTiposPrestador } from '@/servicios/tiposPrestador.js';
import { listarPrestadores, eliminarPrestador } from '@/servicios/prestadores.js';

export default function PantallaPrestadores() {
  const { mostrarToast } = useToast();

  const [prestadores, setPrestadores] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Los tipos se cargan una sola vez: son las opciones del filtro.
  useEffect(() => {
    listarTiposPrestador()
      .then(setTipos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarPrestadores({ tipo_prestador_id: filtroTipo || null });
        if (!vigente) return;
        setPrestadores(filas);
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
  }, [filtroTipo, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarPrestador(aEliminar.idPrestador);
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó el prestador "${aEliminar.nombre}".` });
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
      encabezado: 'Prestador',
      render: (prestador) => <span className="fw-semibold">{prestador.nombre}</span>,
    },
    {
      clave: 'cuil',
      encabezado: 'CUIL o CUIT',
      render: (prestador) => (
        <span className="text-body-secondary text-nowrap">{prestador.cuil || '-'}</span>
      ),
    },
    {
      clave: 'tipos',
      encabezado: 'Tipo',
      // Un prestador puede tener mas de uno, asi que van separados por coma.
      render: (prestador) => (
        <span className="text-body-secondary">
          {prestador.tipos.map((tipo) => tipo.nombre).join(', ') || '-'}
        </span>
      ),
    },
    {
      clave: 'contacto',
      encabezado: 'Contacto',
      render: (prestador) => (
        <span className="text-body-secondary">
          {[prestador.telefono, prestador.email].filter(Boolean).join(' · ') || '-'}
        </span>
      ),
    },
    {
      clave: 'garantia',
      encabezado: 'Garantía',
      render: (prestador) => (
        <span className="text-body-secondary">{prestador.garantia || '-'}</span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (prestador) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/prestadores/${prestador.idPrestador}/editar`}
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
            onClick={() => setAEliminar(prestador)}
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
      <EncabezadoPagina titulo="Listado de prestadores" accion={{ direccion: '/prestadores/agregar' }} />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={prestadores}
            claveFila={(prestador) => prestador.idPrestador}
            columnas={columnas}
            buscarPor={['nombre', 'cuil', 'email']}
            placeholderBusqueda="Buscar por nombre, CUIL o email"
            filtros={[
              {
                etiqueta: 'Prestación',
                valor: filtroTipo,
                alCambiar: setFiltroTipo,
                textoTodos: 'Todas',
                opciones: tipos.map((tipo) => ({
                  valor: tipo.idTipoPrestador,
                  texto: tipo.nombre,
                })),
              },
            ]}
            alLimpiar={() => setFiltroTipo('')}
            cargando={cargando}
            textoVacio={
              filtroTipo
                ? 'No hay prestadores de ese tipo.'
                : 'Todavía no hay prestadores cargados.'
            }
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
          Se va a eliminar el prestador <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene tareas asignadas, para no perder el historial.
        </p>
      </DialogoEliminar>
    </>
  );
}
