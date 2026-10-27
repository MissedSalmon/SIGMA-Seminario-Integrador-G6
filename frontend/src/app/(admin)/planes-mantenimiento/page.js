'use client';

/**
 * /planes-mantenimiento - listado de planes de mantenimiento preventivo (Sprint 5).
 */
import { useEffect, useState } from 'react';
import { CBadge, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription, cilPencil, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarPlanes, darDeBajaPlan } from '@/servicios/planesMantenimiento.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';

function soloFechaLegible(iso) {
  if (!iso) return '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '-';
}

export default function PantallaPlanesMantenimiento() {
  const { mostrarToast } = useToast();

  const [planes, setPlanes] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [aDarDeBaja, setADarDeBaja] = useState(null);
  const [dandoDeBaja, setDandoDeBaja] = useState(false);
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    listarTiposActivos()
      .then(setTiposActivos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  useEffect(() => {
    let vigente = true;
    setCargando(true);

    listarPlanes({
      tipoActivoId: filtroTipo || null,
      estado: filtroEstado || 'todos',
    })
      .then((filas) => {
        if (vigente) {
          setPlanes(filas);
          setError('');
        }
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, [filtroTipo, filtroEstado, recarga]);

  async function confirmarBaja() {
    if (!aDarDeBaja) return;
    setDandoDeBaja(true);
    setError('');

    try {
      await darDeBajaPlan(aDarDeBaja.id);
      mostrarToast({
        tipo: 'exito',
        mensaje: `El plan "${aDarDeBaja.nombre}" fue dado de baja correctamente.`,
      });
      setADarDeBaja(null);
      setRecarga((n) => n + 1);
    } catch (fallo) {
      setError(fallo.message);
      setADarDeBaja(null);
    } finally {
      setDandoDeBaja(false);
    }
  }

  const columnas = [
    {
      clave: 'id',
      encabezado: '#',
      render: (plan) => <span className="fw-semibold">{plan.id}</span>,
    },
    {
      clave: 'nombre',
      encabezado: 'Nombre',
      render: (plan) => (
        <div>
          <div className="fw-semibold">{plan.nombre}</div>
          {plan.descripcion && (
            <div className="text-body-secondary small text-truncate" style={{ maxWidth: '280px' }}>
              {plan.descripcion}
            </div>
          )}
        </div>
      ),
    },
    {
      clave: 'tipoActivo',
      encabezado: 'Activo',
      render: (plan) => plan.tipoActivo?.nombre ?? '-',
    },
    {
      clave: 'frecuencia',
      encabezado: 'Frecuencia',
      render: (plan) => <span className="text-body-secondary">{plan.frecuencia}</span>,
    },
    {
      clave: 'proximaGeneracion',
      encabezado: 'Próxima ejecución',
      render: (plan) => (
        <span className={plan.activo ? 'fw-semibold' : 'text-body-tertiary'}>
          {soloFechaLegible(plan.fechaProximaGeneracion)}
        </span>
      ),
    },
    {
      clave: 'tareas',
      encabezado: 'Tareas',
      render: (plan) => (
        <span className="text-body-secondary">
          {plan.cantidadTareas} {plan.cantidadTareas === 1 ? 'tarea' : 'tareas'}
        </span>
      ),
    },
    {
      clave: 'tecnicos',
      encabezado: 'Técnicos',
      render: (plan) =>
        plan.tieneTecnico ? (
          <span className="text-body-secondary">
            {plan.tecnicos.map((t) => t.nombre).join(', ')}
          </span>
        ) : (
          <CBadge color="warning" className="text-dark">
            Sin asignar
          </CBadge>
        ),
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (plan) =>
        plan.activo ? (
          <CBadge color="success">Activo</CBadge>
        ) : (
          <CBadge color="secondary">Dado de baja</CBadge>
        ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (plan) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/planes-mantenimiento/${plan.id}`}
            variante="ghost"
            className="btn-icono"
            title="Ver detalle del plan"
          >
            <CIcon icon={cilDescription} />
          </BotonEnlace>
          {plan.activo && (
            <>
              <BotonEnlace
                href={`/planes-mantenimiento/${plan.id}/editar`}
                variante="ghost"
                className="btn-icono"
                title="Editar plan"
              >
                <CIcon icon={cilPencil} />
              </BotonEnlace>
              <BotonEnlace
                onClick={() => setADarDeBaja(plan)}
                variante="ghost"
                className="btn-icono text-danger"
                title="Dar de baja plan"
              >
                <CIcon icon={cilTrash} />
              </BotonEnlace>
            </>
          )}
        </CButtonGroup>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina
        titulo="Planes de mantenimiento"
        accion={{ direccion: '/planes-mantenimiento/agregar' }}
      />

      {error && <Aviso color="danger" className="mb-4">{error}</Aviso>}

      <CCard className="mb-4">
        <CCardBody>
          <TablaDatos
            filas={planes}
            claveFila={(plan) => plan.id}
            columnas={columnas}
            buscarPor={['nombre', 'descripcion', 'tipoMantenimiento']}
            placeholderBusqueda="Buscar plan..."
            filtros={[
              {
                etiqueta: 'Activo',
                valor: filtroTipo,
                alCambiar: setFiltroTipo,
                opciones: tiposActivos.map((t) => ({
                  valor: String(t.idTipoActivo),
                  texto: t.nombre,
                })),
                textoTodos: 'Todos',
              },
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: [
                  { valor: 'activo', texto: 'Activos' },
                  { valor: 'baja', texto: 'Dados de baja' },
                  { valor: 'todos', texto: 'Todos' },
                ],
                textoTodos: 'Todos',
              },
            ]}
            alLimpiar={() => {
              setFiltroTipo('');
              setFiltroEstado('activo');
            }}
            cargando={cargando}
            textoVacio="No se encontraron planes de mantenimiento preventivo."
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aDarDeBaja)}
        titulo="Dar de baja plan de mantenimiento"
        texto="Dar de baja"
        textoProcesando="Dando de baja..."
        eliminando={dandoDeBaja}
        onConfirmar={confirmarBaja}
        onCancelar={() => setADarDeBaja(null)}
      >
        <p>
          ¿Estás seguro de que querés dar de baja el plan{' '}
          <strong>{aDarDeBaja?.nombre}</strong>?
        </p>
        <p className="text-body-secondary small mb-0">
          El plan dejará de generar nuevas órdenes de trabajo automáticas. Las órdenes de
          trabajo ya generadas previamente no se verán afectadas.
        </p>
      </DialogoEliminar>
    </>
  );
}
