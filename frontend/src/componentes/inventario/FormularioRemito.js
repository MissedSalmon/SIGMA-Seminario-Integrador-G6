'use client';

/**
 * Alta de un remito de ingreso al deposito (HU-16).
 *
 * El remito es el comprobante con el que llega la mercaderia. Tiene dos
 * partes: de donde vino (proveedor, numero de remito y fecha de recepcion) y
 * que trajo (un renglon por item, con su cantidad).
 *
 * EL REMITO NO DA DE ALTA ITEMS. La lista de cada renglon ofrece unicamente lo
 * que ya esta en el catalogo del deposito (HU-13), y el <CampoLista> no deja
 * escribir nada que no este en la lista. Si el item no existe todavia, hay que
 * darlo de alta primero: el enlace esta abajo de la tabla.
 *
 * NO HAY EDICION. Un remito confirmado ya movio el stock, asi que corregirlo
 * seria corregir el stock por la ventana de atras. Por eso este formulario es
 * solo de alta. El dia que haga falta anular uno, va a ser un movimiento de
 * ajuste, no un borrado.
 *
 * EL RESUMEN PREVIO. Antes de confirmar se muestra, item por item, en cuanto va
 * a quedar el stock de cada uno. Es la unica forma de que el administrador vea
 * lo que va a pasar antes de que pase: una vez confirmado no se vuelve atras.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
import CIcon from '@coreui/icons-react';
import { cilPlus, cilTrash } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarItems } from '@/servicios/inventario.js';
import { hoyTexto } from '@/utils/fechas.js';

/** El largo del numero de remito: "0001-00012345" son 13 caracteres. */
const LARGO_NUMERO = 13;

/** Un renglon vacio, con su numero para que React no confunda las filas. */
let proximoRenglon = 0;
function renglonVacio() {
  proximoRenglon += 1;
  return { clave: proximoRenglon, codigo: '', cantidad: '' };
}

export default function FormularioRemito({ onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [proveedor, setProveedor] = useState('');
  const [numero, setNumero] = useState('');
  const [fechaRecepcion, setFechaRecepcion] = useState(hoyTexto());
  const [observaciones, setObservaciones] = useState('');

  // El primer renglon lleva la clave 0 fija: si saliera del contador, el
  // servidor y el navegador le darian numeros distintos y React avisaria.
  const [renglones, setRenglones] = useState(() => [{ clave: 0, codigo: '', cantidad: '' }]);

  const [catalogo, setCatalogo] = useState([]);
  const [cargandoCatalogo, setCargandoCatalogo] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // El catalogo se trae una sola vez: es lo que se puede ingresar.
  useEffect(() => {
    listarItems()
      .then(setCatalogo)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargandoCatalogo(false));
  }, []);

  const catalogoVacio = !cargandoCatalogo && catalogo.length === 0;

  const hoy = hoyTexto();

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!proveedor.trim()) {
      encontrados.proveedor = 'Indicá quién entregó la mercadería.';
    }

    // Como el del papel: "0001-00012345", sólo números y guion, hasta 13.
    const numeroLimpio = numero.trim();
    if (!numeroLimpio) {
      encontrados.numero = 'Indicá el número de remito.';
    } else if (!/^[0-9-]+$/.test(numeroLimpio)) {
      encontrados.numero = 'Sólo números y guion.';
    } else if (numeroLimpio.length > LARGO_NUMERO) {
      encontrados.numero = `Hasta ${LARGO_NUMERO} caracteres.`;
    }

    if (!fechaRecepcion) {
      encontrados.fechaRecepcion = 'Indicá cuándo se recibió.';
    } else if (fechaRecepcion > hoy) {
      encontrados.fechaRecepcion = 'La fecha de recepción no puede ser posterior a hoy.';
    }

    // Los renglones: se marca cada uno por separado, con su propia clave.
    const codigosVistos = new Set();
    let hayAlgunItem = false;

    renglones.forEach((renglon) => {
      const cantidad = String(renglon.cantidad).trim();

      if (!renglon.codigo) {
        // Un renglon del todo vacio no molesta: se descarta al confirmar.
        if (cantidad !== '') encontrados[`item-${renglon.clave}`] = 'Elegí el ítem.';
        return;
      }

      hayAlgunItem = true;

      if (codigosVistos.has(renglon.codigo)) {
        encontrados[`item-${renglon.clave}`] = 'Este ítem ya está en otro renglón.';
      }
      codigosVistos.add(renglon.codigo);

      if (cantidad === '') {
        encontrados[`cantidad-${renglon.clave}`] = 'Falta la cantidad.';
      } else if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
        encontrados[`cantidad-${renglon.clave}`] = 'Tiene que ser un número entero mayor que cero.';
      }
    });

    if (!hayAlgunItem) {
      encontrados.items = 'El remito tiene que tener al menos un ítem.';
    }

    return encontrados;
  }, [proveedor, numero, fechaRecepcion, hoy, renglones]);

  const hayErrores = Object.keys(errores).length > 0;

  function cambiarRenglon(clave, campo, valor) {
    setRenglones((actuales) =>
      actuales.map((renglon) => (renglon.clave === clave ? { ...renglon, [campo]: valor } : renglon))
    );
  }

  function agregarRenglon() {
    setRenglones((actuales) => [...actuales, renglonVacio()]);
  }

  function quitarRenglon(clave) {
    setRenglones((actuales) => {
      const quedan = actuales.filter((renglon) => renglon.clave !== clave);
      // Nunca se queda sin ningun renglon: la tabla vacia no se entiende.
      return quedan.length > 0 ? quedan : [renglonVacio()];
    });
  }

  /** Los renglones cargados de verdad, con el item del catalogo al lado. */
  const cargados = useMemo(
    () =>
      renglones
        .filter((renglon) => renglon.codigo && String(renglon.cantidad).trim() !== '')
        .map((renglon) => {
          const item = catalogo.find((fila) => fila.codigo === renglon.codigo);
          const cantidad = Number(renglon.cantidad);

          return {
            clave: renglon.clave,
            codigo: renglon.codigo,
            nombre: item?.nombre ?? renglon.codigo,
            stockActual: item?.stockActual ?? 0,
            cantidad,
            stockNuevo: (item?.stockActual ?? 0) + cantidad,
          };
        }),
    [renglones, catalogo]
  );

  const totalUnidades = cargados.reduce((suma, renglon) => suma + renglon.cantidad, 0);

  function revisarYConfirmar(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setConfirmando(true);
  }

  async function confirmar() {
    setError('');
    setGuardando(true);

    try {
      const remito = await onGuardar({
        proveedor: proveedor.trim(),
        numero: numero.trim(),
        fechaRecepcion,
        observaciones: observaciones.trim() || null,
        items: cargados.map((renglon) => ({ codigo: renglon.codigo, cantidad: renglon.cantidad })),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: `Se registró el remito y se actualizó el stock de ${cargados.length} ${
          cargados.length === 1 ? 'ítem' : 'ítems'
        }.`,
      });

      router.push(`/inventario/remitos/${remito.id}`);
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setConfirmando(false);
      setGuardando(false);
    }
  }

  // El catalogo entero: es lo unico que se puede ingresar por remito.
  const opcionesItems = catalogo.map((item) => ({
    valor: item.codigo,
    texto: `${item.codigo} — ${item.nombre}`,
  }));

  if (catalogoVacio) {
    return (
      <CCard>
        <CCardBody>
          <Aviso
            color="warning"
            mensaje="Todavía no hay materiales ni herramientas en el catálogo del depósito. El remito no los da de alta: primero hay que cargarlos."
          />
          <p className="mb-0">
            Cargalos primero como <Link href="/inventario/materiales/agregar">Material</Link> o{' '}
            <Link href="/inventario/herramientas/agregar">Herramienta</Link>.
          </p>
        </CCardBody>
      </CCard>
    );
  }

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={revisarYConfirmar}>
          <h2 className="sigma-seccion-titulo">¿De dónde vino?</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="proveedor"
              etiqueta="Proveedor"
              valor={proveedor}
              alCambiar={setProveedor}
              placeholder="Electricidad del Norte S.A."
              obligatorio
              maxLength={150}
              ancho={26}
              revisado={revisado}
              error={errores.proveedor}
            />

            <Campo
              id="numero"
              etiqueta="Número de remito"
              valor={numero}
              alCambiar={setNumero}
              placeholder="0001-00012345"
              obligatorio
              maxLength={LARGO_NUMERO}
              ancho={14}
              revisado={revisado}
              error={errores.numero}
            />

            <Campo
              id="fechaRecepcion"
              etiqueta="Fecha de recepción"
              tipoHtml="date"
              valor={fechaRecepcion}
              alCambiar={setFechaRecepcion}
              max={hoy}
              obligatorio
              revisado={revisado}
              error={errores.fechaRecepcion}
            />
          </div>

          <h2 className="sigma-seccion-titulo">¿Qué trajo?</h2>

          {/*
            La tabla de renglones scrollea sola si no entra a lo ancho: el resto
            de la pantalla no se desacomoda en un celular.
          */}
          <div className="table-responsive mb-2">
            <CTable align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ítem del catálogo</CTableHeaderCell>
                  <CTableHeaderCell>Stock actual</CTableHeaderCell>
                  <CTableHeaderCell>Cantidad que ingresa</CTableHeaderCell>
                  <CTableHeaderCell className="text-end">Quitar</CTableHeaderCell>
                </CTableRow>
              </CTableHead>

              <CTableBody>
                {renglones.map((renglon) => {
                  const item = catalogo.find((fila) => fila.codigo === renglon.codigo);

                  return (
                    <CTableRow key={renglon.clave}>
                      <CTableDataCell>
                        <Campo
                          id={`item-${renglon.clave}`}
                          etiqueta="Ítem"
                          tipo="lista"
                          valor={renglon.codigo}
                          alCambiar={(valor) => cambiarRenglon(renglon.clave, 'codigo', valor)}
                          opciones={opcionesItems}
                          placeholder={cargandoCatalogo ? 'Cargando...' : 'Buscar por código o nombre'}
                          deshabilitado={cargandoCatalogo}
                          ancho={30}
                          etiquetaOculta
                          revisado={revisado}
                          error={errores[`item-${renglon.clave}`]}
                        />
                      </CTableDataCell>

                      <CTableDataCell>
                        <span className="text-body-secondary">
                          {item ? item.stockActual : '-'}
                        </span>
                      </CTableDataCell>

                      <CTableDataCell>
                        <Campo
                          id={`cantidad-${renglon.clave}`}
                          etiqueta="Cantidad"
                          tipo="numero"
                          valor={renglon.cantidad}
                          alCambiar={(valor) => cambiarRenglon(renglon.clave, 'cantidad', valor)}
                          min={1}
                          ancho={5}
                          etiquetaOculta
                          revisado={revisado}
                          error={errores[`cantidad-${renglon.clave}`]}
                        />
                      </CTableDataCell>

                      <CTableDataCell className="text-end">
                        <CButton
                          type="button"
                          variant="ghost"
                          color="danger"
                          className="btn-icono"
                          onClick={() => quitarRenglon(renglon.clave)}
                          title="Quitar el renglón"
                        >
                          <CIcon icon={cilTrash} />
                        </CButton>
                      </CTableDataCell>
                    </CTableRow>
                  );
                })}
              </CTableBody>
            </CTable>
          </div>

          {revisado && errores.items && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error">{errores.items}</p>
          )}

          <div className="d-flex flex-wrap align-items-center gap-3 mb-4">
            <CButton type="button" color="secondary" variant="outline" size="sm" onClick={agregarRenglon}>
              <CIcon icon={cilPlus} size="sm" className="me-1" />
              Agregar
            </CButton>

            <small className="text-body-secondary">
              ¿No encontrás el ítem? El remito no da de alta: cargalo primero como{' '}
              <Link href="/inventario/materiales/agregar">Material</Link> o{' '}
              <Link href="/inventario/herramientas/agregar">Herramienta</Link>.
            </small>
          </div>

          <h2 className="sigma-seccion-titulo">Observaciones</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="observaciones"
              etiqueta="Observaciones"
              tipo="area"
              valor={observaciones}
              alCambiar={setObservaciones}
              maxLength={500}
              revisado={revisado}
            />
          </div>

          {cargados.length > 0 && (
            <p className="text-body-secondary">
              Van a ingresar <strong>{totalUnidades}</strong>{' '}
              {totalUnidades === 1 ? 'unidad' : 'unidades'} en{' '}
              <strong>{cargados.length}</strong> {cargados.length === 1 ? 'ítem' : 'ítems'}.
            </p>
          )}

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a intentar.
            </p>
          )}

          <BotonesAccion procesando={guardando} hrefCancelar="/inventario/remitos" className="mt-4" />
        </form>
      </CCardBody>

      {/*
        El resumen previo. No es un formulario en un modal (eso no se hace en
        SIGMA): es la confirmacion de algo que no tiene vuelta atras, igual que
        DialogoEliminar.
      */}
      <CModal
        visible={confirmando}
        onClose={() => setConfirmando(false)}
        alignment="center"
        size="lg"
      >
        <CModalHeader>
          <CModalTitle>Confirmar el ingreso</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <p>
            Remito de <strong>{proveedor.trim()}</strong>
            {numero.trim() && <> (N.º {numero.trim()})</>}, recibido el{' '}
            <strong>{fechaRecepcion.split('-').reverse().join('/')}</strong>.
          </p>

          <div className="table-responsive">
            <CTable small align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Ítem</CTableHeaderCell>
                  <CTableHeaderCell>Ingresa</CTableHeaderCell>
                  <CTableHeaderCell>Stock</CTableHeaderCell>
                </CTableRow>
              </CTableHead>
              <CTableBody>
                {cargados.map((renglon) => (
                  <CTableRow key={renglon.clave}>
                    <CTableDataCell>
                      <span className="fw-semibold">{renglon.codigo}</span>
                      <span className="text-body-secondary"> — {renglon.nombre}</span>
                    </CTableDataCell>
                    <CTableDataCell>+{renglon.cantidad}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {renglon.stockActual} → <strong>{renglon.stockNuevo}</strong>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>

          <p className="text-body-secondary mt-3 mb-0">
            Al guardar, el stock sube y el movimiento queda registrado. El remito no se
            puede modificar después.
          </p>
        </CModalBody>

        <CModalFooter>
          <BotonesAccion
            procesando={guardando}
            alAceptar={confirmar}
            alCancelar={() => setConfirmando(false)}
          />
        </CModalFooter>
      </CModal>
    </CCard>
  );
}
