'use client';

/**
 * /tareas/herramientas - Herramientas utilizadas: las que el técnico tiene a su
 * nombre y las que tuvo (10/10/2026).
 *
 * Desde el 22/10/2026 va una fila por herramienta, aunque la haya usado varias
 * veces, de la usada más recientemente a la más vieja. Con "Ver OT" se abre una
 * ventana con cada vez que la usó y en qué OT, con enlace al detalle de la
 * tarea. La que tiene todavía se puede devolver desde acá.
 *
 * La OT queda guardada sólo cuando la herramienta se toma desde una tarea. Las
 * que asignó el administrador desde el depósito, y los préstamos de antes del
 * 22/10/2026, aparecen como "Sin OT registrada".
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  CButton,
  CCard,
  CCardBody,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import TablaDatos from '@/componentes/tabla/TablaDatos.js';
import DialogoHerramienta from '@/componentes/tareas/DialogoHerramienta.js';
import { listarHistorialHerramientas } from '@/servicios/tareas.js';
import { formatearFechaHora } from '@/utils/fechas.js';

const ESTADOS = ['En uso', 'Devuelta'];

/**
 * De los préstamos (uno por cada vez que tomó la herramienta) a una fila por
 * herramienta. Los préstamos ya vienen del más nuevo al más viejo, así que el
 * primero de cada herramienta es el último uso.
 */
function agruparPorHerramienta(prestamos) {
  const porCodigo = new Map();

  prestamos.forEach((prestamo) => {
    if (!porCodigo.has(prestamo.codigo)) {
      porCodigo.set(prestamo.codigo, { codigo: prestamo.codigo, nombre: prestamo.nombre, usos: [] });
    }
    porCodigo.get(prestamo.codigo).usos.push(prestamo);
  });

  return [...porCodigo.values()].map((herramienta) => {
    const actual = herramienta.usos.find((uso) => uso.enUso) ?? null;

    return {
      ...herramienta,
      ultimoUso: herramienta.usos[0].desde,
      enUso: Boolean(actual),
      // Para devolverla hace falta el préstamo abierto, con su fecha de inicio.
      prestamoActual: actual,
    };
  });
}

export default function PantallaHerramientasUtilizadas() {
  const [filas, setFilas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [aDevolver, setADevolver] = useState(null);
  // La herramienta cuyas OT se están mirando.
  const [verOt, setVerOt] = useState(null);

  function cargar() {
    return listarHistorialHerramientas()
      .then(setFilas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }

  useEffect(() => {
    listarHistorialHerramientas()
      .then(setFilas)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const herramientas = useMemo(() => agruparPorHerramienta(filas), [filas]);

  const filtradas = useMemo(
    () =>
      herramientas.filter((herramienta) => {
        if (filtroEstado === 'En uso') return herramienta.enUso;
        if (filtroEstado === 'Devuelta') return !herramienta.enUso;
        return true;
      }),
    [herramientas, filtroEstado]
  );

  const columnas = [
    {
      clave: 'herramienta',
      encabezado: 'Herramienta',
      render: (herramienta) => (
        <>
          <span className="fw-semibold">{herramienta.codigo}</span>
          <span className="text-body-secondary"> — {herramienta.nombre}</span>
        </>
      ),
    },
    {
      clave: 'ultimoUso',
      encabezado: 'Último uso',
      render: (herramienta) => <span className="text-nowrap">{formatearFechaHora(herramienta.ultimoUso)}</span>,
    },
    {
      clave: 'veces',
      encabezado: 'Veces',
      render: (herramienta) => herramienta.usos.length,
    },
    {
      clave: 'estado',
      encabezado: 'Estado',
      render: (herramienta) =>
        herramienta.enUso ? (
          <span className="fw-semibold">En uso</span>
        ) : (
          <span className="text-body-secondary">Devuelta</span>
        ),
    },
    {
      clave: 'acciones',
      encabezado: 'Acción',
      alinearDerecha: true,
      render: (herramienta) => (
        <div className="d-flex justify-content-end flex-wrap gap-2">
          <CButton color="secondary" variant="outline" size="sm" onClick={() => setVerOt(herramienta)}>
            Ver OT
          </CButton>
          {herramienta.enUso && (
            <CButton
              color="secondary"
              variant="outline"
              size="sm"
              onClick={() => setADevolver({ ...herramienta.prestamoActual, nombre: herramienta.nombre })}
            >
              Devolver
            </CButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <EncabezadoPagina titulo="Herramientas utilizadas" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      <CCard>
        <CCardBody>
          <TablaDatos
            filas={filtradas}
            claveFila={(herramienta) => herramienta.codigo}
            columnas={columnas}
            buscarPor={['codigo', 'nombre']}
            placeholderBusqueda="Buscar herramienta"
            filtros={[
              {
                etiqueta: 'Estado',
                valor: filtroEstado,
                alCambiar: setFiltroEstado,
                opciones: ESTADOS.map((estado) => ({ valor: estado, texto: estado })),
              },
            ]}
            alLimpiar={() => setFiltroEstado('')}
            cargando={cargando}
            textoVacio={
              filtroEstado
                ? 'No hay herramientas que cumplan con ese filtro.'
                : 'Todavía no tuviste herramientas a tu nombre.'
            }
          />
        </CCardBody>
      </CCard>

      <CModal visible={Boolean(verOt)} onClose={() => setVerOt(null)} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle>{verOt && `OT donde usaste ${verOt.codigo} — ${verOt.nombre}`}</CModalTitle>
        </CModalHeader>
        <CModalBody>
          {verOt && (
            <div className="table-responsive">
              <CTable small align="middle" className="mb-0">
                <CTableHead>
                  <CTableRow>
                    <CTableHeaderCell>OT</CTableHeaderCell>
                    <CTableHeaderCell>Desde</CTableHeaderCell>
                    <CTableHeaderCell>Hasta</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {verOt.usos.map((uso) => (
                    <CTableRow key={uso.desde}>
                      <CTableDataCell>
                        {uso.idOt ? (
                          <Link
                            href={`/tareas/${uso.idOt}/${uso.idTarea}`}
                            className="text-nowrap"
                            title={`Ver la tarea de la OT #${uso.idOt}`}
                          >
                            OT #{uso.idOt}
                          </Link>
                        ) : (
                          <span className="text-body-tertiary fst-italic">Sin OT registrada</span>
                        )}
                      </CTableDataCell>
                      <CTableDataCell className="text-nowrap">{formatearFechaHora(uso.desde)}</CTableDataCell>
                      <CTableDataCell className="text-nowrap">
                        {uso.enUso ? (
                          <span className="fw-semibold">En uso</span>
                        ) : (
                          <span className="text-body-secondary">{formatearFechaHora(uso.hasta)}</span>
                        )}
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </div>
          )}
        </CModalBody>
        <CModalFooter>
          {/* Es sólo para consultar: no hay nada que guardar, así que lleva un solo botón. */}
          <CButton color="secondary" variant="outline" onClick={() => setVerOt(null)}>
            Cerrar
          </CButton>
        </CModalFooter>
      </CModal>

      {aDevolver && (
        <DialogoHerramienta
          aDevolver={aDevolver}
          onCerrar={() => setADevolver(null)}
          onGuardado={() => {
            setADevolver(null);
            cargar();
          }}
        />
      )}
    </>
  );
}
