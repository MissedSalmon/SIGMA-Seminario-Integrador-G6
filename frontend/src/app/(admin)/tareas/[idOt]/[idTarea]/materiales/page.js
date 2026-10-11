'use client';

/**
 * /tareas/[idOt]/[idTarea]/materiales - Registrar los materiales usados (HU-22).
 *
 * Mismo armado que el ingreso por remito, pero al revés: cada renglón es un
 * material del depósito y la cantidad que se usó. Al guardar, el stock baja.
 *
 * - No deja usar más de lo que hay: la cantidad tiene como tope el stock
 *   actual, y la base lo vuelve a controlar al guardar (si otro técnico se
 *   llevó unidades en el medio, avisa y no descuenta nada).
 * - Antes de guardar se muestra un resumen con cómo queda el stock de cada
 *   material: una vez registrado, el consumo no se deshace desde acá.
 * - Si se registra otra vez un material que la tarea ya tenía, se suma.
 */
import { use, useEffect, useMemo, useState } from 'react';
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

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarMaterialesDelDeposito, obtenerMiTarea, registrarMateriales } from '@/servicios/tareas.js';

/** Un renglón vacío, con su número para que React no confunda las filas. */
let proximoRenglon = 0;
function renglonVacio() {
  proximoRenglon += 1;
  return { clave: proximoRenglon, codigo: '', cantidad: '' };
}

export default function PantallaRegistrarMateriales({ params }) {
  const { idOt, idTarea } = use(params);
  const router = useRouter();
  const { mostrarToast } = useToast();
  const volverA = `/tareas/${idOt}/${idTarea}`;

  const [tarea, setTarea] = useState(null);
  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);

  // El primer renglón lleva la clave 0 fija, para que el servidor y el
  // navegador no le den números distintos.
  const [renglones, setRenglones] = useState(() => [{ clave: 0, codigo: '', cantidad: '' }]);
  const [revisado, setRevisado] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([obtenerMiTarea(idOt, idTarea), listarMaterialesDelDeposito()])
      .then(([datosTarea, datosMateriales]) => {
        setTarea(datosTarea);
        setMateriales(datosMateriales);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [idOt, idTarea]);

  const enEjecucion = tarea?.estado === 'En ejecución';
  const conStock = materiales.filter((material) => material.stock > 0);

  const opciones = conStock.map((material) => ({
    valor: material.codigo,
    texto: `${material.codigo} — ${material.nombre} (quedan ${material.stock})`,
  }));

  const stockDe = (codigo) => materiales.find((material) => material.codigo === codigo)?.stock ?? null;

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahí en más se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};
    const vistos = new Set();
    let hayAlguno = false;

    renglones.forEach((renglon) => {
      const cantidad = String(renglon.cantidad).trim();

      if (!renglon.codigo) {
        // Un renglón del todo vacío no molesta: se descarta al guardar.
        if (cantidad !== '') encontrados[`material-${renglon.clave}`] = 'Elegí el material.';
        return;
      }

      hayAlguno = true;
      if (vistos.has(renglon.codigo)) {
        encontrados[`material-${renglon.clave}`] = 'Este material ya está en otro renglón.';
      }
      vistos.add(renglon.codigo);

      const stock = materiales.find((material) => material.codigo === renglon.codigo)?.stock ?? 0;
      if (cantidad === '') {
        encontrados[`cantidad-${renglon.clave}`] = 'Falta la cantidad.';
      } else if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0) {
        encontrados[`cantidad-${renglon.clave}`] = 'Tiene que ser un número entero mayor que cero.';
      } else if (Number(cantidad) > stock) {
        encontrados[`cantidad-${renglon.clave}`] = `Quedan ${stock}: no podés usar más.`;
      }
    });

    if (!hayAlguno) encontrados.materiales = 'Cargá al menos un material.';

    return encontrados;
  }, [renglones, materiales]);

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
      return quedan.length > 0 ? quedan : [renglonVacio()];
    });
  }

  /** Los renglones cargados de verdad, con cómo queda el stock. */
  const cargados = useMemo(
    () =>
      renglones
        .filter((renglon) => renglon.codigo && String(renglon.cantidad).trim() !== '')
        .map((renglon) => {
          const material = materiales.find((fila) => fila.codigo === renglon.codigo);
          const cantidad = Number(renglon.cantidad);
          return {
            clave: renglon.clave,
            codigo: renglon.codigo,
            nombre: material?.nombre ?? renglon.codigo,
            cantidad,
            stockActual: material?.stock ?? 0,
            stockNuevo: (material?.stock ?? 0) - cantidad,
          };
        }),
    [renglones, materiales]
  );

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
      await registrarMateriales(
        idOt,
        idTarea,
        cargados.map((renglon) => ({ codigo: renglon.codigo, cantidad: renglon.cantidad }))
      );
      mostrarToast({
        tipo: 'exito',
        mensaje:
          cargados.length === 1
            ? 'Se registró el material y se descontó del stock.'
            : `Se registraron ${cargados.length} materiales y se descontaron del stock.`,
      });
      router.push(volverA);
    } catch (fallo) {
      // Si no alcanzó el stock (otro técnico se llevó unidades), se vuelve a
      // traer el stock para que los topes queden al día.
      setError(fallo.message);
      setConfirmando(false);
      setGuardando(false);
      listarMaterialesDelDeposito().then(setMateriales).catch(() => {});
    }
  }

  return (
    <>
      <EncabezadoPagina titulo="Registrar materiales" />

      <Aviso mensaje={error} onCerrar={() => setError('')} />

      {cargando ? (
        <Cargando texto="Cargando el depósito..." />
      ) : (
        tarea && (
          <CCard className="mb-4">
            <CCardBody>
              <p className="mb-4">
                Tarea {idTarea} de la OT #{idOt}: <strong>{tarea.descripcion}</strong>
              </p>

              {!enEjecucion ? (
                <Aviso
                  color="warning"
                  mensaje={`La tarea está ${tarea.estado.toLowerCase()}. Los materiales se registran mientras está en ejecución.`}
                />
              ) : conStock.length === 0 ? (
                <Aviso color="warning" mensaje="No hay materiales con stock en el depósito." />
              ) : (
                <form onSubmit={revisarYConfirmar} noValidate>
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h2 className="sigma-seccion-titulo mb-0">Materiales utilizados</h2>
                    <CButton type="button" color="primary" size="sm" onClick={agregarRenglon}>
                      <CIcon icon={cilPlus} size="sm" className="me-1" />
                      Agregar
                    </CButton>
                  </div>

                  {/* La tabla scrollea sola si no entra a lo ancho, como en un celular. */}
                  <div className="table-responsive mb-4">
                    <CTable align="middle" className="mb-0">
                      <CTableHead>
                        <CTableRow>
                          <CTableHeaderCell>Material</CTableHeaderCell>
                          <CTableHeaderCell className="text-center">Stock</CTableHeaderCell>
                          <CTableHeaderCell>Cantidad usada</CTableHeaderCell>
                          <CTableHeaderCell className="text-end">Quitar</CTableHeaderCell>
                        </CTableRow>
                      </CTableHead>

                      <CTableBody>
                        {renglones.map((renglon) => {
                          const stock = stockDe(renglon.codigo);

                          return (
                            <CTableRow key={renglon.clave}>
                              <CTableDataCell>
                                <Campo
                                  id={`material-${renglon.clave}`}
                                  etiqueta="Material"
                                  tipo="lista"
                                  valor={renglon.codigo}
                                  alCambiar={(valor) => cambiarRenglon(renglon.clave, 'codigo', valor)}
                                  opciones={opciones}
                                  placeholder="Buscar por código o nombre"
                                  ancho={32}
                                  etiquetaOculta
                                  revisado={revisado}
                                  error={errores[`material-${renglon.clave}`]}
                                />
                              </CTableDataCell>

                              <CTableDataCell className="text-center">
                                <span className="text-body-secondary">{stock ?? '-'}</span>
                              </CTableDataCell>

                              <CTableDataCell>
                                <Campo
                                  id={`cantidad-${renglon.clave}`}
                                  etiqueta="Cantidad"
                                  tipo="numero"
                                  valor={renglon.cantidad}
                                  alCambiar={(valor) => cambiarRenglon(renglon.clave, 'cantidad', valor)}
                                  min={1}
                                  max={stock ?? undefined}
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
                                  aria-label="Quitar el renglón"
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

                  {revisado && errores.materiales && (
                    <p className="sigma-campo-mensaje sigma-campo-mensaje--error">{errores.materiales}</p>
                  )}

                  {revisado && hayErrores && (
                    <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
                      Revisá los campos marcados y volvé a intentar.
                    </p>
                  )}

                  <BotonesAccion procesando={guardando} hrefCancelar={volverA} className="mt-4" />
                </form>
              )}
            </CCardBody>
          </CCard>
        )
      )}

      {/* El resumen previo: el consumo descuenta stock y no se deshace desde acá. */}
      <CModal visible={confirmando} onClose={() => !guardando && setConfirmando(false)} alignment="center" size="lg">
        <CModalHeader>
          <CModalTitle>Confirmar los materiales</CModalTitle>
        </CModalHeader>

        <CModalBody>
          <div className="table-responsive">
            <CTable small align="middle" className="mb-0">
              <CTableHead>
                <CTableRow>
                  <CTableHeaderCell>Material</CTableHeaderCell>
                  <CTableHeaderCell>Usás</CTableHeaderCell>
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
                    <CTableDataCell>{renglon.cantidad}</CTableDataCell>
                    <CTableDataCell className="text-body-secondary">
                      {renglon.stockActual} → <strong>{renglon.stockNuevo}</strong>
                    </CTableDataCell>
                  </CTableRow>
                ))}
              </CTableBody>
            </CTable>
          </div>
        </CModalBody>

        <CModalFooter>
          <BotonesAccion procesando={guardando} alAceptar={confirmar} alCancelar={() => setConfirmando(false)} />
        </CModalFooter>
      </CModal>
    </>
  );
}
