'use client';

/**
 * /notificaciones - la lista completa de notificaciones. Es a donde lleva el
 * "Ver más" de la campana de arriba, y muestra lo mismo que ella según el rol:
 *   - Administrador: las alertas de stock minimo (HU-33). Cada material que
 *     esta por debajo de su minimo, con cuanto falta para llegar. La lista se
 *     calcula del stock: un remito que lo sube hace que deje de aparecer.
 *   - Técnico: sus tareas pendientes (HU-21) como mensajes, la última asignada
 *     primero, cada una con el botón que lleva a la tarea.
 */
import { useEffect, useState } from 'react';
import { CCard, CCardBody, CListGroup, CListGroupItem, CSpinner } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilDescription } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import { useSesion } from '@/componentes/layout/ContextoSesion.js';
import { listarAlertasStock } from '@/servicios/inventario.js';
import { listarNotificaciones } from '@/servicios/notificaciones.js';

function AlertasDeStock() {
  const [alertas, setAlertas] = useState([]);
  const [categoria, setCategoria] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarAlertasStock()
      .then(setAlertas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const filasVisibles = alertas.filter((fila) => !categoria || fila.nombreTipo === categoria);

  const categorias = [...new Set(alertas.map((fila) => fila.nombreTipo).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es')
  );

  const columnas = [
    {
      clave: 'nombre',
      encabezado: 'Material',
      render: (fila) => (
        <>
          <div className="fw-semibold">{fila.nombre}</div>
          <div className="small text-body-secondary">{fila.codigo}</div>
        </>
      ),
    },
    {
      clave: 'nombreTipo',
      encabezado: 'Categoría',
      render: (fila) => <span className="text-body-secondary">{fila.nombreTipo || '-'}</span>,
    },
    { clave: 'stockActual', encabezado: 'Stock actual', render: (fila) => fila.stockActual },
    { clave: 'stockMinimo', encabezado: 'Stock mínimo', render: (fila) => fila.stockMinimo },
    { clave: 'faltante', encabezado: 'Falta', render: (fila) => <span className="fw-semibold">{fila.faltante}</span> },
    {
      clave: 'acciones',
      encabezado: 'Acciones',
      alinearDerecha: true,
      render: (fila) => (
        <BotonEnlace
          href={`/inventario/materiales/${encodeURIComponent(fila.codigo)}`}
          variante="ghost"
          className="btn-icono"
          title="Ver la ficha del material"
        >
          <CIcon icon={cilDescription} />
        </BotonEnlace>
      ),
    },
  ];

  return (
    <>
      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filasVisibles}
            claveFila={(fila) => fila.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre', 'nombreTipo']}
            placeholderBusqueda="Buscar por código, nombre o categoría"
            filtros={
              categorias.length > 1
                ? [
                    {
                      etiqueta: 'Categoría',
                      valor: categoria,
                      alCambiar: setCategoria,
                      opciones: categorias.map((texto) => ({ valor: texto, texto })),
                    },
                  ]
                : []
            }
            alLimpiar={() => setCategoria('')}
            cargando={cargando}
            textoVacio="No hay notificaciones: ningún material está por debajo de su stock mínimo."
          />
        </CCardBody>
      </CCard>
    </>
  );
}

/** Cada tarea pendiente como un mensaje, con el botón para ir a ella. El texto lo arma la API. */
function MensajesDelTecnico() {
  const [notificaciones, setNotificaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    listarNotificaciones()
      .then((respuesta) => setNotificaciones(respuesta.notificaciones))
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <div className="py-4 text-center">
        <CSpinner size="sm" />
      </div>
    );
  }

  return (
    <>
      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        {notificaciones.length === 0 ? (
          <CCardBody className="text-body-secondary">No tenés tareas pendientes.</CCardBody>
        ) : (
          <CListGroup flush>
            {notificaciones.map((notificacion) => (
              <CListGroupItem
                key={notificacion.clave}
                className="d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-2 py-3"
              >
                <div>
                  <div className="fw-semibold">{notificacion.titulo}</div>
                  <div className="text-body-secondary">{notificacion.detalle}</div>
                </div>
                <BotonEnlace href={notificacion.enlace} variante="outline" tamano="sm" className="text-nowrap align-self-start align-self-sm-center">
                  Ver tarea
                </BotonEnlace>
              </CListGroupItem>
            ))}
          </CListGroup>
        )}
      </CCard>
    </>
  );
}

export default function PantallaNotificaciones() {
  const { usuario } = useSesion();

  return (
    <>
      <EncabezadoPagina titulo="Notificaciones" />
      {/* Hasta saber el rol no se pide nada: si no, al técnico le saldría el error de la lista de stock. */}
      {usuario?.rol === 'administrador' && <AlertasDeStock />}
      {usuario?.rol === 'tecnico' && <MensajesDelTecnico />}
    </>
  );
}
