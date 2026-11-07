'use client';

/**
 * /tecnicos/1024 - ficha de un técnico, con todas sus acciones (ver
 * componentes/usuarios/AccionesUsuario.js).
 */
import { use, useCallback, useEffect, useState } from 'react';
import { CCard, CCardBody, CCardHeader, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilArrowLeft } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import EtiquetaDisponibilidad from '@/componentes/EtiquetaDisponibilidad.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import AccionesFicha, { Dato } from '@/componentes/usuarios/AccionesUsuario.js';
import EtiquetaEstadoUsuario from '@/componentes/usuarios/EtiquetaEstadoUsuario.js';
import { eliminarTecnico, obtenerTecnico } from '@/servicios/tecnicos.js';

export default function PantallaFichaTecnico({ params }) {
  // En Next.js 16 los parametros de la direccion llegan como promesa.
  const { legajo } = use(params);

  const [tecnico, setTecnico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const pedir = useCallback(() => {
    obtenerTecnico(legajo)
      .then(setTecnico)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [legajo]);

  useEffect(pedir, [pedir]);

  return (
    <>
      <EncabezadoPagina
        titulo={tecnico ? tecnico.nombre : 'Técnico'}
        accionesExtra={
          tecnico && (
            <AccionesFicha
              persona={tecnico}
              hrefEditar={`/tecnicos/${tecnico.legajo}/editar`}
              volverA="/tecnicos"
              eliminar={() => eliminarTecnico(tecnico.legajo)}
              avisoEliminar={
                <>
                  <p className="mb-0">
                    Se va a eliminar al técnico <strong>{tecnico.nombre}</strong>.
                  </p>
                  <p className="text-body-secondary mt-2 mb-0">
                    Sólo se puede eliminar si nunca registró nada: tareas, herramientas u observaciones.
                    Si ya tiene historial, desactivalo.
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
        <Cargando texto="Cargando el técnico..." />
      ) : (
        tecnico && (
          <CCard className="mb-4">
            <CCardHeader className="fw-semibold">Datos</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Legajo">{tecnico.legajo}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Teléfono">{tecnico.telefono}</Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Disponibilidad">
                    <EtiquetaDisponibilidad disponibilidad={tecnico.disponibilidad} />
                  </Dato>
                </CCol>
                <CCol sm={6} lg={3}>
                  <Dato etiqueta="Estado">
                    <EtiquetaEstadoUsuario activo={tecnico.activo} />
                  </Dato>
                </CCol>
                <CCol xs={12}>
                  <Dato etiqueta="Especialidades">
                    {tecnico.especialidades.map((especialidad) => especialidad.nombre).join(', ')}
                  </Dato>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        )
      )}

      <div className="mt-2 mb-4">
        <BotonEnlace href="/tecnicos" color="secondary" variante="outline">
          <CIcon icon={cilArrowLeft} className="me-2" />
          Volver al listado
        </BotonEnlace>
      </div>
    </>
  );
}
