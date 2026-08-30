'use client';

/**
 * / - pantalla de inicio.
 *
 * Muestra los totales de las 3 entidades que ya existen (edificios, espacios,
 * areas) y como se reparten los espacios por tipo. No hay campos de stock,
 * estado ni fecha de alta en el modelo todavia, asi que no se inventan
 * metricas de actividad reciente: cuando existan, este es el lugar donde van
 * (Sprint 7, tablero de indicadores).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CCard, CCardBody, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBuilding, cilRoom, cilSitemap } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import EtiquetaTipo from '@/componentes/EtiquetaTipo.js';
import { SinDatos } from '@/componentes/EstadoTabla.js';
import { listarEdificios } from '@/servicios/edificios.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarAreas } from '@/servicios/areas.js';

const TARJETAS = [
  { clave: 'edificios', titulo: 'Edificios', direccion: '/edificios', icono: cilBuilding, color: '#0b6b8c', fondo: '#e6f0f4' },
  { clave: 'espacios', titulo: 'Espacios', direccion: '/espacios', icono: cilRoom, color: '#2f66c9', fondo: '#e9f1fd' },
  { clave: 'areas', titulo: 'Areas', direccion: '/areas', icono: cilSitemap, color: '#b5620f', fondo: '#fdecd8' },
];

/** Cuenta los espacios de cada tipo y los ordena de mas a menos frecuente. */
function agruparPorTipo(espacios) {
  const conteos = new Map();

  espacios.forEach((espacio) => {
    if (!espacio.tipo) return;
    conteos.set(espacio.tipo, (conteos.get(espacio.tipo) ?? 0) + 1);
  });

  return [...conteos.entries()]
    .map(([tipo, cantidad]) => ({ tipo, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

export default function PantallaInicio() {
  const [datos, setDatos] = useState({ edificios: [], espacios: [], areas: [] });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    Promise.all([listarEdificios(), listarEspacios(), listarAreas()])
      .then(([edificios, espacios, areas]) => {
        if (vigente) setDatos({ edificios, espacios, areas });
      })
      .catch(() => {
        if (vigente) setDatos({ edificios: [], espacios: [], areas: [] });
      })
      .finally(() => {
        if (vigente) setCargando(false);
      });

    return () => {
      vigente = false;
    };
  }, []);

  const totales = {
    edificios: datos.edificios.length,
    espacios: datos.espacios.length,
    areas: datos.areas.length,
  };

  const espaciosPorTipo = agruparPorTipo(datos.espacios);
  const sinNadaCargado = !cargando && totales.edificios === 0 && totales.espacios === 0 && totales.areas === 0;

  return (
    <>
      <EncabezadoPagina
        titulo="Panel"
        descripcion="SIGMA - Sistema Integral de Gestion de Mantenimiento de Activos."
      />

      {sinNadaCargado ? (
        <SinDatos
          texto="Todavia no hay nada cargado. Empeza dando de alta el primer edificio."
          accion={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }}
        />
      ) : (
        <>
          <CRow className="g-3 mb-4">
            {TARJETAS.map((tarjeta) => (
              <CCol key={tarjeta.clave} sm={6} lg={4}>
                <CCard className="h-100">
                  <CCardBody>
                    <Link href={tarjeta.direccion} className="sigma-stat-tarjeta">
                      <span
                        className="sigma-stat-icono"
                        style={{ backgroundColor: tarjeta.fondo, color: tarjeta.color }}
                      >
                        <CIcon icon={tarjeta.icono} size="lg" />
                      </span>
                      <div>
                        <div className="sigma-stat-numero">{cargando ? '-' : totales[tarjeta.clave]}</div>
                        <div className="sigma-stat-etiqueta">{tarjeta.titulo}</div>
                      </div>
                    </Link>
                  </CCardBody>
                </CCard>
              </CCol>
            ))}
          </CRow>

          {espaciosPorTipo.length > 0 && (
            <CCard>
              <CCardBody>
                <h2 className="sigma-seccion-titulo">Espacios por tipo</h2>
                <div className="d-flex flex-column gap-3">
                  {espaciosPorTipo.map(({ tipo, cantidad }) => (
                    <div key={tipo}>
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <EtiquetaTipo texto={tipo} />
                        <span className="text-body-secondary small">{cantidad}</span>
                      </div>
                      <div className="sigma-barra-proporcion">
                        <span style={{ width: `${(cantidad / totales.espacios) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </CCardBody>
            </CCard>
          )}
        </>
      )}
    </>
  );
}
