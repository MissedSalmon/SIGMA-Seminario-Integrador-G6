'use client';

/**
 * Las ordenes de trabajo abiertas del panel, dibujadas como talones de un
 * talonario: numero grande a la izquierda, linea de troquel, y en el cuerpo
 * la descripcion, los casilleros (activo y prioridad) y el sello de estado.
 *
 * Abierta = toda OT que no esta Finalizada ni Cancelada. Van las mas nuevas
 * primero y hasta `cantidad`; "Ver todas" lleva al listado completo.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';

import EtiquetaEstadoOT from '@/componentes/ordenes/EtiquetaEstadoOT.js';
import ReferenciaEtapas from '@/componentes/estados/ReferenciaEtapas.js';
import { listarOrdenes } from '@/servicios/ordenesTrabajo.js';

const ESTADOS_CERRADOS = ['Finalizada', 'Cancelada'];

export default function TalonesAbiertos({ cantidad = 3, recarga = 0 }) {
  const [ordenes, setOrdenes] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let vigente = true;

    listarOrdenes()
      .then((filas) => {
        if (!vigente) return;
        setOrdenes(filas.filter((orden) => !ESTADOS_CERRADOS.includes(orden.estado)));
        setError('');
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      });

    return () => {
      vigente = false;
    };
  }, [recarga]);

  const abiertas = (ordenes ?? []).slice().sort((a, b) => b.id - a.id);

  return (
    <section className="mb-4" aria-labelledby="titulo-talones">
      {/* Mismo titulo que "Situacion actual", para que las secciones del panel se lean parejas. */}
      <div className="d-flex align-items-baseline justify-content-between gap-3 mb-3">
        <h2
          id="titulo-talones"
          className="h5 fw-bold text-body-secondary text-uppercase m-0"
          style={{ letterSpacing: '0.05em' }}
        >
          Órdenes de trabajo abiertas
          {ordenes && <span className="fw-normal ms-2">({abiertas.length})</span>}
        </h2>
        <Link href="/ordenes-trabajo" className="small fw-semibold text-nowrap">
          Ver todas
        </Link>
      </div>

      {error && <p className="text-danger small mb-0">No se pudieron cargar las órdenes: {error}</p>}

      {!error && ordenes === null && (
        <div className="sigma-talones" aria-busy="true">
          {Array.from({ length: cantidad }).map((_, indice) => (
            <div key={indice} className="sigma-comprobante" style={{ minHeight: '7.5rem' }}>
              <div className="sigma-comprobante-talon" />
              <div className="sigma-comprobante-cuerpo">
                <div className="sigma-esqueleto-linea w-75" />
                <div className="sigma-esqueleto-linea w-50" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!error && ordenes !== null && abiertas.length === 0 && (
        <p className="text-body-secondary mb-0">No hay órdenes de trabajo abiertas.</p>
      )}

      {!error && abiertas.length > 0 && (
        <div className="sigma-talones">
          {abiertas.slice(0, cantidad).map((orden) => (
            <Link
              key={orden.id}
              href={`/ordenes-trabajo/${orden.id}`}
              className="sigma-comprobante"
              aria-label={`Orden de trabajo ${orden.id}: ${orden.descripcion ?? 'sin descripción'}, ${orden.estado}`}
            >
              <div className="sigma-comprobante-talon">
                <span className="sigma-talon-rotulo">OT N°</span>
                <span className="sigma-talon-numero">{orden.id}</span>
              </div>
              <div className="sigma-comprobante-cuerpo">
                <div className="sigma-comprobante-titulo" title={orden.descripcion ?? undefined}>
                  {orden.descripcion || 'Sin descripción'}
                </div>
                <div className="sigma-casilleros">
                  <div className="sigma-casillero">
                    <span className="sigma-casillero-rotulo">Activo</span>
                    <span className="sigma-casillero-valor">{orden.codigoActivo ?? '-'}</span>
                  </div>
                  <div className="sigma-casillero">
                    <span className="sigma-casillero-rotulo">Prioridad</span>
                    <span className="sigma-casillero-valor">{orden.prioridad ?? 'Sin tareas'}</span>
                  </div>
                </div>
                <div>
                  <EtiquetaEstadoOT estado={orden.estado} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Que significa el color de cada sello (regla 6). */}
      {abiertas.length > 0 && <ReferenciaEtapas etapas={['pendiente', 'enCurso']} />}
    </section>
  );
}
