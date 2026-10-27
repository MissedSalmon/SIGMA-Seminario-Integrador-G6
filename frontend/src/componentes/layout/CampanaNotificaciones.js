'use client';

/**
 * La campana de notificaciones de la barra de arriba. Es la misma para todos
 * los roles: la API decide cuáles le tocan a cada uno según la sesión.
 *   - Administrador: los materiales por debajo del stock mínimo (HU-33).
 *   - Técnico: sus tareas pendientes (HU-21). Reemplaza al aviso que antes
 *     salía arriba de /tareas.
 *
 * Al abrirla muestra las primeras CANTIDAD_VISIBLE y abajo "Ver más", que lleva
 * a la lista completa de ese rol.
 *
 * La lista se vuelve a pedir cada vez que se cambia de pantalla. Así, después
 * de cargar un remito o de terminar una tarea, la campana ya está al día sin
 * recargar la página.
 *
 * El número sobre la campana es la cantidad de notificaciones, nada más: lleva
 * el color principal de SIGMA, no uno que quiera decir algo.
 *
 * Además avisa con un mensaje flotante (toast):
 *   - al entrar al sistema, si hay notificaciones;
 *   - después, cada vez que aparece una que antes no estaba en la lista.
 * Para no repetir el mensaje en cada pantalla, las claves que ya se avisaron
 * se guardan en sessionStorage. Al cerrar sesión se borran (olvidarAvisadas),
 * así el que vuelve a entrar recibe el aviso de nuevo.
 */
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  CDropdown,
  CDropdownDivider,
  CDropdownHeader,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
} from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilBell } from '@coreui/icons';

import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarNotificaciones } from '@/servicios/notificaciones.js';

/** Los roles que tienen campana. Tiene que coincidir con notificaciones.rutas.js del backend. */
export const ROLES_CON_NOTIFICACIONES = ['administrador', 'tecnico'];

const CANTIDAD_VISIBLE = 5;
const CLAVE_AVISADAS = 'sigma-notificaciones-avisadas';
const DURACION_AVISO_MS = 7000;

/**
 * Las claves que ya se avisaron en esta sesión, o null si todavía no se
 * avisó nada (recién se entra). El acceso a sessionStorage puede fallar (una
 * ventana privada, por ejemplo): en ese caso se avisa como si fuera la primera vez.
 */
function leerAvisadas() {
  try {
    const guardado = sessionStorage.getItem(CLAVE_AVISADAS);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

function guardarAvisadas(claves) {
  try {
    sessionStorage.setItem(CLAVE_AVISADAS, JSON.stringify(claves));
  } catch {
    // Sin sessionStorage el aviso se puede repetir; no rompe nada.
  }
}

/** Se llama al cerrar sesión, para que el próximo ingreso vuelva a avisar. */
export function olvidarAvisadas() {
  try {
    sessionStorage.removeItem(CLAVE_AVISADAS);
  } catch {
    // Nada que borrar.
  }
}

/** El texto del aviso, o null si no hay nada que avisar. */
function armarAviso(notificaciones, avisadas) {
  if (avisadas === null) {
    if (notificaciones.length === 0) return null;
    return notificaciones.length === 1
      ? `${notificaciones[0].titulo}.`
      : `Tenés ${notificaciones.length} notificaciones.`;
  }

  const nuevas = notificaciones.filter((notificacion) => !avisadas.includes(notificacion.clave));
  if (nuevas.length === 0) return null;
  return nuevas.length === 1 ? `Nueva notificación: ${nuevas[0].titulo}.` : `Tenés ${nuevas.length} notificaciones nuevas.`;
}

export default function CampanaNotificaciones() {
  const direccionActual = usePathname();
  const { mostrarToast } = useToast();
  const [notificaciones, setNotificaciones] = useState([]);
  const [verMas, setVerMas] = useState(null);

  useEffect(() => {
    // Si se cambia de pantalla antes de que conteste la API, la respuesta
    // vieja se descarta: si no, el mismo aviso podría salir dos veces.
    let vigente = true;

    // Si la API no responde, la campana queda vacía: no es motivo para
    // tapar la pantalla con un error.
    listarNotificaciones()
      .then((respuesta) => {
        if (!vigente) return;
        setNotificaciones(respuesta.notificaciones);
        setVerMas(respuesta.verMas);
        const aviso = armarAviso(respuesta.notificaciones, leerAvisadas());
        if (aviso) mostrarToast({ tipo: 'aviso', mensaje: aviso, duracion: DURACION_AVISO_MS });
        // Se guarda la lista de hoy: si una alerta se resuelve y después vuelve
        // a aparecer, se avisa otra vez.
        guardarAvisadas(respuesta.notificaciones.map((notificacion) => notificacion.clave));
      })
      .catch(() => vigente && setNotificaciones([]));

    return () => {
      vigente = false;
    };
  }, [direccionActual, mostrarToast]);

  const visibles = notificaciones.slice(0, CANTIDAD_VISIBLE);

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle
        className="py-0 px-2 d-flex align-items-center btn btn-ghost-primary rounded-circle position-relative"
        caret={false}
        aria-label={notificaciones.length ? `Notificaciones: ${notificaciones.length}` : 'Notificaciones'}
        style={{ width: '2.4rem', height: '2.4rem', justifyContent: 'center' }}
      >
        <CIcon icon={cilBell} size="lg" />
        {notificaciones.length > 0 && (
          // Un span propio y no un CBadge: adentro de un botón, CoreUI le
          // pisa la posición y el tamaño al badge.
          <span className="sigma-campana-numero" aria-hidden="true">
            {notificaciones.length > 99 ? '99+' : notificaciones.length}
          </span>
        )}
      </CDropdownToggle>

      <CDropdownMenu className="pt-0 pb-0 shadow-sm border sigma-campana-menu">
        <CDropdownHeader
          className="bg-light fw-semibold py-2 text-secondary"
          style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}
        >
          Notificaciones
        </CDropdownHeader>

        {visibles.length === 0 ? (
          <div className="px-3 py-3 text-body-secondary small">No hay notificaciones.</div>
        ) : (
          visibles.map((notificacion) => (
            <CDropdownItem
              key={notificacion.clave}
              as={Link}
              href={notificacion.enlace}
              className="py-2 sigma-campana-item"
            >
              <div className="fw-semibold text-truncate">{notificacion.titulo}</div>
              <div className="small text-body-secondary">{notificacion.detalle}</div>
            </CDropdownItem>
          ))
        )}

        {verMas && (
          <>
            <CDropdownDivider className="my-0" />
            <CDropdownItem as={Link} href={verMas} className="py-2 text-center fw-semibold">
              Ver más
            </CDropdownItem>
          </>
        )}
      </CDropdownMenu>
    </CDropdown>
  );
}
