'use client';

/**
 * Áreas con mayor incidencia (HU-34, issue #29). Va en el panel del administrador.
 *
 * Se muestra como estadística:
 * - arriba, los números clave del período (fallas, tickets, áreas afectadas y
 *   el área con más fallas);
 * - un gráfico de barras con el ranking de áreas, de mayor a menor. Cada barra
 *   se divide por tipo de falla, y la referencia de colores dice qué es cada uno;
 * - al costado, cuántas fallas hubo de cada tipo en total;
 * - la misma información se puede ver como tabla.
 *
 * Al hacer clic en un área se abre la lista de fallas que la componen, con el
 * ticket (o el plan preventivo) de donde salió cada una.
 *
 * Cada tipo de falla tiene siempre el mismo color: sale de su lugar en el
 * catálogo, no de su posición en el ranking. Así un filtro no cambia los colores.
 *
 * Las reglas del cálculo están en backend/src/servicios/estadisticas.servicio.js.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormInput,
  CModal,
  CModalBody,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilChartPie, cilDescription, cilSearch, cilX } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import { Cargando, SinDatos } from '@/componentes/EstadoTabla.js';
import CampoLista from '@/componentes/formulario/CampoLista.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { listarAreasConMayorIncidencia } from '@/servicios/estadisticas.js';
import { listarTiposFalla } from '@/servicios/ordenesTrabajo.js';

/** Los períodos del filtro, en meses hacia atrás desde hoy. */
const PERIODOS = [
  { valor: '1', texto: 'Último mes' },
  { valor: '3', texto: 'Últimos 3 meses' },
  { valor: '6', texto: 'Último semestre' },
  { valor: '12', texto: 'Último año' },
];

/**
 * Colores de los tipos de falla, en el orden del catálogo. Es una paleta
 * pensada para que se distingan también con daltonismo. Si el catálogo pasa
 * de 8 tipos, los siguientes van en gris (no se inventan colores nuevos).
 */
const COLORES = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'];
const COLOR_RESTO = '#8a8984';


/** El comienzo del período: hoy a las 0 h, menos esa cantidad de meses. */
function desdeDelPeriodo(meses) {
  if (!meses) return null;
  const fecha = new Date();
  fecha.setHours(0, 0, 0, 0);
  fecha.setMonth(fecha.getMonth() - Number(meses));
  return fecha.toISOString();
}

function fechaLegible(iso) {
  if (!iso) return '-';
  const [anio, mes, dia] = String(iso).slice(0, 10).split('-');
  return dia && mes && anio ? `${dia}/${mes}/${anio}` : '-';
}

function plural(cantidad, singular, varios) {
  return `${cantidad} ${cantidad === 1 ? singular : varios}`;
}

/** "62,5 %" */
function textoPorcentaje(valor) {
  return `${Number(valor ?? 0).toLocaleString('es-AR', { maximumFractionDigits: 1 })} %`;
}

/** Con un decimal, como el de las áreas. */
function porcentaje(parte, total) {
  return total ? Math.round((parte / total) * 1000) / 10 : 0;
}

export default function RankingAreasIncidencia() {
  const [areas, setAreas] = useState([]);
  const [tiposFalla, setTiposFalla] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroPeriodo, setFiltroPeriodo] = useState('');
  const [filtroFalla, setFiltroFalla] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [vista, setVista] = useState('grafico');
  const [areaAbierta, setAreaAbierta] = useState(null);

  useEffect(() => {
    listarTiposFalla()
      .then(setTiposFalla)
      .catch((fallo) => setError(fallo.message));
  }, []);

  useEffect(() => {
    let vigente = true;

    listarAreasConMayorIncidencia({
      desde: desdeDelPeriodo(filtroPeriodo),
      tipoFalla: filtroFalla || null,
    })
      .then((filas) => {
        if (!vigente) return;
        setAreas(filas);
        setError('');
      })
      .catch((fallo) => vigente && setError(fallo.message))
      .finally(() => vigente && setCargando(false));

    return () => {
      vigente = false;
    };
  }, [filtroPeriodo, filtroFalla]);

  /** El color de cada tipo, según su lugar en el catálogo. */
  const colorDe = useMemo(() => {
    const colores = new Map(tiposFalla.map((tipo, indice) => [tipo, COLORES[indice] ?? COLOR_RESTO]));
    return (tipo) => colores.get(tipo) ?? COLOR_RESTO;
  }, [tiposFalla]);

  const areasVisibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return areas;
    return areas.filter((area) =>
      `${area.nombreArea} ${area.nombreEdificio}`.toLowerCase().includes(texto)
    );
  }, [areas, busqueda]);

  // Los totales salen de las fallas, no de sumar las áreas: si dos áreas
  // comparten un espacio, la misma falla está en las dos.
  const resumen = useMemo(() => {
    const fallas = new Map();
    const tickets = new Set();
    for (const area of areasVisibles) {
      for (const incidencia of area.incidencias) {
        fallas.set(incidencia.idFalla, incidencia.tipo);
        if (incidencia.ticket) tickets.add(incidencia.ticket.id);
      }
    }

    const porTipo = new Map();
    for (const tipo of fallas.values()) porTipo.set(tipo, (porTipo.get(tipo) ?? 0) + 1);

    return {
      fallas: fallas.size,
      tickets: tickets.size,
      areasConArea: areasVisibles.filter((area) => area.idArea !== null).length,
      primera: areasVisibles.find((area) => area.idArea !== null) ?? null,
      porTipo: [...porTipo.entries()]
        .map(([tipo, cantidad]) => ({ tipo, cantidad }))
        // De la que más fallas tiene a la que menos; si empatan, por nombre.
        // El color de cada tipo no cambia: sale del catálogo, no de este orden.
        .sort((a, b) => b.cantidad - a.cantidad || a.tipo.localeCompare(b.tipo, 'es')),
    };
  }, [areasVisibles]);

  const maximo = Math.max(1, ...areasVisibles.map((area) => area.cantidadFallas));
  const hayFiltros = Boolean(filtroPeriodo || filtroFalla);

  return (
    <CCard className="mt-4">
      <CCardHeader className="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div className="d-flex align-items-center gap-2 fw-semibold">
          <CIcon icon={cilChartPie} />
          <span>Áreas con mayor incidencia</span>
        </div>
        <CButtonGroup size="sm" role="group" aria-label="Cómo ver la estadística">
          <CButton
            color="secondary"
            variant={vista === 'grafico' ? undefined : 'outline'}
            onClick={() => setVista('grafico')}
          >
            Gráfico
          </CButton>
          <CButton
            color="secondary"
            variant={vista === 'tabla' ? undefined : 'outline'}
            onClick={() => setVista('tabla')}
          >
            Tabla
          </CButton>
        </CButtonGroup>
      </CCardHeader>

      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        {/* Buscador y filtros en una sola línea, como en los listados. */}
        <div className="sigma-tabla-toolbar">
          <div className="sigma-tabla-controles">
            <div className="sigma-tabla-buscador">
              <CIcon icon={cilSearch} size="sm" />
              <CFormInput
                size="sm"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar por área o edificio"
                aria-label="Buscar por área o edificio"
              />
            </div>
            <span className="sigma-tabla-filtros-titulo">Filtrar por:</span>
            <CampoLista
              compacto
              etiquetaOculta
              id="incidencia-periodo"
              etiqueta="Período"
              valor={filtroPeriodo}
              alCambiar={setFiltroPeriodo}
              opciones={PERIODOS}
              textoVacio="Todo el período"
              ancho={11}
            />
            <CampoLista
              compacto
              etiquetaOculta
              id="incidencia-falla"
              etiqueta="Falla"
              valor={filtroFalla}
              alCambiar={setFiltroFalla}
              opciones={tiposFalla.map((tipo) => ({ valor: tipo, texto: tipo }))}
              textoVacio="Todas"
              ancho={9}
            />
            {hayFiltros && (
              <CButton
                color="secondary"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFiltroPeriodo('');
                  setFiltroFalla('');
                }}
                title="Quitar todos los filtros"
              >
                <CIcon icon={cilX} size="sm" className="me-1" />
                Limpiar
              </CButton>
            )}
          </div>
        </div>

        {cargando ? (
          <Cargando />
        ) : areasVisibles.length === 0 ? (
          <SinDatos
            texto={
              busqueda.trim()
                ? 'No se encontró ningún área para la búsqueda.'
                : hayFiltros
                  ? 'No hay fallas registradas que cumplan con esos filtros.'
                  : 'Todavía no hay fallas registradas en las tareas.'
            }
          />
        ) : (
          <>
            <NumerosClave resumen={resumen} />

            {vista === 'grafico' ? (
              <CRow className="g-4">
                <CCol lg={8}>
                  <h3 className="sigma-viz-titulo">Fallas por área</h3>
                  <Referencia tipos={resumen.porTipo.map((uno) => uno.tipo)} colorDe={colorDe} />
                  <GraficoAreas
                    areas={areasVisibles}
                    maximo={maximo}
                    colorDe={colorDe}
                    alAbrir={setAreaAbierta}
                  />
                </CCol>
                <CCol lg={4}>
                  <h3 className="sigma-viz-titulo">Fallas por tipo</h3>
                  <DesglosePorTipo porTipo={resumen.porTipo} total={resumen.fallas} colorDe={colorDe} />
                </CCol>
              </CRow>
            ) : (
              <TablaAreas areas={areasVisibles} alAbrir={setAreaAbierta} />
            )}
          </>
        )}
      </CCardBody>

      <DetalleArea area={areaAbierta} onCerrar={() => setAreaAbierta(null)} />
    </CCard>
  );
}

/** Las cuatro cifras de arriba. */
function NumerosClave({ resumen }) {
  const cifras = [
    { etiqueta: 'Fallas registradas', valor: resumen.fallas },
    { etiqueta: 'Tickets con fallas', valor: resumen.tickets },
    { etiqueta: 'Áreas afectadas', valor: resumen.areasConArea },
    {
      etiqueta: 'Área con más fallas',
      valor: resumen.primera?.nombreArea ?? '-',
      detalle: resumen.primera ? plural(resumen.primera.cantidadFallas, 'falla', 'fallas') : null,
      texto: true,
    },
  ];

  return (
    <div className="sigma-viz-cifras">
      {cifras.map((cifra) => (
        <div key={cifra.etiqueta} className="sigma-viz-cifra">
          <div className="sigma-viz-cifra-etiqueta">{cifra.etiqueta}</div>
          <div className={cifra.texto ? 'sigma-viz-cifra-texto' : 'sigma-viz-cifra-valor'}>
            {cifra.valor}
          </div>
          {cifra.detalle && <div className="sigma-viz-cifra-detalle">{cifra.detalle}</div>}
        </div>
      ))}
    </div>
  );
}

/** Qué significa cada color. */
function Referencia({ tipos, colorDe }) {
  return (
    <ul className="sigma-viz-referencia" aria-label="Referencia de colores">
      {tipos.map((tipo) => (
        <li key={tipo}>
          <span className="sigma-viz-muestra" style={{ backgroundColor: colorDe(tipo) }} aria-hidden="true" />
          {tipo}
        </li>
      ))}
    </ul>
  );
}

/** El ranking como barras horizontales, divididas por tipo de falla. */
function GraficoAreas({ areas, maximo, colorDe, alAbrir }) {
  return (
    <ol className="sigma-viz-barras">
      {areas.map((area) => {
        const descripcion = `${area.nombreArea}: ${plural(area.cantidadFallas, 'falla', 'fallas')} en ${plural(
          area.cantidadTickets,
          'ticket',
          'tickets'
        )}. ${area.desglose.map((uno) => `${uno.tipo} ${uno.cantidad}`).join(', ')}.`;

        return (
          <li key={area.idArea ?? 'sin-area'}>
            <button
              type="button"
              className="sigma-viz-fila"
              onClick={() => alAbrir(area)}
              aria-label={`${descripcion} Ver los tickets del área.`}
            >
              <span className="sigma-viz-fila-nombre">
                <span className="sigma-viz-fila-posicion">{area.posicion}</span>
                <span>
                  <span className="sigma-viz-fila-area">{area.nombreArea}</span>
                  {area.nombreEdificio && (
                    <span className="sigma-viz-fila-edificio">{area.nombreEdificio}</span>
                  )}
                </span>
              </span>

              <span className="sigma-viz-fila-barra">
                <span
                  className="sigma-viz-barra"
                  style={{ width: `${(area.cantidadFallas / maximo) * 100}%` }}
                >
                  {area.desglose.map((uno) => (
                    <span
                      key={uno.tipo}
                      className="sigma-viz-segmento"
                      style={{ flexGrow: uno.cantidad, backgroundColor: colorDe(uno.tipo) }}
                    />
                  ))}
                </span>
                <span className="sigma-viz-fila-valor">
                  <strong>{textoPorcentaje(area.porcentaje)}</strong>
                  <span className="sigma-viz-fila-tickets">
                    {plural(area.cantidadFallas, 'falla', 'fallas')} ·{' '}
                    {plural(area.cantidadTickets, 'ticket', 'tickets')}
                  </span>
                </span>
              </span>

              {/* Lo que se ve al pasar el mouse por la barra. */}
              <span className="sigma-viz-ayuda" role="presentation">
                <span className="sigma-viz-ayuda-titulo">
                  {area.nombreArea} · {textoPorcentaje(area.porcentaje)}
                </span>
                {area.desglose.map((uno) => (
                  <span key={uno.tipo} className="sigma-viz-ayuda-renglon">
                    <span className="sigma-viz-muestra" style={{ backgroundColor: colorDe(uno.tipo) }} />
                    <span>{uno.tipo}</span>
                    <strong>{uno.cantidad}</strong>
                  </span>
                ))}
                <span className="sigma-viz-ayuda-pie">Clic para ver los tickets</span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

/** Cuántas fallas hubo de cada tipo, entre todas las áreas. */
function DesglosePorTipo({ porTipo, total, colorDe }) {
  return (
    <>
      <div className="sigma-viz-segmentada" aria-hidden="true">
        {porTipo.map((uno) => (
          <span
            key={uno.tipo}
            className="sigma-viz-segmento"
            style={{ flexGrow: uno.cantidad, backgroundColor: colorDe(uno.tipo) }}
          />
        ))}
      </div>
      <ul className="sigma-viz-tipos">
        {porTipo.map((uno) => (
          <li key={uno.tipo}>
            <span className="sigma-viz-muestra" style={{ backgroundColor: colorDe(uno.tipo) }} aria-hidden="true" />
            <span className="sigma-viz-tipos-nombre">{uno.tipo}</span>
            <strong>{uno.cantidad}</strong>
            <span className="sigma-viz-tipos-porcentaje">{textoPorcentaje(porcentaje(uno.cantidad, total))}</span>
          </li>
        ))}
      </ul>
    </>
  );
}

/** La misma información, como tabla. */
function TablaAreas({ areas, alAbrir }) {
  return (
    <CTable hover responsive align="middle" className="mb-0">
      <CTableHead>
        <CTableRow>
          <CTableHeaderCell>#</CTableHeaderCell>
          <CTableHeaderCell>Área</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Fallas</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Porcentaje</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Tickets</CTableHeaderCell>
          <CTableHeaderCell className="d-none d-lg-table-cell">Desglose por falla</CTableHeaderCell>
          <CTableHeaderCell className="text-end">Acciones</CTableHeaderCell>
        </CTableRow>
      </CTableHead>
      <CTableBody>
        {areas.map((area) => {
          const desglose = area.desglose.map((uno) => `${uno.tipo} ${uno.cantidad}`).join(' · ');
          return (
            <CTableRow key={area.idArea ?? 'sin-area'}>
              <CTableDataCell className="fw-semibold">{area.posicion}</CTableDataCell>
              <CTableDataCell>
                <div className="fw-semibold">{area.nombreArea}</div>
                {area.nombreEdificio && <div className="text-body-secondary small">{area.nombreEdificio}</div>}
                <div className="text-body-secondary small d-lg-none">{desglose}</div>
              </CTableDataCell>
              <CTableDataCell className="text-end fw-semibold">{area.cantidadFallas}</CTableDataCell>
              <CTableDataCell className="text-end text-nowrap">{textoPorcentaje(area.porcentaje)}</CTableDataCell>
              <CTableDataCell className="text-end">{area.cantidadTickets}</CTableDataCell>
              <CTableDataCell className="d-none d-lg-table-cell text-body-secondary">{desglose}</CTableDataCell>
              <CTableDataCell className="text-end">
                <CButton
                  variant="ghost"
                  color="primary"
                  className="btn-icono"
                  onClick={() => alAbrir(area)}
                  title="Ver los tickets del área"
                  aria-label={`Ver los tickets de ${area.nombreArea}`}
                >
                  <CIcon icon={cilDescription} />
                </CButton>
              </CTableDataCell>
            </CTableRow>
          );
        })}
      </CTableBody>
    </CTable>
  );
}

/** Las fallas de un área, con el ticket o el plan de donde salió cada una. */
function DetalleArea({ area, onCerrar }) {
  return (
    <CModal visible={Boolean(area)} onClose={onCerrar} size="lg" alignment="center" scrollable>
      <CModalHeader>
        <CModalTitle>{area?.nombreArea}</CModalTitle>
      </CModalHeader>
      <CModalBody>
        {area && (
          <>
            <p className="text-body-secondary">
              {plural(area.cantidadFallas, 'falla', 'fallas')} en {plural(area.cantidadTickets, 'ticket', 'tickets')}.{' '}
              {area.desglose.map((uno) => `${uno.tipo} ${uno.cantidad}`).join(' · ')}.
            </p>

            <CTable hover responsive align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Origen</CTableHeaderCell>
                  <CTableHeaderCell>Fecha</CTableHeaderCell>
                  <CTableHeaderCell>Falla</CTableHeaderCell>
                  <CTableHeaderCell className="d-none d-md-table-cell">Activo</CTableHeaderCell>
                  <CTableHeaderCell>Estado</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {area.incidencias.map((incidencia) => (
                  <CTableRow key={incidencia.idFalla}>
                    <CTableDataCell className="text-nowrap">
                      {incidencia.ticket ? (
                        <Link href={`/tickets/${incidencia.ticket.id}`}>Ticket #{incidencia.ticket.id}</Link>
                      ) : (
                        <Link href={`/ordenes-trabajo/${incidencia.idOt}`}>
                          {incidencia.idPlan ? `Plan #${incidencia.idPlan}` : `OT #${incidencia.idOt}`}
                        </Link>
                      )}
                    </CTableDataCell>
                    <CTableDataCell className="text-nowrap">{fechaLegible(incidencia.fecha)}</CTableDataCell>
                    <CTableDataCell>
                      <div>{incidencia.tipo}</div>
                      <div className="text-body-secondary small">{incidencia.descripcion}</div>
                    </CTableDataCell>
                    <CTableDataCell className="d-none d-md-table-cell">
                      <div>{incidencia.codigoActivo}</div>
                      <div className="text-body-secondary small">{incidencia.nombreTipoActivo}</div>
                    </CTableDataCell>
                    <CTableDataCell>
                      {incidencia.ticket ? (
                        <EtiquetaEstadoTicket estado={incidencia.ticket.estado} />
                      ) : (
                        <span className="text-body-secondary">Preventivo</span>
                      )}
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </>
        )}
      </CModalBody>
    </CModal>
  );
}
