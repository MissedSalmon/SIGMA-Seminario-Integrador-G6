'use client';

/**
 * Formulario de alta y de edicion de un activo (HU-7).
 *
 * Tres cosas que conviene saber antes de tocarlo:
 *
 * 1. El codigo de inventario identifica fisicamente al activo, asi que en la
 *    edicion se muestra pero no se puede cambiar.
 * 2. Cambiar el espacio ES reubicar el activo. No hay un boton aparte: se elige
 *    otro espacio y se guarda, y el backend anota la fecha del movimiento.
 * 3. El estado solo aparece en la edicion, porque un activo nuevo siempre nace
 *    Operativo. Y solo se puede elegir entre Operativo y Fuera de servicio:
 *    "En mantenimiento" lo pone la orden de trabajo y "Retirado" se pone dando
 *    de baja desde el listado.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';

/** Los dos estados que elige el administrador; los otros los pone el sistema. */
const ESTADOS_A_MANO = ['Operativo', 'Fuera de servicio'];

/**
 * La fecha de hoy como "2026-09-14", que es el formato que entiende un
 * <input type="date">.
 *
 * Se arma con el dia, el mes y el anio de la maquina, y no con toISOString(),
 * que da la fecha en UTC: despues de las 21 de Argentina eso ya es el dia
 * siguiente, y el campo dejaria elegir manana.
 */
function hoy() {
  const ahora = new Date();
  const mes = String(ahora.getMonth() + 1).padStart(2, '0');
  const dia = String(ahora.getDate()).padStart(2, '0');
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/** De "2026-08-30" arma "30/08/2026", que es como se lee una fecha aca. */
function comoFecha(texto) {
  if (!texto) return '';
  const [anio, mes, dia] = String(texto).slice(0, 10).split('-');
  return `${dia}/${mes}/${anio}`;
}

export default function FormularioActivo({ activo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(activo);

  const [codigo, setCodigo] = useState(activo?.codigo ?? '');
  const [idTipoActivo, setIdTipoActivo] = useState(activo?.idTipoActivo ?? '');
  const [idEspacio, setIdEspacio] = useState(activo?.espacio_id ?? '');
  const [fechaAlta, setFechaAlta] = useState(
    activo?.fechaAlta ? String(activo.fechaAlta).slice(0, 10) : ''
  );
  const [estado, setEstado] = useState(activo?.estado ?? 'Operativo');

  const [tipos, setTipos] = useState([]);
  const [espacios, setEspacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarTiposActivos(), listarEspacios()])
      .then(([listaTipos, listaEspacios]) => {
        setTipos(listaTipos);
        setEspacios(listaEspacios);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!codigo.trim()) encontrados.codigo = 'El codigo de inventario es obligatorio.';
    if (!idTipoActivo) encontrados.idTipoActivo = 'Elegi el tipo de activo.';
    if (!idEspacio) encontrados.idEspacio = 'Elegi donde esta el activo.';

    /*
     * La fecha de alta puede ser de antes, pero nunca de despues de hoy:
     * todavia no paso.
     *
     * Las dos fechas estan en formato "2026-09-14", asi que alcanza con
     * compararlas como texto: ordenan igual que en el almanaque.
     *
     * El tope tambien va en el <input type="date"> (max), que apaga los dias
     * futuros en el almanaque del navegador. Pero el formulario es noValidate,
     * asi que la fecha se puede escribir a mano igual: el que corta de verdad
     * es este control.
     */
    if (fechaAlta && fechaAlta > hoy()) {
      encontrados.fechaAlta = 'La fecha de alta no puede ser posterior a hoy.';
    }

    return encontrados;
  }, [codigo, idTipoActivo, idEspacio, fechaAlta]);

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
        idTipoActivo: Number(idTipoActivo),
        espacio_id: Number(idEspacio),
        fechaAlta: fechaAlta || null,
        ...(editando ? { estado } : {}),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios del activo "${codigo}".`
          : `Se agrego el activo "${codigo}".`,
      });

      router.push('/activos');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <CCard>
        <CCardBody>
          <Cargando texto="Cargando el formulario..." />
        </CCardBody>
      </CCard>
    );
  }

  // Sin tipo y sin espacio no se puede cargar un activo: los dos son obligatorios.
  if (tipos.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un tipo de activo: todo activo pertenece a uno."
      />
    );
  }

  if (espacios.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un espacio: todo activo esta ubicado en uno."
      />
    );
  }

  // Un activo retirado se conserva como historial y no se toca mas.
  if (activo?.estado === 'Retirado') {
    return (
      <>
        <Aviso
          color="warning"
          mensaje={`El activo "${activo.codigo}" esta retirado, asi que no se puede modificar. Se conserva para no perder su historial de intervenciones.`}
        />
        <BotonEnlace href="/activos" color="secondary" variante="outline">
          Volver al listado
        </BotonEnlace>
      </>
    );
  }

  const opcionesTipos = tipos.map((tipo) => ({
    valor: tipo.idTipoActivo,
    texto: tipo.nombre,
  }));

  const opcionesEspacios = espacios.map((unEspacio) => ({
    valor: unEspacio.idEspacio,
    texto: `${unEspacio.nombreEdificio} - ${unEspacio.nombre || unEspacio.espacio_num}`,
  }));

  /*
   * El desplegable de estado ofrece los dos que el administrador puede elegir.
   * Si el activo esta En mantenimiento (lo puso una OT), se agrega ese estado a
   * la lista: asi se ve el estado real y no se pisa sin querer al guardar.
   */
  const estadoAutomatico = !ESTADOS_A_MANO.includes(estado);
  const opcionesEstado = [
    ...ESTADOS_A_MANO.map((nombre) => ({ valor: nombre, texto: nombre })),
    ...(estadoAutomatico ? [{ valor: estado, texto: estado }] : []),
  ];

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos del activo</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="codigo"
              etiqueta="Codigo de inventario"
              valor={codigo}
              alCambiar={setCodigo}
              placeholder="AC-014"
              obligatorio
              maxLength={50}
              deshabilitado={editando}
              anchoMinimo={10}
              anchoMaximo={20}
              revisado={revisado}
              error={errores.codigo}
              ayuda={
                editando
                  ? 'El codigo identifica al activo y no se puede cambiar.'
                  : 'No se puede repetir: identifica al activo.'
              }
            />

            <Campo
              id="idTipoActivo"
              etiqueta="Tipo de activo"
              tipo="lista"
              valor={idTipoActivo}
              alCambiar={setIdTipoActivo}
              opciones={opcionesTipos}
              placeholder="Elegir tipo"
              obligatorio
              anchoMinimo={18}
              revisado={revisado}
              error={errores.idTipoActivo}
            />

            <Campo
              id="idEspacio"
              etiqueta="Espacio"
              tipo="lista"
              valor={idEspacio}
              alCambiar={setIdEspacio}
              opciones={opcionesEspacios}
              placeholder="Elegir espacio"
              obligatorio
              anchoMinimo={22}
              revisado={revisado}
              error={errores.idEspacio}
              ayuda={
                editando
                  ? activo.fechaUltimaReubicacion
                    ? `Elegir otro espacio reubica el activo. Ultima reubicacion: ${comoFecha(activo.fechaUltimaReubicacion)}.`
                    : 'Elegir otro espacio reubica el activo y queda registrada la fecha.'
                  : ''
              }
            />

            <Campo
              id="fechaAlta"
              etiqueta="Fecha de alta"
              tipoHtml="date"
              valor={fechaAlta}
              alCambiar={setFechaAlta}
              max={hoy()}
              revisado={revisado}
              error={errores.fechaAlta}
            />

            {editando && (
              <Campo
                id="estado"
                etiqueta="Estado"
                tipo="lista"
                valor={estado}
                alCambiar={setEstado}
                opciones={opcionesEstado}
                deshabilitado={estadoAutomatico}
                anchoMinimo={16}
                revisado={revisado}
                ayuda={
                  estadoAutomatico
                    ? 'Este estado lo maneja la orden de trabajo, no se cambia desde aca.'
                    : 'Para retirar el activo, usa el boton de baja en el listado.'
                }
              />
            )}
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisa los campos marcados y volve a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/activos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
