'use client';

/**
 * /autorizados - listado de usuarios autorizados (HU-8).
 *
 * Se puede filtrar por area para ver quien es responsable de cada una.
 *
 * Cada fila tiene «Ver detalle» y «Editar»; el resto de las acciones está en la
 * ficha, igual que en tecnicos
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
import { listarAreas } from '@/servicios/areas.js';
import { listarAutorizados, eliminarAutorizado } from '@/servicios/autorizados.js';

export default function PantallaAutorizados() {
  const [autorizados, setAutorizados] = useState([]);
  const [areas, setAreas] = useState([]);
  const [filtroArea, setFiltroArea] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');


  // Las areas se cargan una sola vez: son las del desplegable del filtro.
  useEffect(() => {
    listarAreas()
      .then(setAreas)
      .catch((fallo) => setError(fallo.message));
  }, []);

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
  }, [filtroArea]);

  const filtrados = useMemo(() => filtrarPorEstado(autorizados, filtroEstado), [autorizados, filtroEstado]);

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
    COLUMNA_ESTADO,
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (autorizado) => (
        <AccionesFila
          nombre={autorizado.nombre}
          hrefDetalle={`/autorizados/${autorizado.legajo}`}
          hrefEditar={`/autorizados/${autorizado.legajo}/editar`}
        />
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Solicitantes"
        descripcion="Los responsables de cada área: son los que pueden cargar tickets sobre los activos de su área."
        accion={{ direccion: '/autorizados/agregar' }}
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtrados}
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
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: OPCIONES_ESTADO,
              },
            ]}
            alLimpiar={() => {
              setFiltroArea('');
              setFiltroEstado('');
            }}
            cargando={cargando}
            textoVacio={
              filtroArea || filtroEstado
                ? 'No hay usuarios autorizados con ese filtro.'
                : 'Todavía no hay usuarios autorizados cargados.'
            }
            accionVacio={filtroArea || filtroEstado ? undefined : { direccion: '/autorizados/agregar' }}
          />
        </CCardBody>
      </CCard>
    </>
  );
}
