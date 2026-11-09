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

export default function GraficoChart({
  tipo = 'bar',
  titulo,
  subtitulo,
  data,
  options = {},
  horizontal = false,
  stacked = false,
  altura = 300,
  ariaLabel,
}) {
  const [modoTabla, setModoTabla] = useState(false);

  // Paleta estándar tomada de las variables CSS de CoreUI
  const PALETA_COREUI = [
    '#321fdb', // Primary
    '#39f',    // Info
    '#2eb85c', // Success
    '#f9b115', // Warning
    '#e55353', // Danger
    '#636f83', // Secondary
    '#4f5d73', // Dark
  ];

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
    indexAxis: horizontal ? 'y' : 'x',
    plugins: {
      legend: {
        display: (data?.datasets?.length ?? 0) > 1 || tipo === 'doughnut' || tipo === 'pie',
        position: 'top',
        labels: {
          boxWidth: 12,
          usePointStyle: tipo === 'line',
        },
      },
      tooltip: {
        enabled: true,
        boxPadding: 4,
      },
    },
    scales: opcionesEscalas,
    ...options,
  };

  // Normalización de datasets con colores y estilos multisensoriales
  const datasetsNormalizados = (data?.datasets ?? []).map((ds, idx) => {
    const color = ds.backgroundColor ?? PALETA_COREUI[idx % PALETA_COREUI.length];
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
      backgroundColor: ds.backgroundColor ?? (tipo === 'doughnut' || tipo === 'pie' ? PALETA_COREUI : color),
      borderColor: tipo === 'doughnut' || tipo === 'pie' ? '#fff' : borderColor,
      borderWidth: ds.borderWidth ?? (tipo === 'doughnut' || tipo === 'pie' ? 2 : 1.5),
      ...estilosLinea,
    };
  });

  const dataNormalizada = {
    labels: data?.labels ?? [],
    datasets: datasetsNormalizados,
  };

  return (
    <CCard className="mb-4 shadow-sm h-100">
      <CCardHeader className="d-flex justify-content-between align-items-center py-2">
        <div>
          <span className="fw-semibold text-body">{titulo}</span>
          {subtitulo && <div className="text-body-secondary small">{subtitulo}</div>}
        </div>
        <CButton
          color="secondary"
          variant="ghost"
          size="sm"
          onClick={() => setModoTabla((prev) => !prev)}
          title={modoTabla ? 'Ver como gráfico' : 'Ver como tabla (accesibilidad)'}
          aria-label={modoTabla ? 'Ver como gráfico' : 'Ver como tabla'}
          className="d-flex align-items-center gap-1"
        >
          <CIcon icon={modoTabla ? cilChartLine : cilSpreadsheet} size="sm" />
          <span className="small">{modoTabla ? 'Gráfico' : 'Tabla'}</span>
        </CButton>
      </CCardHeader>

      <CCardBody style={{ minHeight: `${altura}px` }} className="p-3">
        {modoTabla ? (
          <div className="table-responsive" style={{ maxHeight: `${altura}px` }}>
            <CTable striped hover small className="mb-0 text-center">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell className="text-start">Categoría / Período</CTableHeaderCell>
                  {dataNormalizada.datasets.map((ds, idx) => (
                    <CTableHeaderCell key={idx}>{ds.label ?? `Serie ${idx + 1}`}</CTableHeaderCell>
                  ))}
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {dataNormalizada.labels.map((etiqueta, filaIdx) => (
                  <CTableRow key={filaIdx}>
                    <CTableDataCell className="text-start fw-medium">{etiqueta}</CTableDataCell>
                    {dataNormalizada.datasets.map((ds, colIdx) => (
                      <CTableDataCell key={colIdx}>
                        {ds.data?.[filaIdx] != null ? Number(ds.data[filaIdx]).toLocaleString('es-AR') : '-'}
                      </CTableDataCell>
                    ))}
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        ) : (
          <div style={{ height: `${altura}px`, position: 'relative' }}>
            <CChart
              type={tipo}
              data={dataNormalizada}
              options={opcionesFinales}
              aria-label={ariaLabel ?? titulo}
            />
          </div>
        )}
      </CCardBody>
    </CCard>
  );
}
