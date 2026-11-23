'use client';

/**
 * /planes-mantenimiento - listado de planes de mantenimiento preventivo (Sprint 5).
 */
import { useEffect, useState } from 'react';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription, cilPencil, cilTrash } from '@coreui/icons';

import Talon from '@/componentes/Talon.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import EtiquetaEstadoPlan from '@/componentes/planes/EtiquetaEstadoPlan.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarPlanes, darDeBajaPlan } from '@/servicios/planesMantenimiento.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';
import { useFiltroPersistente } from '@/utils/filtros.js';

export default function PantallaPlanesMantenimiento() {
  const { mostrarToast } = useToast();

  const [planes, setPlanes] = useState([]);
  const [tiposActivos, setTiposActivos] = useState([]);
  const [filtroTipo, setFiltroTipo] = useFiltroPersistente('tipo', '');
  const [filtroEstado, setFiltroEstado] = useFiltroPersistente('estado', 'activo');
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
      render: (plan) => <Talon numero={plan.id} />,
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
      clave: 'estado',
      encabezado: 'Estado',
      render: (plan) => <EtiquetaEstadoPlan activo={plan.activo} />,
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (plan) => (
        <CButtonGroup size="sm">
          <BotonEnlace
            href={`/planes-mantenimiento/${plan.id}`}
            variante="ghost"
            className="btn-icono"
            title={`Ver detalle de ${plan.nombre}`}
          >
            <CIcon icon={cilDescription} />
          </BotonEnlace>
          {plan.activo && (
            <>
              <BotonEnlace
                href={`/planes-mantenimiento/${plan.id}/editar`}
                variante="ghost"
                className="btn-icono"
                title={`Editar ${plan.nombre}`}
              >
                <CIcon icon={cilPencil} />
              </BotonEnlace>
              <CButton
                variant="ghost"
                color="danger"
                className="btn-icono"
                onClick={() => setADarDeBaja(plan)}
                title={`Dar de baja ${plan.nombre}`}
              >
                <CIcon icon={cilTrash} />
              </CButton>
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
            buscarPor={['nombre', 'descripcion']}
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
                ],
                textoTodos: 'Todos',
              },
            ]}
            alLimpiar={() => {
              setFiltroTipo('');
              setFiltroEstado('');
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
          El plan dejará de generar nuevas órdenes de trabajo automáticas y se cancelarán las órdenes
          abiertas que haya generado.
        </p>
      </DialogoEliminar>
    </>
  );
}
