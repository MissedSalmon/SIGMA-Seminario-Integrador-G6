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
 *     textoVacio="Todavía no hay edificios cargados."
 *   />
 *
 * `claseFila` (opcional): funcion que devuelve una clase CSS para resaltar una fila.
 *
 * Una columna con `ocultarDebajoDe: 'md'` (o 'lg', 'xl') no se muestra en
 * pantallas más angostas que ese corte de Bootstrap. Si su dato hace falta
 * igual, la pantalla lo repite dentro de otra columna con la clase `d-md-none`
 * (o `d-lg-none`, `d-xl-none`).
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
 * tabla sola: la pantalla no las escribe. La lista tambien se puede filtrar
 * escribiendo, que es util cuando hay muchas opciones.
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
import { useId, useMemo } from 'react';
import { CButton, CButtonGroup, CFormInput, CTable, CTableBody, CTableDataCell, CTableHead, CTableHeaderCell, CTableRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilChevronLeft, cilChevronRight, cilSearch, cilX } from '@coreui/icons';

import { EsqueletoFilas, SinDatos, SinResultados } from '@/componentes/EstadoTabla.js';
import CampoFecha from '@/componentes/formulario/CampoFecha.js';
import CampoLista from '@/componentes/formulario/CampoLista.js';
import { useFiltroPersistente } from '@/utils/filtros.js';

const TAMANO_PAGINA = 10;

/** Las clases de la celda y del encabezado de una columna. */
function claseColumna(columna) {
  const clases = [columna.alinearDerecha && 'text-end', columna.ocultarDebajoDe && `d-none d-${columna.ocultarDebajoDe}-table-cell`];
  return clases.filter(Boolean).join(' ') || undefined;
}

export default function TablaDatos({
  filas,
  columnas,
  claveFila,
  claseFila,
  buscarPor = [],
  placeholderBusqueda = 'Buscar',
  filtros = [],
  alLimpiar,
  cargando = false,
  textoVacio = 'Todavía no hay datos cargados.',
  /** Lo que va entre los filtros y la tabla (por ejemplo, gráficos que dependen de los mismos filtros). */
  antesDeLaTabla = null,
}) {
  const [busqueda, setBusqueda] = useFiltroPersistente('busqueda', '');
  const [paginaPedida, setPaginaPedida] = useState(1);

  // Para que cada desplegable tenga su propio id, aunque haya dos tablas.
  const idFiltros = useId();

  const hayBusquedaAplicada = busqueda.trim() !== '';
  const hayFiltrosDesplegables = filtros.some((filtro) => filtro.valor !== '' && filtro.valor != null);
  const hayFiltrosAplicados = hayFiltrosDesplegables || hayBusquedaAplicada;

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
                  /*
                    Cerrado y sin filtrar se lee el nombre de la columna
                    ("Espacio"), que va como placeholder de la caja; al abrirlo,
                    arriba de la lista esta la opcion de siempre ("Todos"), que
                    saca el filtro. Se ve igual que antes, con el agregado de
                    que ahora la lista se puede filtrar escribiendo.
                  */
                  <CampoLista
                    key={filtro.etiqueta}
                    compacto
                    etiquetaOculta
                    id={`${idFiltros}-${filtro.etiqueta}`}
                    etiqueta={filtro.etiqueta}
                    valor={filtro.valor}
                    alCambiar={filtro.alCambiar}
                    opciones={filtro.opciones}
                    textoVacio={filtro.textoTodos ?? 'Todos'}
                    ancho={filtro.ancho ?? 9}
                  />
                )
              )}

              {(alLimpiar || hayBusquedaAplicada) && hayFiltrosAplicados && (
                <CButton
                  color="secondary"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    alLimpiar?.();
                    setBusqueda('');
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

          {filtros.length === 0 && hayBusquedaAplicada && (
            <CButton
              color="secondary"
              variant="ghost"
              size="sm"
              onClick={() => {
                setBusqueda('');
                setPaginaPedida(1);
              }}
              title="Limpiar búsqueda"
            >
              <CIcon icon={cilX} size="sm" className="me-1" />
              Limpiar
            </CButton>
          )}
        </div>

        {/*
          Mientras carga no hay cantidad que mostrar: "0 resultados" engañaría.
          Con algo escrito en el buscador se dice cuantos quedan de cuantos
          ("3 de 33"), asi se sabe que la lista esta recortada.
        */}
        <span className="sigma-tabla-conteo" aria-live="polite">
          {cargando
            ? 'Cargando…'
            : busqueda.trim() && filasFiltradas.length !== filas.length
              ? `${filasFiltradas.length} de ${filas.length}`
              : `${filasFiltradas.length} ${filasFiltradas.length === 1 ? 'resultado' : 'resultados'}`}
        </span>
      </div>

      {antesDeLaTabla}

      {/*
        Sin registros y sin filtros: todavia no se cargo nada (talonario en
        blanco). Con filtros o busqueda y sin resultados: se dice que se busco
        y se ofrece la salida, en lugar de decir que no hay datos cargados.
      */}
      {!cargando && filas.length === 0 && !hayFiltrosDesplegables ? (
        <SinDatos texto={textoVacio} />
      ) : !cargando && filasFiltradas.length === 0 ? (
        <SinResultados
          busqueda={busqueda.trim()}
          alBorrarBusqueda={() => {
            setBusqueda('');
            setPaginaPedida(1);
          }}
          alQuitarFiltros={
            alLimpiar && hayFiltrosDesplegables
              ? () => {
                  alLimpiar();
                  setBusqueda('');
                  setPaginaPedida(1);
                }
              : undefined
          }
        />
      ) : (
        <>
          <CTable hover responsive align="middle" className="mb-0">
            <CTableHead>
              <CTableRow>
                {columnas.map((columna) => (
                  <CTableHeaderCell key={columna.clave} className={claseColumna(columna)}>
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
                  <CTableRow key={claveFila(fila)} className={claseFila?.(fila)}>
                    {columnas.map((columna) => (
                      <CTableDataCell key={columna.clave} className={claseColumna(columna)}>
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
                Página {pagina} de {totalPaginas}
              </span>
              <CButtonGroup size="sm">
                <CButton
                  color="primary"
                  variant="ghost"
                  className="btn-icono"
                  disabled={pagina === 1}
                  onClick={() => setPaginaPedida(pagina - 1)}
                  title="Página anterior"
                  aria-label="Página anterior"
                >
                  <CIcon icon={cilChevronLeft} />
                </CButton>
                <CButton
                  color="primary"
                  variant="ghost"
                  className="btn-icono"
                  disabled={pagina === totalPaginas}
                  onClick={() => setPaginaPedida(pagina + 1)}
                  title="Página siguiente"
                  aria-label="Página siguiente"
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
