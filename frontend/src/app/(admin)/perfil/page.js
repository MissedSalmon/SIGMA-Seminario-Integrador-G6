'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CCard,
  CCardBody,
  CCardHeader,
  CSpinner,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilUser, cilLockLocked } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { obtenerPerfil } from '@/servicios/auth.js';

export default function PerfilPage() {
  const router = useRouter();
  const [perfil, setPerfil] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPerfil = async () => {
      try {
        const res = await obtenerPerfil();
        if (res.ok) {
          setPerfil(res.datos);
        }
      } catch (error) {
        console.error('Error al obtener perfil:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPerfil();
  }, []);

  if (isLoading) {
    return (
      <div>
        <EncabezadoPagina titulo="Mi Perfil" />
        <div className="d-flex align-items-center gap-2 text-secondary p-4">
          <CSpinner size="sm" />
          <span>Cargando perfil...</span>
        </div>
      </div>
    );
  }

  if (!perfil) {
    return (
      <div>
        <EncabezadoPagina titulo="Mi Perfil" />
        <div className="alert alert-danger" role="alert">
          No se pudo cargar la información del perfil.
        </div>
      </div>
    );
  }

  const nombreUsuario =
    perfil.admin_nom_ape ||
    perfil.tecnico_nom_ape ||
    perfil.autorizado_nom_ape ||
    perfil.adminNomYApe ||
    perfil.tecnicoNomYApe ||
    perfil.autorizadoNomYApe;

  const legajoUsuario =
    perfil.admin_legajo ||
    perfil.tecnico_legajo ||
    perfil.autorizado_legajo ||
    perfil.adminLegajo ||
    perfil.tecnicoLegajo ||
    perfil.autorizadoLegajo ||
    perfil.identificador;

  const telefonoUsuario =
    perfil.admin_tel ||
    perfil.tecnico_tel ||
    perfil.autorizado_tel;

  return (
    <div>
      <EncabezadoPagina titulo="Mi Perfil" />

      <CCard
        className="shadow-sm border mb-4"
        style={{
          maxWidth: '44rem',
          borderRadius: 'var(--sigma-radio-md)',
          borderColor: 'var(--sigma-borde)',
        }}
      >
        <CCardHeader className="bg-white py-3 border-bottom d-flex align-items-center gap-2">
          <CIcon icon={cilUser} className="text-primary" />
          <strong style={{ color: 'var(--sigma-ink)' }}>Datos de la cuenta</strong>
        </CCardHeader>

        <CCardBody className="p-4">
          <div className="row g-3 mb-4">
            <div className="col-12 col-md-6">
              <span className="text-secondary small d-block">Identificador / Legajo</span>
              <strong style={{ color: 'var(--sigma-ink)', fontSize: '1.05rem' }}>
                {legajoUsuario}
              </strong>
            </div>

            <div className="col-12 col-md-6">
              <span className="text-secondary small d-block">Rol en el sistema</span>
              <span
                className="badge bg-primary-subtle text-primary-emphasis text-capitalize px-2 py-1"
                style={{ fontSize: '0.9rem' }}
              >
                {perfil.rol}
              </span>
            </div>

            {nombreUsuario && (
              <div className="col-12 col-md-6">
                <span className="text-secondary small d-block">Nombre y Apellido</span>
                <span style={{ color: 'var(--sigma-ink)' }}>{nombreUsuario}</span>
              </div>
            )}

            {telefonoUsuario && (
              <div className="col-12 col-md-6">
                <span className="text-secondary small d-block">Teléfono de contacto</span>
                <span style={{ color: 'var(--sigma-ink)' }}>{telefonoUsuario}</span>
              </div>
            )}

            {perfil.autorizado_email && (
              <div className="col-12 col-md-6">
                <span className="text-secondary small d-block">Correo electrónico</span>
                <span style={{ color: 'var(--sigma-ink)' }}>{perfil.autorizado_email}</span>
              </div>
            )}

            {perfil.tecnico_disponibilidad && (
              <div className="col-12 col-md-6">
                <span className="text-secondary small d-block">Disponibilidad</span>
                <span style={{ color: 'var(--sigma-ink)' }}>{perfil.tecnico_disponibilidad}</span>
              </div>
            )}
          </div>

          <hr className="my-4" style={{ borderColor: 'var(--sigma-borde)' }} />

          <div className="d-flex flex-wrap gap-2">
            <BotonEnlace href="/configuracion/cambiar-password" color="primary">
              <CIcon icon={cilLockLocked} className="me-2" />
              Cambiar contraseña
            </BotonEnlace>
          </div>
        </CCardBody>
      </CCard>
    </div>
  );
}
