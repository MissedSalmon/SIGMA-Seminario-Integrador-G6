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
 *     filtros={[ ... ver abajo ... ]}
 *     cargando={cargando}
 *     textoVacio="Todavia no hay edificios cargados."
 *   />
 *
 * Los filtros se pasan como datos, no como JSX. Los arma la tabla para que en
 * todas las pantallas se vean y se ubiquen igual: primero el buscador y
 * despues "Filtrar por:" con los desplegables, todo en la misma linea.
 *
 *   filtros={[
 *     {
 *       etiqueta: 'Tipo',            // el nombre de la columna, nada mas
 *       valor: filtroTipo,
 *       alCambiar: setFiltroTipo,
 *       opciones: tipos.map((t) => ({ valor: t.idTipoActivo, texto: t.nombre })),
 *       textoTodos: 'Todos',         // opcional, para concordar el genero
 *     },
 *   ]}
 *
 * Con el desplegable cerrado y sin filtrar se lee el nombre de la columna
 * ("Tipo"), y al abrirlo la primera opcion dice "Todos". Las dos las agrega la
 * tabla sola: la pantalla no las escribe.
 *
 * Un filtro tambien puede ser una fecha (HU-10): en vez de opciones lleva
 * `tipo: 'fecha'` y se muestra como una caja de fecha con su etiqueta adelante.
 *
 *   { etiqueta: 'Desde', tipo: 'fecha', valor: fechaDesde, alCambiar: setFechaDesde }
 *
 * Un filtro de fecha puede ademas acotar el almanaque con `minimo` y `maximo`
 * (texto "2026-09-14"). Se usa para que un rango no se pueda dar vuelta: al
 * "Desde" se le pone como maximo el "Hasta" elegido, y al "Hasta" como minimo
 * el "Desde".
 *
 *   { etiqueta: 'Hasta', tipo: 'fecha', valor: fechaHasta, alCambiar: setFechaHasta,
 *     minimo: fechaDesde }
 *
 * Si la pantalla pasa `alLimpiar`, aparece un boton "Limpiar" al lado de los
 * filtros cuando hay alguno aplicado. La tabla no sabe cuales: solo llama a la
 * funcion, y la pantalla es la que los vacia.
 */
import { useId, useMemo, useState } from 'react';
import { CButton, CButtonGroup, CFormInput, CFormSelect, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilChevronLeft, cilChevronRight, cilSearch, cilX } from '@coreui/icons';

import { EsqueletoFilas, SinDatos } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';

const TAMANO_PAGINA = 10;

export default function TablaDatos({
  filas,
  columnas,
  claveFila,
  buscarPor = [],
  placeholderBusqueda = 'Buscar',
  filtros = [],
  alLimpiar,
  cargando = false,
  textoVacio = 'Todavia no hay datos cargados.',
}) {
  const [busqueda, setBusqueda] = useState('');
  const [paginaPedida, setPaginaPedida] = useState(1);

  // Para que cada desplegable tenga su propio id, aunque haya dos tablas.
  const idFiltros = useId();

  const hayFiltrosAplicados = filtros.some((filtro) => filtro.valor !== '' && filtro.valor != null);

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
      {/* Buscador, filtros y conteo van todos en la misma linea. */}
      <div className="sigma-tabla-toolbar">
        <div className="sigma-tabla-controles">
          {buscarPor.length > 0 && (
            <div className="sigma-tabla-buscador">
              <CIcon icon={cilSearch} size="sm" />
              <CFormInput
                size="sm"
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

          {filtros.length > 0 && (
            <>
              <span className="sigma-tabla-filtros-titulo">Filtrar por:</span>

              {filtros.map((filtro) =>
                filtro.tipo === 'fecha' ? (
                  <CampoFecha
                    key={filtro.etiqueta}
                    compacto
                    id={`${idFiltros}-${filtro.etiqueta}`}
                    etiqueta={filtro.etiqueta}
                    valor={filtro.valor}
                    alCambiar={filtro.alCambiar}
                    minimo={filtro.minimo}
                    maximo={filtro.maximo}
                  />
                ) : (
                <CFormSelect
                  className="sigma-tabla-filtro"
                  size="sm"
                  key={filtro.etiqueta}
                  id={`${idFiltros}-${filtro.etiqueta}`}
                  aria-label={`Filtrar por ${filtro.etiqueta.toLowerCase()}`}
                  value={filtro.valor}
                  onChange={(evento) => filtro.alCambiar(evento.target.value)}
                >
                  {/*
                    Las dos primeras opciones valen lo mismo (vacio: sin
                    filtrar) pero se muestran distinto, y eso es a proposito.
                    La primera lleva "hidden": no aparece en la lista al
                    desplegar, pero es la que se ve con el desplegable cerrado,
                    porque el navegador toma la primera que coincide con el
                    valor. Asi cerrado se lee el nombre de la columna
                    ("espacio") y al abrirlo la opcion de siempre ("Todos").
                  */}
                  <option value="" hidden>
                    {filtro.etiqueta}
                  </option>
                  <option value="">{filtro.textoTodos ?? 'Todos'}</option>
                  {filtro.opciones.map((opcion) => (
                    <option key={opcion.valor} value={opcion.valor}>
                      {opcion.texto}
                    </option>
                  ))}
                </CFormSelect>
                )
              )}

              {alLimpiar && hayFiltrosAplicados && (
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    alLimpiar();
                    setPaginaPedida(1);
                  }}
                  title="Quitar todos los filtros"
                >
                  <CIcon icon={cilX} size="sm" className="me-1" />
                  Limpiar
                </CButton>
              )}
            </>
          )}
        </div>

        <span className="sigma-tabla-conteo">
          {filasFiltradas.length} {filasFiltradas.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      {!cargando && filas.length === 0 ? (
        <SinDatos texto={textoVacio} />
      ) : !cargando && filasFiltradas.length === 0 ? (
        <SinDatos texto="No se encontró ningún resultado para la búsqueda." />
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
              <CButtonGroup size="sm">
                <CButton
                  color="primary"
                  variant="ghost"
                  className="btn-icono"
                  disabled={pagina === 1}
                  onClick={() => setPaginaPedida(pagina - 1)}
                  title="Pagina anterior"
                  aria-label="Pagina anterior"
                >
                  <CIcon icon={cilChevronLeft} />
                </CButton>
                <CButton
                  color="primary"
                  variant="ghost"
                  className="btn-icono"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPaginaPedida(pagina + 1)}
                  title="Pagina siguiente"
                  aria-label="Pagina siguiente"
                >
                  <CIcon icon={cilChevronRight} />
                </CButton>
              </CButtonGroup>
            </div>
          )}
        </>
      )}
    </>
  );
}
