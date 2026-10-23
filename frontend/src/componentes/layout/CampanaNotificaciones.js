'use client';

/**
 * La campana de notificaciones de la barra de arriba (HU-33). Por ahora las
 * unicas notificaciones son las alertas de stock minimo: los materiales cuyo
 * stock actual esta por debajo del minimo.
 *
 * Al abrirla muestra los primeros CANTIDAD_VISIBLE (los que mas faltan, asi
 * los ordena la API) y abajo "Ver más", que lleva a /notificaciones con la
 * lista completa.
 *
 * La lista se vuelve a pedir cada vez que se cambia de pantalla. Asi, despues
 * de cargar un remito o de que un consumo baje el stock, la campana ya esta al
 * dia sin recargar la pagina.
 *
 * El numero sobre la campana es la cantidad de notificaciones, nada mas: lleva
 * el color principal de SIGMA, no uno que quiera decir algo.
 *
 * Ademas avisa con un mensaje flotante (toast):
 *   - al entrar al sistema, si hay materiales con stock bajo;
 *   - despues, cada vez que aparece un material que antes no estaba en la lista.
 * Para no repetir el mensaje en cada pantalla, los codigos que ya se avisaron
 * se guardan en sessionStorage. Al cerrar sesion se borran (olvidarAvisadas),
 * asi el que vuelve a entrar recibe el aviso de nuevo.
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
import { listarAlertasStock } from '@/servicios/inventario.js';

const CANTIDAD_VISIBLE = 5;
const CLAVE_AVISADAS = 'sigma-alertas-avisadas';
const DURACION_AVISO_MS = 7000;

/**
 * Los codigos que ya se avisaron en esta sesion, o null si todavia no se
 * aviso nada (recien se entra). El acceso a sessionStorage puede fallar (una
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

function guardarAvisadas(codigos) {
  try {
    sessionStorage.setItem(CLAVE_AVISADAS, JSON.stringify(codigos));
  } catch {
    // Sin sessionStorage el aviso se puede repetir; no rompe nada.
  }
}

/** Se llama al cerrar sesion, para que el proximo ingreso vuelva a avisar. */
export function olvidarAvisadas() {
  try {
    sessionStorage.removeItem(CLAVE_AVISADAS);
  } catch {
    // Nada que borrar.
  }
}

/** El texto del aviso, o null si no hay nada que avisar. */
function armarAviso(alertas, avisadas) {
  if (avisadas === null) {
    if (alertas.length === 0) return null;
    return alertas.length === 1
      ? `Tenés 1 material con stock bajo: "${alertas[0].nombre}".`
      : `Tenés ${alertas.length} materiales con stock bajo.`;
  }

  const nuevas = alertas.filter((alerta) => !avisadas.includes(alerta.codigo));
  if (nuevas.length === 0) return null;
  return nuevas.length === 1
    ? `Nueva alerta: "${nuevas[0].nombre}" quedó por debajo de su stock mínimo.`
    : `${nuevas.length} nuevas alertas de stock bajo.`;
}

export default function CampanaNotificaciones() {
  const direccionActual = usePathname();
  const { mostrarToast } = useToast();
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    // Si se cambia de pantalla antes de que conteste la API, la respuesta
    // vieja se descarta: si no, el mismo aviso podria salir dos veces.
    let vigente = true;

    // Si la API no responde, la campana queda vacia: no es motivo para
    // tapar la pantalla con un error.
    listarAlertasStock()
      .then((lista) => {
        if (!vigente) return;
        setAlertas(lista);
        const aviso = armarAviso(lista, leerAvisadas());
        if (aviso) mostrarToast({ tipo: 'aviso', mensaje: aviso, duracion: DURACION_AVISO_MS });
        // Se guarda la lista de hoy: si un material se repone y despues vuelve
        // a bajar, se avisa otra vez.
        guardarAvisadas(lista.map((alerta) => alerta.codigo));
      })
      .catch(() => vigente && setAlertas([]));

    return () => {
      vigente = false;
    };
  }, [direccionActual, mostrarToast]);

  const visibles = alertas.slice(0, CANTIDAD_VISIBLE);

  return (
    <CDropdown variant="nav-item" placement="bottom-end">
      <CDropdownToggle
        className="py-0 px-2 d-flex align-items-center btn btn-ghost-primary rounded-circle position-relative"
        caret={false}
        aria-label={alertas.length ? `Notificaciones: ${alertas.length}` : 'Notificaciones'}
        style={{ width: '2.4rem', height: '2.4rem', justifyContent: 'center' }}
      >
        <CIcon icon={cilBell} size="lg" />
        {alertas.length > 0 && (
          // Un span propio y no un CBadge: adentro de un boton, CoreUI le
          // pisa la posicion y el tamano al badge.
          <span className="sigma-campana-numero" aria-hidden="true">
            {alertas.length > 99 ? '99+' : alertas.length}
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
          visibles.map((alerta) => (
            <CDropdownItem
              key={alerta.codigo}
              as={Link}
              href={`/inventario/materiales/${encodeURIComponent(alerta.codigo)}`}
              className="py-2 sigma-campana-item"
            >
              <div className="fw-semibold text-truncate">Stock bajo: {alerta.nombre}</div>
              <div className="small text-body-secondary">
                Quedan {alerta.stockActual} · mínimo {alerta.stockMinimo}
              </div>
            </CDropdownItem>
          ))
        )}

        <CDropdownDivider className="my-0" />
        <CDropdownItem as={Link} href="/notificaciones" className="py-2 text-center fw-semibold">
          Ver más
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  );
}
