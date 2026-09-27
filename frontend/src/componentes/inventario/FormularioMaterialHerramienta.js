'use client';

/**
 * Alta y edicion de un material o de una herramienta del deposito (HU-15).
 * Trabaja sobre las tablas material y herramienta.
 *
 * La clase (`clase="Material"` o `clase="Herramienta"`) la fija la pantalla
 * que usa este formulario, no la persona: /inventario/materiales solo da de
 * alta materiales, /inventario/herramientas solo herramientas. Por eso el
 * formulario no la pregunta, y de la clase dependen dos campos:
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

/** "Se agrego el material" / "Se agrego la herramienta". */
function elArticulo(clase) {
  return clase === 'Herramienta' ? 'la herramienta' : 'el material';
}

/** A donde vuelve el formulario despues de guardar o al cancelar. */
function pantallaDeVuelta(clase) {
  return clase === 'Herramienta' ? '/inventario/herramientas' : '/inventario/materiales';
}

export default function FormularioMaterialHerramienta({ clase, articulo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(articulo);
  const esMaterial = clase === 'Material';
  const volverA = pantallaDeVuelta(clase);

  const [codigo, setCodigo] = useState(articulo?.codigo ?? '');
  const [nombre, setNombre] = useState(articulo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(articulo?.descripcion ?? '');
  const [idTipo, setIdTipo] = useState(articulo?.idTipo ?? '');
  const [stockMinimo, setStockMinimo] = useState(articulo?.stockMinimo ?? '');
  const [fechaVencimiento, setFechaVencimiento] = useState(
    articulo?.fechaVencimiento?.slice(0, 10) ?? ''
  );

  const [tipos, setTipos] = useState([]);
  const [cargandoTipos, setCargandoTipos] = useState(true);
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Las categorias son las del tipo de item de esta pantalla: se piden una
  // sola vez, porque la clase no cambia mientras el formulario esta abierto.
  useEffect(() => {
    listarTiposInventario(clase)
      .then(setTipos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargandoTipos(false));
  }, [clase]);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!codigo.trim()) encontrados.codigo = 'El código es obligatorio y no se puede repetir.';
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    if (!idTipo) encontrados.idTipo = 'Elegí la categoría.';
    if (esMaterial && String(stockMinimo).trim() === '') {
      encontrados.stockMinimo = 'Indicá desde qué cantidad hay que reponer.';
    }

    return encontrados;
  }, [codigo, nombre, idTipo, esMaterial, stockMinimo]);

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
      router.push(volverA);
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
          <div className="sigma-campos mb-4">
            <Campo
              id="idTipo"
              etiqueta="Categoría"
              tipo="lista"
              valor={idTipo}
              alCambiar={setIdTipo}
              opciones={opcionesTipos}
              placeholder={cargandoTipos ? 'Cargando...' : 'Elegir categoría'}
              deshabilitado={cargandoTipos}
              obligatorio
              ancho={18}
              revisado={revisado}
              error={errores.idTipo}
            />

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
              ayuda={editando ? 'El código no se puede cambiar.' : ''}
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

            {/* El estado solo existe para una herramienta: un material no lo tiene. */}
            {editando && !esMaterial && (
              <Campo
                id="estado"
                etiqueta="Estado"
                valor={articulo.estado ?? 'Disponible'}
                alCambiar={() => {}}
                soloLectura
                deshabilitado
                ancho={12}
                ayuda="Lo maneja el depósito con los préstamos y los consumos."
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
                  tipoHtml="number"
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
                  revisado={revisado}
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
            <BotonEnlace href={volverA} color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
