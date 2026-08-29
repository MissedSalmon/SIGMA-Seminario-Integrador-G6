'use client';

/**
 * / - pantalla de inicio.
 *
 * Por ahora es la puerta de entrada a los modulos que estan hechos. Cuando
 * este el tablero de indicadores (Sprint 7), este es el lugar donde va.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CCard, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBuilding, cilRoom, cilSitemap } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { listarEdificios } from '@/servicios/edificios.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarAreas } from '@/servicios/areas.js';

const MODULOS = [
  {
    clave: 'edificios',
    titulo: 'Edificios',
    direccion: '/edificios',
    icono: cilBuilding,
    color: 'primary',
    cargar: listarEdificios,
  },
  {
    clave: 'espacios',
    titulo: 'Espacios',
    direccion: '/espacios',
    icono: cilRoom,
    color: 'info',
    cargar: listarEspacios,
  },
  {
    clave: 'areas',
    titulo: 'Areas',
    direccion: '/areas',
    icono: cilSitemap,
    color: 'warning',
    cargar: listarAreas,
  },
];

export default function PantallaInicio() {
  // Cuantos hay de cada cosa. null mientras carga o si la API no responde.
  const [totales, setTotales] = useState({});

  useEffect(() => {
    MODULOS.forEach(async (modulo) => {
      try {
        const filas = await modulo.cargar();
        setTotales((previos) => ({ ...previos, [modulo.clave]: filas.length }));
      } catch {
        setTotales((previos) => ({ ...previos, [modulo.clave]: null }));
      }
    });
  }, []);

  return (
    <>
      <EncabezadoPagina
        titulo="Panel"
        descripcion="SIGMA - Sistema Integral de Gestion de Mantenimiento de Activos."
      />

      <CRow className="g-4">
        {MODULOS.map((modulo) => (
          <CCol key={modulo.clave} sm={6} lg={4}>
            <CCard className="h-100">
              <Link
                href={modulo.direccion}
                className="card-body d-flex align-items-center gap-3 text-decoration-none text-body"
                >
                <CIcon icon={modulo.icono} size="xxl" className={`text-${modulo.color}`} />
                <div>
                  <div className="fs-4 fw-semibold">
                    {totales[modulo.clave] ?? '-'}
                  </div>
                  <div className="text-body-secondary text-uppercase small fw-semibold">
                    {modulo.titulo}
                  </div>
                </div>
              </Link>
            </CCard>
          </CCol>
        ))}
      </CRow>

      <p className="text-body-secondary mt-4 mb-0">
        Los datos que se ven son de prueba: la base de datos todavia no esta creada y se
        pierden cada vez que se reinicia el backend.
      </p>
    </>
  );
}
