'use client';

/**
 * Alta y edicion de un material o de una herramienta del deposito (HU-15).
 *
 * Los dos se cargan con el mismo formulario porque comparten casi todos los
 * datos; lo que los separa es la clase, y de la clase dependen dos campos:
 *
 *   - un MATERIAL se consume, asi que lleva stock minimo y, si vence, fecha de
 *     vencimiento;
 *   - una HERRAMIENTA se presta y se devuelve, asi que no lleva ninguno de los
 *     dos.
 *
 * Lo que el formulario NO pide: el estado. Lo pone el sistema (todo lo que
 * entra al deposito entra disponible) y despues lo mueven los prestamos, no
 * esta pantalla. En la edicion se muestra, para verlo, pero no se toca.
 *
 * Los campos usan <Campo>, asi que las cajas miden lo que mide su contenido y
 * la validacion marca cada campo en chico, sin pintar toda la caja de verde o
 * de rojo. Ver src/componentes/formulario/Campo.js.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposInventario } from '@/servicios/inventario.js';
import { hoyTexto } from '@/utils/fechas.js';

const CLASES = ['Material', 'Herramienta'];

/** "Se agrego el material" / "Se agrego la herramienta". */
function elArticulo(clase) {
  return clase === 'Herramienta' ? 'la herramienta' : 'el material';
}

export default function FormularioMaterialHerramienta({ articulo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(articulo);

  const [codigo, setCodigo] = useState(articulo?.codigo ?? '');
  const [nombre, setNombre] = useState(articulo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(articulo?.descripcion ?? '');
  const [clase, setClase] = useState(articulo?.clase ?? 'Material');
  const [idTipo, setIdTipo] = useState(articulo?.idTipo ?? '');
  const [stockMinimo, setStockMinimo] = useState(articulo?.stockMinimo ?? '');
  const [fechaVencimiento, setFechaVencimiento] = useState(
    articulo?.fechaVencimiento?.slice(0, 10) ?? ''
  );

  /*
   * Los tipos que se trajeron y de que clase son. Van juntos a proposito: asi
   * se sabe si la lista que hay en pantalla es la de la clase elegida o la de
   * la anterior, sin tener que llevar aparte un "cargando" que se desacomoda
   * cuando alguien cambia la clase dos veces seguidas.
   */
  const [tiposTraidos, setTiposTraidos] = useState({ clase: null, lista: [] });

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const esMaterial = clase === 'Material';

  // Los tipos son distintos para materiales y para herramientas, asi que la
  // lista se vuelve a pedir cada vez que se cambia la clase.
  useEffect(() => {
    // Si se vuelve a cambiar la clase antes de que conteste la API, la
    // respuesta vieja se descarta: si no, pisaria a la nueva.
    let vigente = true;

    listarTiposInventario(clase)
      .then((lista) => {
        if (vigente) setTiposTraidos({ clase, lista });
      })
      .catch((fallo) => {
        if (vigente) setError(fallo.message);
      });

    return () => {
      vigente = false;
    };
  }, [clase]);

  const cargandoTipos = tiposTraidos.clase !== clase;
  const tipos = cargandoTipos ? [] : tiposTraidos.lista;

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const hoy = hoyTexto();
  const vencimientoOriginal = articulo?.fechaVencimiento?.slice(0, 10) ?? '';

  /*
   * Un material que se carga hoy no puede venir ya vencido: la fecha mas
   * temprana que se puede elegir es hoy (decision del 23/09/2026).
   *
   * La excepcion es editar algo que YA estaba vencido en el deposito: ahi el
   * minimo es su propia fecha, porque si no no se podria guardar ningun otro
   * cambio de ese material. Es el mismo criterio que usan las fechas de una
   * tarea de la OT (ver FormularioTareaOT.js).
   */
  const minimoVencimiento =
    vencimientoOriginal && vencimientoOriginal < hoy ? vencimientoOriginal : hoy;

  const errores = useMemo(() => {
    const encontrados = {};

    if (!codigo.trim()) encontrados.codigo = 'El código es obligatorio y no se puede repetir.';
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    if (!idTipo) encontrados.idTipo = 'Elegí el tipo.';
    if (esMaterial && String(stockMinimo).trim() === '') {
      encontrados.stockMinimo = 'Indicá desde qué cantidad hay que reponer.';
    }

    /*
     * El almanaque ya apaga los dias de antes, pero el formulario es noValidate
     * y la fecha se puede escribir a mano en los casilleros: el que corta de
     * verdad es este control.
     */
    if (esMaterial && fechaVencimiento && fechaVencimiento < minimoVencimiento) {
      encontrados.fechaVencimiento = 'La fecha de vencimiento no puede ser anterior a hoy.';
    }

    return encontrados;
  }, [codigo, nombre, idTipo, esMaterial, stockMinimo, fechaVencimiento, minimoVencimiento]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);
    try {
      await onGuardar({
        codigo: codigo.trim(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        clase,
        idTipo: Number(idTipo),
        stockMinimo: esMaterial ? Number(stockMinimo) : null,
        fechaVencimiento: esMaterial ? fechaVencimiento || null : null,
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó ${elArticulo(clase)} "${nombre}".`,
      });
      router.push('/inventario');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const opcionesTipos = tipos.map((tipo) => ({
    valor: tipo.idTipo,
    texto: tipo.nombre,
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">¿Qué es?</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="clase"
              etiqueta="Clase"
              tipo="lista"
              valor={clase}
              alCambiar={(valor) => {
                setClase(valor);
                // Los tipos de material no sirven para una herramienta.
                setIdTipo('');
              }}
              opciones={CLASES.map((texto) => ({ valor: texto, texto }))}
              placeholder="Elegir clase"
              obligatorio
              deshabilitado={editando}
              ancho={14}
              revisado={revisado}
            />

            <Campo
              id="idTipo"
              etiqueta="Tipo"
              tipo="lista"
              valor={idTipo}
              alCambiar={setIdTipo}
              opciones={opcionesTipos}
              placeholder={cargandoTipos ? 'Cargando...' : 'Elegir tipo'}
              deshabilitado={cargandoTipos}
              obligatorio
              ancho={18}
              revisado={revisado}
              error={errores.idTipo}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Datos</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="codigo"
              etiqueta="Código"
              valor={codigo}
              alCambiar={setCodigo}
              placeholder="MAT-014"
              obligatorio
              maxLength={50}
              deshabilitado={editando}
              ancho={10}
              revisado={revisado}
              error={errores.codigo}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder={esMaterial ? 'Cable 2.5 mm' : 'Taladro percutor'}
              obligatorio
              maxLength={150}
              ancho={22}
              revisado={revisado}
              error={errores.nombre}
            />

            {editando && (
              <Campo
                id="estado"
                etiqueta="Estado"
                valor={articulo.estado ?? 'Disponible'}
                alCambiar={() => {}}
                soloLectura
                deshabilitado
                ancho={12}
              />
            )}

            <Campo
              id="descripcion"
              etiqueta="Descripción"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Opcional: marca, medida, cualquier dato que ayude a reconocerlo."
              maxLength={300}
              revisado={revisado}
            />
          </div>

          {/* Solo un material se consume y se vence: una herramienta, no. */}
          {esMaterial && (
            <>
              <h2 className="sigma-seccion-titulo">Control de existencias</h2>

              <div className="sigma-campos mb-4">
                <Campo
                  id="stockMinimo"
                  etiqueta="Stock mínimo"
                  tipo="numero"
                  min="0"
                  valor={stockMinimo}
                  alCambiar={setStockMinimo}
                  placeholder="10"
                  obligatorio
                  ancho={6}
                  revisado={revisado}
                  error={errores.stockMinimo}
                />

                <Campo
                  id="fechaVencimiento"
                  etiqueta="Vence el"
                  tipoHtml="date"
                  valor={fechaVencimiento}
                  alCambiar={setFechaVencimiento}
                  min={minimoVencimiento}
                  revisado={revisado}
                  error={errores.fechaVencimiento}
                />
              </div>
            </>
          )}

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/inventario" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
