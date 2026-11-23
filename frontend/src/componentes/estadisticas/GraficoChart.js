'use client';

/**
 * Componente Wrapper para gráficos analíticos del Panel de SIGMA (FE-03, D2).
 *
 * Principios aplicados:
 * - D2: Chart.js (v4.6.1) con wrapper oficial @coreui/react-chartjs (v3.0.0).
 * - S9 / S10: Etiquetas y títulos descriptivos sin conclusiones interpretativas automáticas.
 * - S11: Escalas honestas forzadas (beginAtZero: true) en todos los ejes numéricos.
 * - Accesibilidad: Alternancia interactiva "Ver como tabla" (CTable) para auditoría e inclusión.
 * - Multisensorial: Marcadores y trazos diferenciados en series para no depender únicamente del color.
 */
import { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { CChart } from '@coreui/react-chartjs';
import {
  CCard,
  CCardHeader,
  CCardBody,
  CButton,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilSpreadsheet, cilChartLine } from '@coreui/icons';

// Registro selectivo de componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

/*
  Letra y colores de los ejes: los mismos de SIGMA (Public Sans y el gris de los
  textos secundarios), no la Helvetica gris de fábrica de Chart.js.
*/
ChartJS.defaults.font.family = "var(--sigma-fuente), 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
ChartJS.defaults.font.size = 12;
ChartJS.defaults.color = '#5b6f78';
ChartJS.defaults.borderColor = '#e2e6eb';

/*
  Colores de SIGMA para los gráficos (ver frontend/DESIGN.md).

  Un gráfico de una sola serie va en Petróleo: el color no dice nada, sólo
  dibuja la cantidad. Cuando cada porción es un estado o una prioridad, se usa
  el mismo color que la etiqueta de ese estado en las tablas, así un color
  significa lo mismo en todo el sistema y el gráfico lleva su referencia abajo.
*/
/*
  El lienzo de Chart.js no lee variables CSS, por eso van los valores. Son
  los mismos tonos de globals.css (--sigma-teal y --sigma-tono-*): si cambia
  uno alla, se cambia tambien aca.
*/
export const COLORES_GRAFICO = {
  petroleo: '#0b6b8c',
  petroleoClaro: '#7fb3c8',
  exito: '#1a7a47',
  aviso: '#8a6100',
  curso: '#2b55b0',
  peligro: '#b02a37',
  neutro: '#94a3b8',
  neutroClaro: '#cbd5e1',
};

/** Color de cada estado o prioridad, igual al de su etiqueta en las tablas. */
const COLOR_POR_NOMBRE = {
  Operativo: COLORES_GRAFICO.exito,
  'En mantenimiento': COLORES_GRAFICO.curso,
  'Fuera de servicio': COLORES_GRAFICO.peligro,
  Retirado: COLORES_GRAFICO.neutro,
  Alta: COLORES_GRAFICO.peligro,
  Media: COLORES_GRAFICO.aviso,
  Baja: COLORES_GRAFICO.neutro,
  'Sin prioridad': COLORES_GRAFICO.neutroClaro,
};

/** Paleta para porciones sin un significado propio (por ejemplo, correctivas y preventivas). */
const PALETA_SIGMA = [
  COLORES_GRAFICO.petroleo,
  COLORES_GRAFICO.petroleoClaro,
  COLORES_GRAFICO.neutro,
  COLORES_GRAFICO.neutroClaro,
];

/** Los colores de las porciones: el del estado si lo tiene, si no el de la paleta. */
function coloresDePorciones(etiquetas = []) {
  return etiquetas.map((etiqueta, indice) => COLOR_POR_NOMBRE[etiqueta] ?? PALETA_SIGMA[indice % PALETA_SIGMA.length]);
}

export default function GraficoChart({
  id,
  tipo = 'bar',
  titulo,
  subtitulo,
  data,
  options = {},
  horizontal = false,
  stacked = false,
  altura = 300,
  ariaLabel,
  mensajeVacio,
  controlesEncabezado,
  tablaCompleta,
}) {
  const [modoTabla, setModoTabla] = useState(false);

  const esTorta = tipo === 'doughnut' || tipo === 'pie';

  // Configuración de escalas honestas (S11)
  const esCartesiano = tipo === 'bar' || tipo === 'line';
  const opcionesEscalas = esCartesiano
    ? horizontal
      ? {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            stacked,
          },
          y: {
            stacked,
            ticks: {
              autoSkip: false,
            },
          },
        }
      : {
          y: {
            beginAtZero: true,
            ticks: { precision: 0 },
            stacked,
          },
          x: {
            stacked,
          },
        }
    : {};

  // Opciones combinadas con principios anti-sesgo
  const opcionesFinales = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 50,
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: (data?.datasets?.length ?? 0) > 1 || tipo === 'doughnut' || tipo === 'pie',
        position: tipo === 'doughnut' || tipo === 'pie' ? 'bottom' : 'top',
        labels: {
          boxWidth: 12,
          padding: 10,
          usePointStyle: tipo === 'line',
        },
      },
      tooltip: {
        enabled: true,
        boxPadding: 4,
        callbacks: {
          label: (context) => {
            const rawVal = context.raw ?? context.parsed ?? 0;
            const numVal = Number(rawVal) || 0;
            const label = context.label || context.dataset?.label || '';

            if (tipo === 'doughnut' || tipo === 'pie') {
              const datasetData = context.dataset?.data ?? [];
              const total = datasetData.reduce((acc, curr) => acc + (Number(curr) || 0), 0);
              const pct = total > 0 ? ((numVal / total) * 100).toFixed(1) : '0';
              return ` ${label}: ${numVal.toLocaleString('es-AR')} (${pct}%)`;
            }

            if (context.dataset?.label) {
              return ` ${context.dataset.label}: ${numVal.toLocaleString('es-AR')}`;
            }
            return ` ${label}: ${numVal.toLocaleString('es-AR')}`;
          },
          afterLabel: (context) => {
            const extra = context.dataset?.detalles?.[context.dataIndex];
            return extra ? ` ${extra}` : '';
          },
        },
      },
    },
    scales: opcionesEscalas,
    ...options,
  };

  // Normalización de datasets con colores y estilos multisensoriales
  const datasetsNormalizados = (data?.datasets ?? []).map((ds, idx) => {
    const color = ds.backgroundColor ?? PALETA_SIGMA[idx % PALETA_SIGMA.length];
    const borderColor = ds.borderColor ?? color;

    // Diferenciación multisensorial en líneas (trazos y marcadores)
    const estilosLinea =
      tipo === 'line'
        ? {
            borderDash: idx === 1 ? [5, 5] : idx === 2 ? [2, 2] : undefined,
            pointStyle: idx === 0 ? 'circle' : idx === 1 ? 'rect' : 'triangle',
            pointRadius: 4,
            pointHoverRadius: 6,
          }
        : {};

    return {
      ...ds,
      backgroundColor: ds.backgroundColor ?? (esTorta ? coloresDePorciones(data?.labels) : color),
      borderColor: esTorta ? '#fff' : borderColor,
      borderWidth: ds.borderWidth ?? (esTorta ? 2 : tipo === 'bar' ? 0 : 2),
      ...(tipo === 'bar' ? { borderRadius: 4, maxBarThickness: 32 } : {}),
      ...estilosLinea,
    };
  });

  const dataNormalizada = {
    labels: data?.labels ?? [],
    datasets: datasetsNormalizados,
  };

  const tieneTablaCompleta = Array.isArray(tablaCompleta?.filas) && Array.isArray(tablaCompleta?.columnas);
  const totalRegistrosTabla = tieneTablaCompleta ? tablaCompleta.filas.length : dataNormalizada.labels.length;
  const noHayDatos =
    (!dataNormalizada.labels || dataNormalizada.labels.length === 0) &&
    (!tieneTablaCompleta || tablaCompleta.filas.length === 0);

  return (
    <CCard id={id} className="h-100">
      <CCardHeader className="d-flex justify-content-between align-items-start flex-wrap gap-2 py-2">
        <div className="flex-grow-1 min-w-0">
          <div className="fw-semibold text-body" title={titulo}>{titulo}</div>
          {subtitulo && <div className="text-body-secondary small" title={subtitulo}>{subtitulo}</div>}
        </div>
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          {controlesEncabezado}
          {/* Sólo el ícono: el texto le robaba ancho al título en las tarjetas angostas. */}
          {!noHayDatos && (
            <CButton
              color="primary"
              variant="ghost"
              size="sm"
              onClick={() => setModoTabla((prev) => !prev)}
              title={modoTabla ? 'Ver como gráfico' : tieneTablaCompleta ? `Ver tabla completa (${totalRegistrosTabla})` : 'Ver como tabla'}
              aria-label={modoTabla ? 'Ver como gráfico' : tieneTablaCompleta ? `Ver tabla completa (${totalRegistrosTabla})` : 'Ver como tabla'}
              aria-pressed={modoTabla}
              className="btn-icono flex-shrink-0"
            >
              <CIcon icon={modoTabla ? cilChartLine : cilSpreadsheet} />
            </CButton>
          )}
        </div>
      </CCardHeader>

      <CCardBody style={{ minHeight: `${altura}px` }} className="p-3 d-flex flex-column justify-content-between">
        {noHayDatos ? (
          <div
            className="d-flex align-items-center justify-content-center text-body-secondary small text-center p-3 w-100"
            style={{ minHeight: `${altura - 32}px` }}
          >
            {mensajeVacio || 'Sin datos en el período seleccionado'}
          </div>
        ) : modoTabla ? (
          <>
            <div className="table-responsive" style={{ maxHeight: `${tieneTablaCompleta ? Math.max(altura, 320) : altura}px` }}>
              {tieneTablaCompleta ? (
                <CTable striped hover small className="mb-0 align-middle">
                  <CTableHead className="table-light">
                    <CTableRow>
                      {tablaCompleta.columnas.map((col, idx) => (
                        <CTableHeaderCell
                          key={col.clave ?? idx}
                          className={col.alinear === 'end' ? 'text-end' : 'text-start'}
                        >
                          {col.titulo}
                        </CTableHeaderCell>
                      ))}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {tablaCompleta.filas.map((fila, filaIdx) => (
                      <CTableRow key={fila.clave ?? filaIdx}>
                        {tablaCompleta.columnas.map((col, colIdx) => (
                          <CTableDataCell
                            key={col.clave ?? colIdx}
                            className={`${col.alinear === 'end' ? 'text-end' : 'text-start'} ${col.clase ?? ''}`.trim()}
                          >
                            {typeof col.render === 'function' ? col.render(fila, filaIdx) : (fila[col.clave] ?? '-')}
                          </CTableDataCell>
                        ))}
                      </CTableRow>
                    ))}
                  </CTableBody>
                </CTable>
              ) : (
                <CTable striped hover small className="mb-0 align-middle">
                  <CTableHead className="table-light">
                    <CTableRow>
                      <CTableHeaderCell className="text-start">Categoría / Período</CTableHeaderCell>
                      {dataNormalizada.datasets.map((ds, idx) => (
                        <CTableHeaderCell key={idx} className="text-end">
                          {ds.label ?? (tipo === 'doughnut' ? 'Cantidad' : `Serie ${idx + 1}`)}
                        </CTableHeaderCell>
                      ))}
                      {(tipo === 'doughnut' || tipo === 'pie') && (
                        <CTableHeaderCell className="text-end">% del total</CTableHeaderCell>
                      )}
                    </CTableRow>
                  </CTableHead>
                  <CTableBody>
                    {dataNormalizada.labels.map((etiqueta, filaIdx) => {
                      const ds0Val = Number(dataNormalizada.datasets[0]?.data?.[filaIdx] ?? 0);
                      const totalDoughnut = tipo === 'doughnut' || tipo === 'pie'
                        ? (dataNormalizada.datasets[0]?.data ?? []).reduce((acc, curr) => acc + (Number(curr) || 0), 0)
                        : 0;
                      const pct = totalDoughnut > 0 ? ((ds0Val / totalDoughnut) * 100).toFixed(1) : '0';

                      return (
                        <CTableRow key={filaIdx}>
                          <CTableDataCell className="text-start fw-medium">{etiqueta}</CTableDataCell>
                          {dataNormalizada.datasets.map((ds, colIdx) => (
                            <CTableDataCell key={colIdx} className="text-end">
                              {ds.data?.[filaIdx] != null ? Number(ds.data[filaIdx]).toLocaleString('es-AR') : '-'}
                            </CTableDataCell>
                          ))}
                          {(tipo === 'doughnut' || tipo === 'pie') && (
                            <CTableDataCell className="text-end text-body-secondary">{pct} %</CTableDataCell>
                          )}
                        </CTableRow>
                      );
                    })}
                  </CTableBody>
                </CTable>
              )}
            </div>
            {tieneTablaCompleta && (
              <div className="sigma-grafico-pie">
                <span className="text-body-secondary small">
                  Mostrando {totalRegistrosTabla === 1 ? 'el único registro' : `los ${totalRegistrosTabla} registros`} {tablaCompleta.etiquetaTotal ?? 'del período'}
                </span>
                <button
                  type="button"
                  className="sigma-grafico-ver-tabla"
                  onClick={() => setModoTabla(false)}
                >
                  <CIcon icon={cilChartLine} size="sm" aria-hidden="true" />
                  Volver al gráfico (Top {dataNormalizada.labels.length})
                </button>
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ height: `${altura}px`, maxHeight: `${altura}px`, width: '100%', position: 'relative' }}>
              <CChart
                type={tipo}
                data={dataNormalizada}
                options={opcionesFinales}
                aria-label={ariaLabel ?? titulo}
                customTooltips={false}
                wrapper={false}
              />
            </div>
            {tieneTablaCompleta && (
              <div className="sigma-grafico-pie">
                <span className="text-body-secondary small">
                  {totalRegistrosTabla > dataNormalizada.labels.length
                    ? `Mostrando top ${dataNormalizada.labels.length} de ${totalRegistrosTabla} ${tablaCompleta.etiquetaTotal ?? 'registrados'}`
                    : `Mostrando ${dataNormalizada.labels.length} de ${totalRegistrosTabla} ${tablaCompleta.etiquetaTotal ?? 'registrados'}`}
                </span>
                <button
                  type="button"
                  className="sigma-grafico-ver-tabla"
                  onClick={() => setModoTabla(true)}
                >
                  <CIcon icon={cilSpreadsheet} size="sm" aria-hidden="true" />
                  Ver tabla completa ({totalRegistrosTabla})
                </button>
              </div>
            )}
          </>
        )}
      </CCardBody>
    </CCard>
  );
}
