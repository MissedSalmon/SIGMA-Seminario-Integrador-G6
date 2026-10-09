'use client';

/**
 * /autorizados - listado de usuarios autorizados (HU-8).
 *
 * Se puede filtrar por area para ver quien es responsable de cada una.
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
import { listarAreas } from '@/servicios/areas.js';
import { listarAutorizados, eliminarAutorizado } from '@/servicios/autorizados.js';

export default function PantallaAutorizados() {
  const { mostrarToast } = useToast();

  const [autorizados, setAutorizados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filtroArea, setFiltroArea] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Las areas se cargan una sola vez: son las del desplegable del filtro.
  useEffect(() => {
    listarAreas()
      .then(setAreas)
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    // Si la pantalla se cierra mientras la API responde, no se toca el estado.
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarAutorizados({ area_id: filtroArea || null });
        if (!vigente) return;
        setAutorizados(filas);
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
  }, [filtroArea, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarAutorizado(aEliminar.legajo);
      mostrarToast({ tipo: 'exito', mensaje: `Se eliminó a "${aEliminar.nombre}".` });
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
      clave: 'legajo',
      encabezado: 'Legajo',
      render: (autorizado) => <span className="text-body-secondary">{autorizado.legajo}</span>,
    },
    {
      clave: 'nombre',
      encabezado: 'Nombre y apellido',
      render: (autorizado) => <span className="fw-semibold">{autorizado.nombre}</span>,
    },
    {
      clave: 'dni',
      encabezado: 'DNI',
      render: (autorizado) => <span className="text-body-secondary">{autorizado.dni ?? '-'}</span>,
    },
    {
      clave: 'email',
      encabezado: 'Email',
      render: (autorizado) => <span className="text-body-secondary">{autorizado.email ?? '-'}</span>,
    },
    {
      clave: 'telefono',
      encabezado: 'Teléfono',
      render: (autorizado) => (
        <span className="text-body-secondary">{autorizado.telefono ?? '-'}</span>
      ),
    },
    {
      clave: 'area',
      encabezado: 'Área',
      render: (autorizado) => (
        <span className="text-body-secondary">{autorizado.nombreArea || '-'}</span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (autorizado) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/autorizados/${autorizado.legajo}/editar`}
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
            onClick={() => setAEliminar(autorizado)}
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
        titulo="Usuarios autorizados"
        descripcion="Los responsables de cada área: son los que pueden cargar tickets sobre los activos de su área."
        accion={{ direccion: '/autorizados/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={autorizados}
            claveFila={(autorizado) => autorizado.legajo}
            columnas={columnas}
            buscarPor={['nombre', 'legajo', 'dni', 'email', 'nombreArea']}
            placeholderBusqueda="Buscar por nombre, legajo o DNI"
            filtros={[
              {
                etiqueta: 'Área',
                valor: filtroArea,
                alCambiar: setFiltroArea,
                textoTodos: 'Todas',
                opciones: areas.map((area) => ({
                  valor: area.idArea,
                  texto: area.nombre,
                })),
              },
            ]}
            cargando={cargando}
            textoVacio={
              filtroArea
                ? 'No hay usuarios autorizados en esa área.'
                : 'Todavía no hay usuarios autorizados cargados.'
            }
            accionVacio={filtroArea ? undefined : { direccion: '/autorizados/agregar' }}
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
          Se va a eliminar al usuario autorizado <strong>{aEliminar?.nombre}</strong>.
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Si ya cargó tickets no se puede eliminar: cada ticket tiene que seguir diciendo quién lo
          reportó. El área que tenía a cargo queda sin responsable.
        </p>
      </DialogoEliminar>
    </>
  );
}
