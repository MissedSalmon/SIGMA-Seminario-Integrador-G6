'use client';

/**
 * /tecnicos - listado de tecnicos (HU-5).
 *
 * Se puede filtrar por especialidad y por disponibilidad, y los dos filtros
 * se combinan (AND): "Electricidad" + "Disponible" trae solo los tecnicos
 * electricistas que ahora mismo pueden recibir tareas.
 *
 * Cada fila tiene «Ver detalle» y «Editar»; el resto de las acciones está en la
 * ficha, igual que en autorizados
 * (ver componentes/usuarios/AccionesUsuario.js).
 */
import { useEffect, useMemo, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import {
  AccionesFila,
  COLUMNA_ESTADO,
  OPCIONES_ESTADO,
  filtrarPorEstado,
} from '@/componentes/usuarios/AccionesUsuario.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';
import { listarTecnicos, eliminarTecnico } from '@/servicios/tecnicos.js';

export default function PantallaTecnicos() {
  const [tecnicos, setTecnicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [filtroEspecialidad, setFiltroEspecialidad] = useState('');
  const [filtroDisponibilidad, setFiltroDisponibilidad] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');


  // Las especialidades se cargan una sola vez: son las del desplegable del filtro.
  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message));
  }, []);

  useEffect(() => {
    let vigente = true;

    async function pedir() {
      try {
        const filas = await listarTecnicos({
          especialidad_id: filtroEspecialidad || null,
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
  }, [filtroEspecialidad, filtroDisponibilidad]);

  const filtrados = useMemo(() => filtrarPorEstado(tecnicos, filtroEstado), [tecnicos, filtroEstado]);

  const columnas = [
    {
      clave: 'legajo',
      encabezado: 'Legajo',
      render: (tecnico) => <span className="text-body-secondary">{tecnico.legajo}</span>,
    },
    {
      clave: 'tecnico',
      encabezado: 'Técnico',
      render: (tecnico) => (
        <span className="fw-semibold">
          {tecnico.nombre} 
        </span>
      ),
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
    COLUMNA_ESTADO,
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (tecnico) => (
        <AccionesFila
          nombre={tecnico.nombre}
          hrefDetalle={`/tecnicos/${tecnico.legajo}`}
          hrefEditar={`/tecnicos/${tecnico.legajo}/editar`}
        />
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Técnicos"
        accion={{ direccion: '/tecnicos/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtrados}
            claveFila={(tecnico) => tecnico.legajo}
            columnas={columnas}
            buscarPor={['nombre', 'legajo']}
            placeholderBusqueda="Buscar por nombre o legajo"
            filtros={[
              {
                etiqueta: 'Especialidad',
                valor: filtroEspecialidad,
                alCambiar: setFiltroEspecialidad,
                textoTodos: 'Todas',
                opciones: especialidades.map((especialidad) => ({
                  valor: especialidad.idEspecialidad,
                  texto: especialidad.nombre,
                })),
              },
              {
                etiqueta: 'Disponibilidad',
                valor: filtroDisponibilidad,
                alCambiar: setFiltroDisponibilidad,
                textoTodos: 'Todas',
                opciones: [
                  { valor: 'Disponible', texto: 'Disponible' },
                  { valor: 'No disponible', texto: 'No disponible' },
                ],
              },
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: OPCIONES_ESTADO,
              },
            ]}
            alLimpiar={() => {
              setFiltroEspecialidad('');
              setFiltroDisponibilidad('');
              setFiltroEstado('');
            }}
            cargando={cargando}
            textoVacio={
              filtroEspecialidad || filtroDisponibilidad || filtroEstado
                ? 'No hay tecnicos que cumplan con ese filtro.'
                : 'Todavia no hay tecnicos cargados.'
            }
          />
        </CCardBody>
      </CCard>
    </>
  );
}
