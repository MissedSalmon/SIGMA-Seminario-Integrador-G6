'use client';

/**
 * /tecnicos/carga-trabajo/:legajo - tareas que componen la carga del técnico.
 */
import { use, useEffect, useState } from 'react';
import { CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft, cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import EtiquetaPrioridad from '@/componentes/ordenes/EtiquetaPrioridad.js';
import { listarTareasDeCarga, obtenerTecnico } from '@/servicios/tecnicos.js';
import { soloFechaLegible } from '@/utils/fechas.js';

function volverALista(desde, hasta) {
  const parametros = new URLSearchParams();
  if (desde) parametros.set('desde', desde);
  if (hasta) parametros.set('hasta', hasta);
  const consulta = parametros.toString();
  return `/tecnicos/carga-trabajo${consulta ? `?${consulta}` : ''}`;
}

export default function PantallaDetalleCargaTrabajo({ params, searchParams }) {
  const { legajo } = use(params);
  const filtros = use(searchParams);
  const desde = filtros?.desde ?? '';
  const hasta = filtros?.hasta ?? '';
  const claveConsulta = JSON.stringify([legajo, desde, hasta]);

  const [tecnico, setTecnico] = useState(null);
  const [tareas, setTareas] = useState([]);
  const [consultaResuelta, setConsultaResuelta] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;

    Promise.all([
      obtenerTecnico(legajo),
      listarTareasDeCarga(legajo, { desde: desde || null, hasta: hasta || null }),
    ])
      .then(([filaTecnico, filasTareas]) => {
        if (!vigente) return;
        setTecnico(filaTecnico);
        setTareas(filasTareas);
        setConsultaResuelta(claveConsulta);
        setError('');
      })
      .catch((fallo) => {
        if (vigente) {
          setTecnico(null);
          setTareas([]);
          setConsultaResuelta(claveConsulta);
          setError(fallo.message);
        }
      });

    return () => {
      vigente = false;
    };
  }, [legajo, desde, hasta, claveConsulta]);

  const cargando = consultaResuelta !== claveConsulta;

  // Mismas columnas y etiquetas que la lista de «Tareas asignadas».
  const columnas = [
    {
      clave: 'prioridad',
      encabezado: 'Prioridad',
      render: (tarea) => <EtiquetaPrioridad prioridad={tarea.prioridad} />,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (tarea) => <EtiquetaEstadoOT estado={tarea.estado} />,
    },
    {
      clave: 'tarea',
      encabezado: 'Tarea',
      render: (tarea) => <span className="fw-semibold">{tarea.descripcion}</span>,
    },
    {
      clave: 'fechaInicio',
      encabezado: 'Inicio previsto',
      render: (tarea) => <span className="text-nowrap">{soloFechaLegible(tarea.fechaInicio)}</span>,
    },
    {
      clave: 'ot',
      encabezado: 'OT',
      render: (tarea) => <span className="text-body-secondary text-nowrap">#{tarea.idOt}</span>,
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (tarea) => (
        <BotonEnlace
          href={`/ordenes-trabajo/${tarea.idOt}`}
          variante="ghost"
          className="btn-icono"
          title="Ver la orden de trabajo"
          aria-label={`Ver la orden de trabajo ${tarea.idOt}`}
        >
          <CIcon icon={cilDescription} />
        </BotonEnlace>
      ),
    },
  ];

  const periodo = desde || hasta
    ? `Período: ${desde ? soloFechaLegible(desde) : 'sin inicio'} a ${hasta ? soloFechaLegible(hasta) : 'sin fin'}`
    : null;

  return (
    <>
      <EncabezadoPagina titulo={tecnico ? `Tareas de ${tecnico.nombre}` : 'Tareas del técnico'} />
      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          {periodo && <p className="text-body-secondary">{periodo}</p>}
          <TablaDatos
            filas={tareas}
            claveFila={(tarea) => `${tarea.idOt}-${tarea.idTarea}`}
            columnas={columnas}
            buscarPor={['descripcion', 'idOt', 'idTarea']}
            placeholderBusqueda="Buscar por tarea u orden"
            cargando={cargando}
            textoVacio={
              desde || hasta
                ? 'Este técnico no tiene tareas en el período seleccionado.'
                : 'Este técnico no tiene tareas asignadas.'
            }
          />
        </CCardBody>
      </CCard>

      <div className="mt-2 mb-4">
        <BotonEnlace href={volverALista(desde, hasta)} color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver a carga de trabajo
        </BotonEnlace>
      </div>
    </>
  );
}
