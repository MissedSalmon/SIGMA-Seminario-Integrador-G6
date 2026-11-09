'use client';

/**
 * Tiempos promedio de resolución (Sprint 7). Va en el panel del administrador,
 * debajo de las áreas con mayor incidencia.
 *
 * Muestra cuánto se tarda, en promedio, desde que se registra un ticket hasta
 * que se cierra:
 * - arriba, el promedio general del período y cuántos tickets cerrados entran;
 * - abajo, el mismo promedio desglosado por área, por tipo de activo o por
 *   técnico (se elige con los botones de arriba a la derecha), de mayor a
 *   menor tiempo. Las filas "Sin área" y "Sin asignar" van al final.
 *
 * El período es sobre la fecha de cierre y los dos días elegidos entran.
 * Sólo cuentan los tickets cerrados: los que siguen abiertos no se promedian.
 *
 * Las reglas del cálculo están en la migración 20261109120000 y en
 * backend/src/servicios/estadisticas.servicio.js.
 */
import { useEffect, useMemo, useState } from 'react';
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CFormInput,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilAvTimer, cilSearch, cilX } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';
import { obtenerTiemposResolucion } from '@/servicios/estadisticas.js';
import { finDelDia, hoyTexto, inicioDelDia, soloFechaLegible } from '@/utils/fechas.js';
import { horasConUnDecimal, textoTiempo } from '@/utils/duracion.js';

/** Los desgloses: el botón, la columna y de dónde salen las filas. */
const DESGLOSES = [
  { clave: 'porArea', boton: 'Área', columna: 'Área', buscar: 'Buscar por área o edificio' },
  { clave: 'porTipoActivo', boton: 'Activo', columna: 'Activo', buscar: 'Buscar por activo' },
  { clave: 'porTecnico', boton: 'Técnico', columna: 'Técnico', buscar: 'Buscar por técnico' },
];

function plural(cantidad, singular, varios) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}

function textoPeriodo(desde, hasta) {
  if (desde && hasta) return `${soloFechaLegible(desde)} al ${soloFechaLegible(hasta)}`;
  if (desde) return `Desde el ${soloFechaLegible(desde)}`;
  if (hasta) return `Hasta el ${soloFechaLegible(hasta)}`;
  return 'Todo el período';
}

export default function TiemposResolucion() {
  const [datos, setDatos] = useState(null);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [desglose, setDesglose] = useState(DESGLOSES[0].clave);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const hoy = hoyTexto();
  // El almanaque no deja dar vuelta el rango, pero los días también se pueden
  // tipear: el control de verdad es este.
  const periodoInvalido = Boolean(desde && hasta && desde > hasta);
  const hayFiltros = Boolean(desde || hasta);

  useEffect(() => {
    if (periodoInvalido) return undefined;
    // Mientras llega lo nuevo queda a la vista lo anterior: no se vuelve a "Cargando".
    let vigente = true;

    obtenerTiemposResolucion({ desde: inicioDelDia(desde), hasta: finDelDia(hasta) })
      .then((respuesta) => {
        if (!vigente) return;
        setDatos(respuesta);
        setError('');
      })
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [desde, hasta, periodoInvalido]);

  const elegido = DESGLOSES.find((uno) => uno.clave === desglose);

  const filas = useMemo(() => {
    const todas = datos?.[desglose] ?? [];
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return todas;
    return todas.filter((fila) => `${fila.nombre} ${fila.edificio ?? ''}`.toLowerCase().includes(texto));
  }, [datos, desglose, busqueda]);

  const cantidad = datos?.general?.cantidadTickets ?? 0;

  return (
    <CCard className="mt-4">
      <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <CIcon icon={cilAvTimer} />
          <span>Tiempos de resolución</span>
        </div>
        <CButtonGroup size="sm" role="group" aria-label="Desglosar el promedio por">
          {DESGLOSES.map((uno) => (
            <CButton
              key={uno.clave}
              color="secondary"
              variant={desglose === uno.clave ? undefined : 'outline'}
              onClick={() => setDesglose(uno.clave)}
              aria-pressed={desglose === uno.clave}
            >
              {uno.boton}
            </CButton>
          ))}
        </CButtonGroup>
      </CCardHeader>

      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />
        {periodoInvalido && (
          <Aviso mensaje='La fecha "Desde" no puede ser posterior a la fecha "Hasta".' color="warning" />
        )}

        {/* Buscador y filtros en una sola línea, como en los listados. */}
        <div className="sigma-tabla-toolbar">
          <div className="sigma-tabla-controles">
            <div className="sigma-tabla-buscador">
              <CIcon icon={cilSearch} size="sm" />
              <CFormInput
                size="sm"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder={elegido.buscar}
                aria-label={elegido.buscar}
              />
            </div>
            <span className="sigma-tabla-filtros-titulo">Filtrar por:</span>
            <CampoFecha
              compacto
              id="resolucion-desde"
              etiqueta="Desde"
              valor={desde}
              alCambiar={setDesde}
              maximo={hasta || hoy}
            />
            <CampoFecha
              compacto
              id="resolucion-hasta"
              etiqueta="Hasta"
              valor={hasta}
              alCambiar={setHasta}
              minimo={desde}
              maximo={hoy}
            />
            {hayFiltros && (
              <CButton
                color="secondary"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDesde('');
                  setHasta('');
                }}
                title="Quitar todos los filtros"
              >
                <CIcon icon={cilX} size="sm" className="me-1" />
                Limpiar
              </CButton>
            )}
          </div>
        </div>

        {periodoInvalido ? null : cargando && !datos ? (
          <Cargando />
        ) : cantidad === 0 ? (
          <SinDatos
            texto={
              hayFiltros
                ? 'No hay tickets cerrados en el período elegido.'
                : 'Todavía no hay tickets cerrados.'
            }
          />
        ) : (
          <>
            <div className="sigma-viz-cifras">
              <div className="sigma-viz-cifra">
                <div className="sigma-viz-cifra-etiqueta">Tiempo promedio de resolución</div>
                <div className="sigma-viz-cifra-valor">{textoTiempo(datos.general.promedioSegundos)}</div>
                <div className="sigma-viz-cifra-detalle">{horasConUnDecimal(datos.general.promedioSegundos)}</div>
              </div>
              <div className="sigma-viz-cifra">
                <div className="sigma-viz-cifra-etiqueta">Tickets cerrados</div>
                <div className="sigma-viz-cifra-valor">{cantidad}</div>
              </div>
              <div className="sigma-viz-cifra">
                <div className="sigma-viz-cifra-etiqueta">Período (fecha de cierre)</div>
                <div className="sigma-viz-cifra-texto">{textoPeriodo(desde, hasta)}</div>
              </div>
            </div>

            <h3 className="sigma-viz-titulo">Promedio por {elegido.columna.toLowerCase()}</h3>

            {filas.length === 0 ? (
              <SinDatos texto="No se encontró ninguna fila para la búsqueda." />
            ) : (
              <TablaPromedios columna={elegido.columna} filas={filas} />
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  );
}

/** Una fila por área, tipo de activo o técnico: nombre, promedio y tickets. */
function TablaPromedios({ columna, filas }) {
  return (
    <CTable hover responsive align="middle" className="mb-0">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>{columna}</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Promedio</CTableHeaderCell>
          <CTableHeaderCell className="text-end d-none d-sm-table-cell">En horas</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Tickets cerrados</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {filas.map((fila) => (
          <CTableRow key={fila.id ?? 'sin-dato'}>
            <CTableDataCell>
              <div className={fila.id === null ? 'fst-italic' : 'fw-semibold'}>{fila.nombre}</div>
              {fila.edificio && <div className="text-body-secondary small">{fila.edificio}</div>}
            </CTableDataCell>
            <CTableDataCell
              className="text-end text-nowrap fw-semibold"
              title={horasConUnDecimal(fila.promedioSegundos)}
            >
              {textoTiempo(fila.promedioSegundos)}
            </CTableDataCell>
            <CTableDataCell className="text-end text-nowrap text-body-secondary d-none d-sm-table-cell">
              {horasConUnDecimal(fila.promedioSegundos)}
            </CTableDataCell>
            <CTableDataCell className="text-end" aria-label={plural(fila.cantidadTickets, 'ticket', 'tickets')}>
              {fila.cantidadTickets}
            </CTableDataCell>
          </CTableRow>
        ))}
      </CTableBody>
    </CTable>
  );
}
