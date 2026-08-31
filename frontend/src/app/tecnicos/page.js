'use client';

/**
 * /tecnicos - listado de tecnicos (HU-5).
 *
 * Se puede filtrar por especialidad y por disponibilidad, y los dos filtros
 * se combinan (AND): "Electricista" + "Disponible" trae solo los tecnicos
 * electricistas que ahora mismo pueden recibir tareas.
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody, CFormSelect } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';
import { listarTecnicos, eliminarTecnico } from '@/servicios/tecnicos.js';

export default function PantallaTecnicos() {
  const { mostrarToast } = useToast();

  const [tecnicos, setTecnicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Las especialidades se cargan una sola vez: son las del desplegable del filtro.
  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Se suma 1 para volver a pedir la lista (por ejemplo, despues de una baja).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarTecnicos({
          especialidadId: filtroEspecialidad || null,
          disponibilidad: filtroDisponibilidad || null,
        });
        if (!vigente) return;
        setTecnicos(filas);
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
  }, [filtroEspecialidad, filtroDisponibilidad, recarga]);

  async function confirmarBaja() {
    setEliminando(true);
    setError('');

    try {
      await eliminarTecnico(aEliminar.legajo);
      mostrarToast({ tipo: 'exito', mensaje: `Se elimino al tecnico "${aEliminar.nombre} ${aEliminar.apellido}".` });
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
      render: (tecnico) => <span className="text-body-secondary">{tecnico.legajo}</span>,
    },
    {
      clave: 'tecnico',
      encabezado: 'Tecnico',
      render: (tecnico) => (
        <span className="fw-semibold">
          {tecnico.nombre} {tecnico.apellido}
        </span>
      ),
    },
    {
      clave: 'dni',
      encabezado: 'DNI',
      render: (tecnico) => <span className="text-body-secondary">{tecnico.dni}</span>,
    },
    {
      clave: 'especialidad',
      encabezado: 'Especialidad',
      // Un tecnico puede tener mas de una, asi que van separadas por coma.
      render: (tecnico) => (
        <span className="text-body-secondary">
          {tecnico.especialidades.map((especialidad) => especialidad.nombre).join(', ') || '-'}
        </span>
      ),
    },
    {
      clave: 'disponibilidad',
      encabezado: 'Disponibilidad',
      render: (tecnico) => (
        <span className="text-body-secondary">{tecnico.disponibilidad}</span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (tecnico) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/tecnicos/${tecnico.legajo}/editar`}
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
            onClick={() => setAEliminar(tecnico)}
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
        titulo="Tecnicos"
        descripcion="El personal de mantenimiento: su especialidad y su disponibilidad para recibir tareas."
        accion={{ texto: 'Agregar tecnico', direccion: '/tecnicos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={tecnicos}
            claveFila={(tecnico) => tecnico.legajo}
            columnas={columnas}
            buscarPor={['nombre', 'apellido', 'dni', 'legajo']}
            placeholderBusqueda="Buscar por nombre, apellido o DNI..."
            filtros={
              <>
                <CFormSelect
                  value={filtroEspecialidad}
                  onChange={(evento) => setFiltroEspecialidad(evento.target.value)}
                  aria-label="Filtrar por especialidad"
                  style={{ maxWidth: '14rem' }}
                >
                  <option value="">Todas las especialidades</option>
                  {especialidades.map((especialidad) => (
                    <option key={especialidad.idEspecialidad} value={especialidad.idEspecialidad}>
                      {especialidad.nombre}
                    </option>
                  ))}
                </CFormSelect>

                <CFormSelect
                  value={filtroDisponibilidad}
                  onChange={(evento) => setFiltroDisponibilidad(evento.target.value)}
                  aria-label="Filtrar por disponibilidad"
                  style={{ maxWidth: '12rem' }}
                >
                  <option value="">Todas</option>
                  <option value="Disponible">Disponible</option>
                  <option value="No disponible">No disponible</option>
                </CFormSelect>
              </>
            }
            cargando={cargando}
            textoVacio={
              filtroEspecialidad || filtroDisponibilidad
                ? 'No hay tecnicos que cumplan con ese filtro.'
                : 'Todavia no hay tecnicos cargados.'
            }
            accionVacio={
              filtroEspecialidad || filtroDisponibilidad
                ? undefined
                : { texto: 'Agregar tecnico', direccion: '/tecnicos/agregar' }
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
          Se va a eliminar al tecnico{' '}
          <strong>
            {aEliminar?.nombre} {aEliminar?.apellido}
          </strong>
          .
        </p>
        <p className="text-body-secondary mt-2 mb-0">
          Solo se puede eliminar si no tiene tareas asignadas. Si el tecnico ya no trabaja pero tiene
          historial, marcalo como &quot;No disponible&quot; en vez de eliminarlo.
        </p>
      </DialogoEliminar>
    </>
  );
}
