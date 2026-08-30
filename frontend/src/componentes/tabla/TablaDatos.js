'use client';

/**
 * Tabla generica de listado: buscador de texto libre y paginacion, las dos
 * cosas sobre los datos que ya se trajeron de la API (las listas de SIGMA no
 * paginan del lado del servidor). La usan las 3 pantallas de listado en vez
 * de repetir el mismo CTable con columnas distintas.
 *
 *   <TablaDatos
 *     filas={edificios}
 *     claveFila={(edificio) => edificio.idEdificio}
 *     columnas={[
 *       { clave: 'nombre', encabezado: 'Nombre', render: (e) => e.nombre },
 *       { clave: 'direccion', encabezado: 'Direccion', render: (e) => e.direccion ?? '-' },
 *       { clave: 'acciones', encabezado: 'Acciones', alinearDerecha: true, render: (e) => <Acciones edificio={e} /> },
 *     ]}
 *     buscarPor={['nombre', 'direccion']}
 *     placeholderBusqueda="Buscar edificio..."
 *     filtros={<selector de edificio, opcional>}
 *     cargando={cargando}
 *     textoVacio="Todavia no hay edificios cargados."
 *     accionVacio={{ texto: 'Agregar edificio', direccion: '/edificios/agregar' }}
 *   />
 */
import { useMemo, useState } from 'react';
import { CButton, CFormInput, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilChevronLeft, cilChevronRight, cilSearch } from '@coreui/icons';

import { EsqueletoFilas, SinDatos } from '@/componentes/EstadoTabla.js';

const TAMANO_PAGINA = 10;

export default function TablaDatos({
  filas,
  columnas,
  claveFila,
  buscarPor = [],
  placeholderBusqueda = 'Buscar...',
  filtros,
  cargando = false,
  textoVacio = 'Todavia no hay datos cargados.',
  accionVacio,
}) {
  const [busqueda, setBusqueda] = useState('');
  const [paginaPedida, setPaginaPedida] = useState(1);

  const filasFiltradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto || buscarPor.length === 0) return filas;

    return filas.filter((fila) =>
      buscarPor.some((campo) => String(fila[campo] ?? '').toLowerCase().includes(texto))
    );
  }, [filas, busqueda, buscarPor]);

  const totalPaginas = Math.max(1, Math.ceil(filasFiltradas.length / TAMANO_PAGINA));

  // Si el filtro deja menos paginas de las que habia, no te dejamos en una
  // pagina vacia ("3 de 1"): se recalcula en el render, sin otro efecto.
  const pagina = Math.min(paginaPedida, totalPaginas);

  const filasPagina = filasFiltradas.slice((pagina - 1) * TAMANO_PAGINA, pagina * TAMANO_PAGINA);

  return (
    <>
      <div className="sigma-tabla-toolbar">
        <div className="d-flex flex-wrap gap-3 align-items-center">
          {buscarPor.length > 0 && (
            <div className="sigma-tabla-buscador">
              <CIcon icon={cilSearch} size="sm" />
              <CFormInput
                value={busqueda}
                onChange={(evento) => {
                  setBusqueda(evento.target.value);
                  setPaginaPedida(1);
                }}
                placeholder={placeholderBusqueda}
                aria-label={placeholderBusqueda}
              />
            </div>
          )}
          {filtros}
        </div>

        <span className="sigma-tabla-conteo">
          {filasFiltradas.length} {filasFiltradas.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {!cargando && filas.length === 0 ? (
        <SinDatos texto={textoVacio} accion={accionVacio} />
      ) : !cargando && filasFiltradas.length === 0 ? (
        <SinDatos texto="No se encontro ningun resultado para la busqueda." />
      ) : (
        <>
          <CTable hover responsive align="middle" className="mb-0">
            <CTableHead>
              <CTableRow>
                {columnas.map((columna) => (
                  <CTableHeaderCell key={columna.clave} className={columna.alinearDerecha ? 'text-end' : undefined}>
                    {columna.encabezado}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>

            <CTableBody>
              {cargando ? (
                <EsqueletoFilas columnas={columnas} />
              ) : (
                filasPagina.map((fila) => (
                  <CTableRow key={claveFila(fila)}>
                    {columnas.map((columna) => (
                      <CTableDataCell key={columna.clave} className={columna.alinearDerecha ? 'text-end' : undefined}>
                        {columna.render(fila)}
                      </CTableDataCell>
                    ))}
                  </CTableRow>
                ))
              )}
            </CTableBody>
          </CTable>

          {totalPaginas > 1 && (
            <div className="sigma-tabla-paginacion">
              <span className="sigma-tabla-conteo">
                Pagina {pagina} de {totalPaginas}
              </span>
              <div className="d-flex gap-2">
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  disabled={pagina === 1}
                  onClick={() => setPaginaPedida(pagina - 1)}
                >
                  <CIcon icon={cilChevronLeft} size="sm" className="me-1" />
                  Anterior
                </CButton>
                <CButton
                  color="secondary"
                  variant="outline"
                  size="sm"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPaginaPedida(pagina + 1)}
                >
                  Siguiente
                  <CIcon icon={cilChevronRight} size="sm" className="ms-1" />
                </CButton>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
