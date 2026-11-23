'use client';

/**
 * /notificaciones - la lista completa de notificaciones. Es a donde lleva el
 * "Ver más" de la campana de arriba, y muestra lo mismo que ella según el rol:
 *   - Administrador: tickets nuevos, OT finalizadas en la última semana y
 *     materiales por debajo de su stock mínimo (HU-33).
 *   - Técnico: sus tareas pendientes (HU-21) y las que tiene que hacer hoy.
 *   - Solicitante: sus tickets validados, rechazados o resueltos en la última
 *     semana.
 *
 * Es una sola tabla, de la más reciente a la más vieja (23/11/2026). Cada una
 * dice si está leída o no; se puede marcar como leída o no leída y eliminar.
 * Al abrir una con "Ver", queda leída. Una eliminada no vuelve a aparecer
 * mientras siga vigente (ver estadoNotificaciones.servicio.js en el backend).
 *
 * Las sin leer van con el título en negrita y la columna Estado lo dice en
 * texto: no se usa un color para eso.
 */
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CButtonGroup, CCard, CCardBody } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilCheckAlt, cilDescription, cilEnvelopeClosed, cilTrash } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoEliminar from '@/componentes/DialogoEliminar.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import {
  EVENTO_CAMBIO,
  eliminarNotificacion,
  listarNotificaciones,
  marcarNotificacionLeida,
  marcarTodasLeidas,
} from '@/servicios/notificaciones.js';
import { formatearFechaHora } from '@/utils/fechas.js';
import { useEstadoGuardado } from '@/utils/estadoGuardado.js';
import { enlaceDesdeNotificaciones } from '@/utils/volverA.js';

const ESTADOS = [
  { valor: 'no-leidas', texto: 'No leídas' },
  { valor: 'leidas', texto: 'Leídas' },
];

export default function PantallaNotificaciones() {
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useEstadoGuardado('filtroEstado', '');
  const [filtroCategoria, setFiltroCategoria] = useEstadoGuardado('filtroCategoria', '');

  // La que se está por eliminar. null = no hay diálogo abierto.
  const [aEliminar, setAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const cargar = useCallback(() => {
    listarNotificaciones()
      .then((respuesta) => setNotificaciones(respuesta.notificaciones))
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    cargar();
    // Si se lee algo desde la campana, la tabla se pone al día.
    window.addEventListener(EVENTO_CAMBIO, cargar);
    return () => window.removeEventListener(EVENTO_CAMBIO, cargar);
  }, [cargar]);

  async function cambiarLeida(notificacion, leida) {
    try {
      await marcarNotificacionLeida(notificacion.clave, leida);
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  function abrir(notificacion) {
    if (!notificacion.leida) marcarNotificacionLeida(notificacion.clave).catch(() => {});
    router.push(enlaceDesdeNotificaciones(notificacion.enlace));
  }

  async function leerTodas() {
    try {
      await marcarTodasLeidas();
    } catch (fallo) {
      setError(fallo.message);
    }
  }

  async function confirmarEliminacion() {
    setEliminando(true);
    try {
      await eliminarNotificacion(aEliminar.clave);
      mostrarToast({ tipo: 'exito', mensaje: 'Notificación eliminada.' });
      setAEliminar(null);
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setEliminando(false);
    }
  }

  const categorias = [...new Set(notificaciones.map((fila) => fila.tipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  // La API ya las da de la más reciente a la más vieja: filtrar no cambia el orden.
  const filasVisibles = notificaciones.filter(
    (fila) =>
      (!filtroEstado || (filtroEstado === 'leidas' ? fila.leida : !fila.leida)) &&
      (!filtroCategoria || fila.tipo === filtroCategoria)
  );

  const hayNoLeidas = notificaciones.some((fila) => !fila.leida);

  const filtros = [
    { etiqueta: 'Estado', valor: filtroEstado, alCambiar: setFiltroEstado, opciones: ESTADOS },
  ];
  if (categorias.length > 1) {
    filtros.push({
      etiqueta: 'Categoría',
      valor: filtroCategoria,
      alCambiar: setFiltroCategoria,
      opciones: categorias.map((texto) => ({ valor: texto, texto })),
      textoTodos: 'Todas',
    });
  }

  const columnas = [
    {
      clave: 'titulo',
      encabezado: 'Notificación',
      render: (fila) => (
        <>
          <div className={fila.leida ? '' : 'fw-semibold'}>{fila.titulo}</div>
          <div className="small text-body-secondary">{fila.detalle}</div>
          {/* En pantallas chicas la fecha y el estado van acá, debajo del texto. */}
          <div className="small text-body-secondary d-md-none mt-1">
            {formatearFechaHora(fila.fecha)} · {fila.leida ? 'Leída' : 'No leída'}
          </div>
        </>
      ),
    },
    {
      clave: 'tipo',
      encabezado: 'Categoría',
      ocultarDebajoDe: 'lg',
      render: (fila) => <span className="text-body-secondary text-nowrap">{fila.tipo}</span>,
    },
    {
      clave: 'fecha',
      encabezado: 'Fecha',
      ocultarDebajoDe: 'md',
      render: (fila) => <span className="text-nowrap">{formatearFechaHora(fila.fecha)}</span>,
    },
    {
      clave: 'leida',
      encabezado: 'Estado',
      ocultarDebajoDe: 'md',
      render: (fila) => (
        <span className={`text-nowrap ${fila.leida ? 'text-body-secondary' : 'fw-semibold'}`}>
          {fila.leida ? 'Leída' : 'No leída'}
        </span>
      ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <CButtonGroup size="sm">
          <CButton
            variant="ghost"
            color="primary"
            className="btn-icono"
            onClick={() => abrir(fila)}
            title={fila.accion || 'Ver'}
          >
            <CIcon icon={cilDescription} />
          </CButton>
          <CButton
            variant="ghost"
            color="primary"
            className="btn-icono"
            onClick={() => cambiarLeida(fila, !fila.leida)}
            title={fila.leida ? 'Marcar como no leída' : 'Marcar como leída'}
          >
            <CIcon icon={fila.leida ? cilEnvelopeClosed : cilCheckAlt} />
          </CButton>
          <CButton
            variant="ghost"
            color="danger"
            className="btn-icono"
            onClick={() => setAEliminar(fila)}
            title="Eliminar la notificación"
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
        titulo="Notificaciones"
        accionesExtra={
          <CButton color="primary" variant="outline" onClick={leerTodas} disabled={!hayNoLeidas}>
            <CIcon icon={cilCheckAlt} className="me-2" />
            Marcar todas como leídas
          </CButton>
        }
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.clave}
            columnas={columnas}
            buscarPor={['titulo', 'detalle', 'tipo']}
            placeholderBusqueda="Buscar notificación"
            filtros={filtros}
            alLimpiar={() => {
              setFiltroEstado('');
              setFiltroCategoria('');
            }}
            cargando={cargando}
            textoVacio="No tenés notificaciones."
          />
        </CCardBody>
      </CCard>

      <DialogoEliminar
        visible={Boolean(aEliminar)}
        titulo="Eliminar la notificación"
        eliminando={eliminando}
        onConfirmar={confirmarEliminacion}
        onCancelar={() => setAEliminar(null)}
      >
        <p className="mb-0">
          Se va a eliminar la notificación <strong>{aEliminar?.titulo}</strong>.
        </p>
      </DialogoEliminar>
    </>
  );
}
