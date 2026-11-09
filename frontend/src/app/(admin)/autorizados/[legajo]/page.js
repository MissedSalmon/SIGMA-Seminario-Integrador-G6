'use client';

/**
 * /autorizados/1024 - ficha de un usuario autorizado, con todas sus acciones
 * (ver componentes/usuarios/AccionesUsuario.js).
 */
import { use, useCallback, useEffect, useState } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import AccionesFicha, { Dato } from '@/componentes/usuarios/AccionesUsuario.js';
import EtiquetaEstadoUsuario from '@/componentes/usuarios/EtiquetaEstadoUsuario.js';
import { eliminarAutorizado, obtenerAutorizado } from '@/servicios/autorizados.js';
import { soloFechaLegible } from '@/utils/fechas.js';

export default function PantallaFichaAutorizado({ params }) {
  // En Next.js 16 los parametros de la direccion llegan como promesa.
  const legajo = decodeURIComponent(use(params).legajo);

  const [autorizado, setAutorizado] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const pedir = useCallback(() => {
    obtenerAutorizado(legajo)
      .then(setAutorizado)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [legajo]);

  useEffect(pedir, [pedir]);

  const direccion = `/autorizados/${encodeURIComponent(legajo)}`;

  return (
    <>
      <EncabezadoPagina
        titulo={autorizado ? autorizado.nombre : 'Usuario autorizado'}
        accionesExtra={
          autorizado && (
            <AccionesFicha
              persona={autorizado}
              hrefEditar={`${direccion}/editar`}
              volverA="/autorizados"
              eliminar={() => eliminarAutorizado(autorizado.legajo)}
              avisoEliminar={
                <>
                  <p className="mb-0">
                    Se va a eliminar al usuario autorizado <strong>{autorizado.nombre}</strong>.
                  </p>
                  <p className="text-body-secondary mt-2 mb-0">
                    Sólo se puede eliminar si nunca registró nada: si ya cargó tickets, desactivalo. El
                    área que tenía a cargo queda sin responsable.
                  </p>
                </>
              }
              alCambiar={pedir}
              alFallar={setError}
            />
          )
        }
      />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando el usuario autorizado..." />
      ) : (
        autorizado && (
          <CCard className="mb-4">
            <CCardHeader className="fw-semibold">Datos</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Legajo">{autorizado.legajo}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="DNI">{autorizado.dni}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="CUIL">{autorizado.cuil}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Fecha de nacimiento">
                    {autorizado.fechaNacimiento && soloFechaLegible(autorizado.fechaNacimiento)}
                  </Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Email">{autorizado.email}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Teléfono">{autorizado.telefono}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Área">{autorizado.nombreArea}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Estado">
                    <EtiquetaEstadoUsuario activo={autorizado.activo} />
                  </Dato>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/autorizados" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
