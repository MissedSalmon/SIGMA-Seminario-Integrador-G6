'use client';

/**
 * /perfil - los datos de la cuenta de quien inicio sesion.
 *
 * Se dibuja como una credencial del mundo «Talonario» (ver frontend/DESIGN.md):
 * a la izquierda el talon con el legajo, que es la identidad de la persona;
 * a la derecha el nombre, el rol y los datos de contacto en casilleros. Abajo,
 * la seguridad de la cuenta (cambiar la contraseña).
 */
import { useEffect, useState } from 'react';
import { CButton } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilLockLocked } from '@coreui/icons';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import DialogoCambiarContrasena from '@/componentes/usuarios/CambioContrasena.js';
import { obtenerPerfil } from '@/servicios/auth.js';
import { normalizarRol } from '@/utils/roles.js';

/** Como se nombra cada rol en pantalla. */
const NOMBRE_ROL = {
  administrador: 'Administrador',
  tecnico: 'Técnico',
  autorizado: 'Usuario autorizado',
};

/**
 * El primer dato que exista, entre los nombres que puede traer el perfil. Un
 * guion suelto cuenta como vacio: el administrador inicial se cargo asi.
 */
function primero(perfil, claves) {
  for (const clave of claves) {
    const valor = String(perfil[clave] ?? '').trim();
    if (valor && valor !== '-') return valor;
  }
  return null;
}

/** Un casillero de la credencial: rotulo arriba, valor abajo. */
function Casillero({ rotulo, children }) {
  return (
    <div className="sigma-casillero">
      <span className="sigma-casillero-rotulo">{rotulo}</span>
      <span className="sigma-casillero-valor" title={typeof children === 'string' ? children : undefined}>
        {children}
      </span>
    </div>
  );
}

export default function PerfilPage() {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [cambiandoContrasena, setCambiandoContrasena] = useState(false);

  useEffect(() => {
    obtenerPerfil()
      .then((res) => {
        if (res.ok) setPerfil(res.datos);
      })
      .catch((error) => console.error('Error al obtener perfil:', error))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) {
    return (
      <>
        <EncabezadoPagina titulo="Mi perfil" />
        <div className="sigma-credencial" aria-busy="true">
          <div className="sigma-credencial-talon" />
          <div className="sigma-credencial-cuerpo">
            <div className="sigma-esqueleto-linea w-50 mb-3" />
            <div className="sigma-esqueleto-linea w-75" />
          </div>
        </div>
      </>
    );
  }

  if (!perfil) {
    return (
      <>
        <EncabezadoPagina titulo="Mi perfil" />
        <Aviso mensaje="No se pudo cargar la información del perfil. Recargá la página para volver a intentar." />
      </>
    );
  }

  const nombre = primero(perfil, ['admin_nom_ape', 'tecnico_nom_ape', 'autorizado_nom_ape', 'adminNomYApe', 'tecnicoNomYApe', 'autorizadoNomYApe']);
  const legajo = primero(perfil, ['admin_legajo', 'tecnico_legajo', 'autorizado_legajo', 'adminLegajo', 'tecnicoLegajo', 'autorizadoLegajo', 'identificador']);
  const telefono = primero(perfil, ['admin_tel', 'tecnico_tel', 'autorizado_tel']);
  const rol = normalizarRol(perfil.rol);

  return (
    <>
      <EncabezadoPagina titulo="Mi perfil" />

      <section className="sigma-credencial" aria-label="Datos de la cuenta">
        <div className="sigma-credencial-talon">
          <span className="sigma-talon-rotulo">Legajo</span>
          <span className="sigma-talon-numero">{legajo ?? '-'}</span>
        </div>

        <div className="sigma-credencial-cuerpo">
          <div className="sigma-credencial-titular">
            <h2 className="sigma-credencial-nombre">{nombre || legajo}</h2>
            {/* El rol es una categoria, no un estado: va en la etiqueta neutra. */}
            <span className="sigma-etiqueta">{NOMBRE_ROL[rol] ?? perfil.rol}</span>
          </div>

          <div className="sigma-casilleros">
            <Casillero rotulo="Teléfono">{telefono || 'Sin cargar'}</Casillero>
            {perfil.autorizado_email && <Casillero rotulo="Correo electrónico">{perfil.autorizado_email}</Casillero>}
            {perfil.tecnico_disponibilidad && (
              <Casillero rotulo="Disponibilidad">{perfil.tecnico_disponibilidad}</Casillero>
            )}
          </div>
        </div>
      </section>

      <section className="sigma-credencial-seguridad" aria-labelledby="titulo-seguridad">
        <div>
          <h2 id="titulo-seguridad" className="sigma-seccion-titulo border-0 p-0 mb-1">
            Seguridad
          </h2>
          <p className="text-body-secondary mb-0">La contraseña con la que entrás a SIGMA.</p>
        </div>
        <CButton type="button" color="primary" variant="outline" onClick={() => setCambiandoContrasena(true)}>
          <CIcon icon={cilLockLocked} className="me-2" />
          Cambiar contraseña
        </CButton>
      </section>

      {cambiandoContrasena && <DialogoCambiarContrasena onCerrar={() => setCambiandoContrasena(false)} />}
    </>
  );
}
