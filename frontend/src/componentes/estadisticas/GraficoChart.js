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

  // Paleta minimalista, técnica y corporativa de alto contraste y sobriedad
  const PALETA_CORPORATIVA = [
    '#000000', // Negro puro
    '#495057', // Gris carbón de alto contraste
    '#6c757d', // Gris pizarra medio
    '#adb5bd', // Gris claro técnico
    '#ced4da', // Gris suave
    '#212529', // Grafito oscuro
    '#343a40', // Antracita
  ];

  // Configuración de ejes finos negros (#000000) sin cuadrícula interna y tipografía sans-serif
  const estiloEje = {
    border: {
      display: true,
      color: '#000000',
      width: 1,
    },
    grid: {
      display: false,
      drawBorder: false,
      drawTicks: true,
      tickColor: '#000000',
      tickWidth: 1,
      tickLength: 4,
    },
    ticks: {
      color: '#212529',
      font: {
        family: 'Arial, Roboto, sans-serif',
        size: 11,
        weight: 'normal',
      },
      precision: 0,
    },
  };

  // Configuración de escalas honestas (S11) con ejes finos sin cuadrícula
  const esCartesiano = tipo === 'bar' || tipo === 'line';
  const opcionesEscalas = esCartesiano
    ? horizontal
      ? {
          x: {
            beginAtZero: true,
            stacked,
            ...estiloEje,
          },
          y: {
            stacked,
            ...estiloEje,
          },
        }
      : {
          y: {
            beginAtZero: true,
            stacked,
            ...estiloEje,
          },
          x: {
            stacked,
            ...estiloEje,
          },
        }
    : {};

  // Opciones combinadas: estética limpia, técnica y profesional
  const opcionesFinales = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: horizontal ? 'y' : 'x',
    cutout: tipo === 'doughnut' ? '65%' : undefined,
    plugins: {
      legend: {
        display: (data?.datasets?.length ?? 0) > 1 || tipo === 'doughnut' || tipo === 'pie',
        position: 'top',
        align: 'center',
        labels: {
          boxWidth: 8,
          boxHeight: 8,
          usePointStyle: tipo === 'line',
          color: '#212529',
          font: {
            family: 'Arial, Roboto, sans-serif',
            size: 11,
            weight: 'normal',
          },
          padding: 12,
        },
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#212529',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#000000',
        borderWidth: 1,
        cornerRadius: 2,
        boxPadding: 4,
        titleFont: {
          family: 'Arial, Roboto, sans-serif',
          size: 12,
          weight: 'normal',
        },
        bodyFont: {
          family: 'Arial, Roboto, sans-serif',
          size: 11,
          weight: 'normal',
        },
      },
    },
    scales: opcionesEscalas,
    ...options,
  };

  // Normalización de datasets con líneas finas (1 a 1.5 px), curvas suavizadas y marcadores geométricos
  const datasetsNormalizados = (data?.datasets ?? []).map((ds, idx) => {
    const colorPorDefecto = PALETA_CORPORATIVA[idx % PALETA_CORPORATIVA.length];

    // Estilo de líneas: fino (1.5 px), curvas suavizadas (tension: 0.25) y pequeños marcadores
    const estilosLinea =
      tipo === 'line'
        ? {
            borderColor: ds.borderColor ?? (idx === 0 ? '#000000' : idx === 1 ? '#495057' : '#212529'),
            backgroundColor: 'transparent',
            borderWidth: ds.borderWidth ?? 1.5,
            tension: ds.tension ?? 0.25,
            borderDash: idx === 1 ? [4, 4] : idx === 2 ? [2, 2] : undefined,
            pointStyle: idx === 0 ? 'circle' : idx === 1 ? 'rect' : 'triangle',
            pointRadius: ds.pointRadius ?? 3,
            pointHoverRadius: ds.pointHoverRadius ?? 5,
            pointBackgroundColor: ds.borderColor ?? (idx === 0 ? '#000000' : idx === 1 ? '#495057' : '#212529'),
            pointBorderColor: ds.borderColor ?? (idx === 0 ? '#000000' : idx === 1 ? '#495057' : '#212529'),
            fill: false,
          }
        : {};

    const estilosBarra =
      tipo === 'bar'
        ? {
            backgroundColor: ds.backgroundColor ?? (horizontal ? '#212529' : colorPorDefecto),
            borderColor: ds.borderColor ?? '#000000',
            borderWidth: ds.borderWidth ?? 1,
          }
        : {};

    const estilosDoughnut =
      tipo === 'doughnut' || tipo === 'pie'
        ? {
            backgroundColor: ds.backgroundColor ?? PALETA_CORPORATIVA,
            borderColor: '#ffffff',
            borderWidth: 1.5,
            hoverOffset: 2,
          }
        : {};

    return {
      ...ds,
      ...estilosBarra,
      ...estilosDoughnut,
      ...estilosLinea,
    };
  });

  const dataNormalizada = {
    labels: data?.labels ?? [],
    datasets: datasetsNormalizados,
  };

  return (
    <CCard className="mb-4 bg-white border border-light-subtle shadow-none h-100">
      <CCardHeader className="bg-white border-bottom border-light-subtle py-2 px-3 position-relative d-flex align-items-center justify-content-center">
        <div className="text-center px-4">
          <div
            className="fs-6 fw-normal text-dark"
            style={{ fontFamily: 'Arial, Roboto, sans-serif' }}
          >
            {titulo}
          </div>
          {subtitulo && (
            <div
              className="text-secondary small mt-0"
              style={{ fontFamily: 'Arial, Roboto, sans-serif', fontSize: '0.75rem' }}
            >
              {subtitulo}
            </div>
          )}
        </div>
        <div className="position-absolute end-0 me-3">
          <CButton
            color="secondary"
            variant="ghost"
            size="sm"
            onClick={() => setModoTabla((prev) => !prev)}
            title={modoTabla ? 'Ver como gráfico' : 'Ver como tabla (accesibilidad)'}
            aria-label={modoTabla ? 'Ver como gráfico' : 'Ver como tabla'}
            className="d-flex align-items-center gap-1 text-secondary"
          >
            <CIcon icon={modoTabla ? cilChartLine : cilSpreadsheet} size="sm" />
            <span className="small">{modoTabla ? 'Gráfico' : 'Tabla'}</span>
          </CButton>
        </div>
      </CCardHeader>

      <CCardBody style={{ minHeight: `${altura}px` }} className="p-3 bg-white">
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
