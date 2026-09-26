'use client';

/**
 * Formulario para cargar o cambiar una tarea de la orden de trabajo (HU-14).
 *
 * Es el corazón de la HU: acá se dice qué hay que hacer, con qué urgencia,
 * quién lo hace y para cuándo. Tiene pantalla propia
 * (/ordenes-trabajo/5/tareas/agregar y /ordenes-trabajo/5/tareas/3/editar):
 * se llega desde el detalle de la OT, con el botón "Agregar" o con el lápiz
 * de cada tarea, y al guardar o cancelar se vuelve a ese detalle.
 *
 * Dos cosas que conviene saber:
 *
 * 1. LA TAREA ESTÁNDAR ES OBLIGATORIA (26/09/2026). El desplegable trae las
 *    plantillas del tipo de activo del ticket (HU-12) y copia el texto en la
 *    descripción. Después la descripción se puede ajustar: lo que se guarda es
 *    lo que quedó escrito, y la plantilla queda anotada como origen. Si la
 *    tarea no está, el botón "Agregar" de al lado la crea como plantilla del
 *    tipo de activo sin salir de la OT.
 *
 * 2. EL RESPONSABLE ES UNO SOLO. O un técnico de la facultad, o un prestador
 *    externo, nunca los dos (corrección #13 de la profe). También puede quedar
 *    sin asignar: se carga la tarea ahora y se decide después. Mientras haya
 *    una tarea sin responsable, la OT sigue en "Creada".
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody, CCol, CFormLabel, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarPrioridades } from '@/servicios/ordenesTrabajo.js';
import { crearPlantilla, listarPlantillas } from '@/servicios/plantillasTareas.js';
import { listarPrestadores } from '@/servicios/prestadores.js';
import { listarTecnicos } from '@/servicios/tecnicos.js';
import { aHorasDecimales, comoHoraMinuto } from '@/utils/duracion.js';
import { hoyTexto } from '@/utils/fechas.js';

/** Quién puede hacerse cargo de una tarea. */
const SIN_ASIGNAR = 'Sin asignar';
const TIPOS_DE_RESPONSABLE = [SIN_ASIGNAR, 'Técnico', 'Prestador'];

/** De "2026-09-21T00:00:00+00:00" saca "2026-09-21", que es lo que espera el almanaque. */
function soloFecha(iso) {
  return iso ? String(iso).slice(0, 10) : '';
}

const TAREA_VACIA = {
  descripcion: '',
  prioridad: 'Media',
  tipoResponsable: SIN_ASIGNAR,
  legajoTecnico: '',
  idPrestador: '',
  fechaInicio: '',
  fechaFin: '',
  horasEstimadas: '',
  idPlantilla: '',
};

/** Los datos de la tarea que se va a editar, en la forma que usan las cajas. */
function comoValores(tarea) {
  if (!tarea) return TAREA_VACIA;

  return {
    descripcion: tarea.descripcion ?? '',
    prioridad: tarea.prioridad ?? 'Media',
    tipoResponsable: tarea.responsable?.tipo ?? SIN_ASIGNAR,
    legajoTecnico: tarea.responsable?.tipo === 'Técnico' ? tarea.responsable.legajo : '',
    idPrestador: tarea.responsable?.tipo === 'Prestador' ? String(tarea.responsable.idPrestador) : '',
    fechaInicio: soloFecha(tarea.fechaInicio),
    fechaFin: soloFecha(tarea.fechaFin),
    // Se muestra como se carga ("01:30"), no como se guarda (1.5).
    horasEstimadas: comoHoraMinuto(tarea.horasEstimadas),
    idPlantilla: tarea.idPlantilla ? String(tarea.idPlantilla) : '',
  };
}

/**
 * La pantalla lo monta recién cuando ya tiene la OT (y la tarea, si se
 * edita). Por eso las cajas arrancan cargadas de una sola vez, acá abajo.
 */
export default function FormularioTareaOT({ orden, tarea = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const volverA = `/ordenes-trabajo/${orden.id}`;

  const [valores, setValores] = useState(() => comoValores(tarea));
  const [errores, setErrores] = useState({});
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Lo que se puede elegir al cargar una tarea.
  const [prioridades, setPrioridades] = useState(['Alta', 'Media', 'Baja']);
  const [plantillas, setPlantillas] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [prestadores, setPrestadores] = useState([]);

  // La caja para agregar una tarea estándar nueva sin salir de la OT.
  const [nuevaVisible, setNuevaVisible] = useState(false);
  const [nuevaDescripcion, setNuevaDescripcion] = useState('');
  const [errorNueva, setErrorNueva] = useState('');
  const [creandoPlantilla, setCreandoPlantilla] = useState(false);

  useEffect(() => {
    Promise.all([listarPrioridades(), listarTecnicos(), listarPrestadores()])
      .then(([listaPrioridades, listaTecnicos, listaPrestadores]) => {
        setPrioridades(listaPrioridades);
        setTecnicos(listaTecnicos);
        setPrestadores(listaPrestadores);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  /*
   * Las tareas estándar dependen de la OT: son las plantillas cargadas para el
   * tipo de activo del ticket (HU-12). Si la OT no tiene activo, no hay
   * plantillas que ofrecer.
   */
  const idTipoActivo = orden.activo?.idTipoActivo;

  useEffect(() => {
    if (!idTipoActivo) return;

    listarPlantillas(idTipoActivo)
      .then(setPlantillas)
      .catch(() => setPlantillas([]));
  }, [idTipoActivo]);

  /*
   * Las tareas se planifican para adelante: ni el inicio ni el fin pueden
   * quedar antes de hoy. El almanaque directamente no deja elegir un día
   * anterior (`min`), y si igual llega uno, la revisión lo corta.
   *
   * La excepción es editar una tarea vieja: la fecha que ya estaba guardada se
   * respeta, así cambiarle la descripción a una tarea de la semana pasada no
   * obliga a reprogramarla.
   */
  const hoy = hoyTexto();
  const inicioOriginal = tarea ? soloFecha(tarea.fechaInicio) : '';
  const finOriginal = tarea ? soloFecha(tarea.fechaFin) : '';

  const minimoInicio = inicioOriginal && inicioOriginal < hoy ? inicioOriginal : hoy;
  const minimoFin = [finOriginal && finOriginal < hoy ? finOriginal : hoy, valores.fechaInicio]
    .filter(Boolean)
    .sort()
    .at(-1);

  function cambiar(campo, valor) {
    setValores((anteriores) => ({ ...anteriores, [campo]: valor }));
  }

  /** Al elegir una tarea estándar se copia su texto en la descripción. */
  function elegirPlantilla(idPlantilla) {
    const plantilla = plantillas.find((una) => String(una.idPlantilla) === String(idPlantilla));

    setValores((anteriores) => ({
      ...anteriores,
      idPlantilla,
      descripcion: plantilla ? plantilla.descripcion : anteriores.descripcion,
    }));
  }

  /*
   * Si la tarea que se necesita no está entre las estándar, se agrega acá
   * mismo, sin salir de la OT. Queda guardada como plantilla del tipo de
   * activo de la OT (la misma que se ve en "Plantillas de tareas"), elegida en
   * el desplegable y copiada en la descripción.
   */
  async function agregarPlantilla() {
    const descripcion = nuevaDescripcion.trim();

    if (!descripcion) {
      setErrorNueva('Escribí la tarea.');
      return;
    }

    setCreandoPlantilla(true);
    setErrorNueva('');

    try {
      const nueva = await crearPlantilla({ idTipoActivo, descripcion });

      setPlantillas((anteriores) =>
        [...anteriores, nueva].sort((a, b) => a.descripcion.localeCompare(b.descripcion)),
      );
      setValores((anteriores) => ({
        ...anteriores,
        idPlantilla: String(nueva.idPlantilla),
        descripcion: nueva.descripcion,
      }));
      setNuevaVisible(false);
      setNuevaDescripcion('');
      mostrarToast({ tipo: 'exito', mensaje: 'Se agregó la tarea estándar.' });
    } catch (fallo) {
      setErrorNueva(fallo.message);
    } finally {
      setCreandoPlantilla(false);
    }
  }

  function cancelarPlantilla() {
    setNuevaVisible(false);
    setNuevaDescripcion('');
    setErrorNueva('');
  }

  /** Al cambiar quién se hace cargo, se limpia la elección anterior. */
  function cambiarTipoDeResponsable(tipo) {
    setValores((anteriores) => ({
      ...anteriores,
      tipoResponsable: tipo,
      legajoTecnico: '',
      idPrestador: '',
    }));
  }

  function revisar() {
    const fallos = {};

    if (!valores.idPlantilla) {
      fallos.idPlantilla = 'Elegí la tarea estándar.';
    }

    if (!valores.descripcion.trim()) {
      fallos.descripcion = 'Escribí la descripción.';
    }

    if (valores.tipoResponsable === 'Técnico' && !valores.legajoTecnico) {
      fallos.legajoTecnico = 'Elegí el técnico que la va a hacer.';
    }

    if (valores.tipoResponsable === 'Prestador' && !valores.idPrestador) {
      fallos.idPrestador = 'Elegí el prestador que la va a hacer.';
    }

    if (valores.fechaInicio && valores.fechaInicio < hoy && valores.fechaInicio !== inicioOriginal) {
      fallos.fechaInicio = 'No puede ser anterior a hoy.';
    }

    if (valores.fechaFin && valores.fechaFin < hoy && valores.fechaFin !== finOriginal) {
      fallos.fechaFin = 'No puede ser anterior a hoy.';
    }

    if (valores.fechaInicio && valores.fechaFin && valores.fechaFin < valores.fechaInicio) {
      fallos.fechaFin = 'No puede ser anterior a la fecha de inicio.';
    }

    /*
     * Los casilleros del reloj no dejan escribir cualquier cosa, asi que lo
     * unico que puede pasar es que quede en 00:00, que no es una duracion.
     */
    if (valores.horasEstimadas !== '' && aHorasDecimales(valores.horasEstimadas) === 0) {
      fallos.horasEstimadas = 'Tiene que ser más de 00:00.';
    }

    setErrores(fallos);
    return Object.keys(fallos).length === 0;
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (!revisar()) return;

    setGuardando(true);
    try {
      await onGuardar({
        descripcion: valores.descripcion.trim(),
        prioridad: valores.prioridad,
        legajoTecnico: valores.tipoResponsable === 'Técnico' ? valores.legajoTecnico : null,
        idPrestador: valores.tipoResponsable === 'Prestador' ? Number(valores.idPrestador) : null,
        idPlantilla: Number(valores.idPlantilla),
        fechaInicio: valores.fechaInicio || null,
        fechaFin: valores.fechaFin || null,
        horasEstimadas: aHorasDecimales(valores.horasEstimadas),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: tarea ? 'Se guardaron los cambios de la tarea.' : 'Se agregó la tarea.',
      });
      router.push(volverA);
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const hayErrores = Object.keys(errores).length > 0;

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <div className="sigma-campos mb-3">
            <Campo
              id="tareaEstandar"
              etiqueta="Tarea estándar"
              tipo="lista"
              valor={valores.idPlantilla}
              alCambiar={elegirPlantilla}
              opciones={plantillas.map((plantilla) => ({
                valor: String(plantilla.idPlantilla),
                texto: plantilla.descripcion,
              }))}
              placeholder={
                !idTipoActivo
                  ? 'La orden no tiene un activo asociado'
                  : plantillas.length === 0
                    ? 'No hay tareas estándar para este tipo de activo'
                    : 'Elegir tarea estándar'
              }
              obligatorio
              deshabilitado={plantillas.length === 0}
              revisado={revisado}
              error={errores.idPlantilla}
              ancho={40}
            />

            {/*
              La etiqueta invisible empuja el botón a la altura de la caja,
              aunque debajo de la caja aparezca un error.
            */}
            {idTipoActivo && !nuevaVisible && (
              <div className="sigma-campo">
                <CFormLabel className="invisible" aria-hidden="true">
                  Agregar
                </CFormLabel>
                <CButton
                  type="button"
                  color="secondary"
                  variant="outline"
                  onClick={() => setNuevaVisible(true)}
                  title="Agregar una tarea estándar nueva para este tipo de activo"
                >
                  <CIcon icon={cilPlus} size="sm" className="me-1" />
                  Agregar
                </CButton>
              </div>
            )}
          </div>

          {nuevaVisible && (
            /*
             * Está dentro del formulario de la tarea: el Enter de esta caja
             * tiene que agregar la plantilla, no mandar la tarea entera.
             */
            <div
              className="sigma-campos border rounded p-3 mb-3"
              onKeyDown={(evento) => {
                if (evento.key === 'Enter') {
                  evento.preventDefault();
                  agregarPlantilla();
                }
              }}
            >
              <Campo
                id="nuevaTareaEstandar"
                etiqueta={`Nueva tarea estándar para ${orden.activo?.nombreTipo || 'este tipo de activo'}`}
                valor={nuevaDescripcion}
                alCambiar={setNuevaDescripcion}
                placeholder="Ej: limpiar los filtros"
                obligatorio
                maxLength={200}
                ancho={36}
                revisado={Boolean(errorNueva)}
                error={errorNueva}
              />

              <div className="sigma-campo">
                <CFormLabel className="invisible" aria-hidden="true">
                  Agregar
                </CFormLabel>
                <div className="d-flex gap-2">
                  <CButton
                    type="button"
                    color="primary"
                    onClick={agregarPlantilla}
                    disabled={creandoPlantilla}
                  >
                    {creandoPlantilla ? 'Agregando...' : 'Agregar'}
                  </CButton>
                  <CButton
                    type="button"
                    color="secondary"
                    variant="outline"
                    onClick={cancelarPlantilla}
                    disabled={creandoPlantilla}
                  >
                    Cancelar
                  </CButton>
                </div>
              </div>
            </div>
          )}

          <Campo
            id="descripcion"
            etiqueta="Descripción"
            tipo="area"
            filas={3}
            valor={valores.descripcion}
            alCambiar={(valor) => cambiar('descripcion', valor)}
            obligatorio
            revisado={revisado}
            error={errores.descripcion}
          />

          <CRow>
            <CCol md={4}>
              <Campo
                id="prioridad"
                etiqueta="Prioridad"
                tipo="lista"
                valor={valores.prioridad}
                alCambiar={(valor) => cambiar('prioridad', valor)}
                opciones={prioridades.map((una) => ({ valor: una, texto: una }))}
                ancho={10}
              />
            </CCol>

            <CCol md={4}>
              <Campo
                id="fechaInicio"
                etiqueta="Inicio previsto"
                tipoHtml="date"
                valor={valores.fechaInicio}
                alCambiar={(valor) => cambiar('fechaInicio', valor)}
                min={minimoInicio}
                revisado={revisado}
                error={errores.fechaInicio}
              />
            </CCol>

            <CCol md={4}>
              <Campo
                id="fechaFin"
                etiqueta="Fin previsto"
                tipoHtml="date"
                valor={valores.fechaFin}
                alCambiar={(valor) => cambiar('fechaFin', valor)}
                min={minimoFin}
                revisado={revisado}
                error={errores.fechaFin}
              />
            </CCol>
          </CRow>

          <CRow>
            <CCol md={4}>
              <Campo
                id="tipoResponsable"
                etiqueta="Lo hace"
                tipo="lista"
                valor={valores.tipoResponsable}
                alCambiar={cambiarTipoDeResponsable}
                opciones={TIPOS_DE_RESPONSABLE.map((tipo) => ({ valor: tipo, texto: tipo }))}
                ancho={12}
              />
            </CCol>

            <CCol md={8}>
              {valores.tipoResponsable === 'Técnico' && (
                <Campo
                  id="legajoTecnico"
                  etiqueta="Técnico"
                  tipo="lista"
                  valor={valores.legajoTecnico}
                  alCambiar={(valor) => cambiar('legajoTecnico', valor)}
                  opciones={tecnicos.map((tecnico) => ({
                    valor: tecnico.legajo,
                    texto: textoDelTecnico(tecnico),
                  }))}
                  placeholder="Elegir técnico"
                  obligatorio
                  revisado={revisado}
                  error={errores.legajoTecnico}
                  ancho={34}
                />
              )}

              {valores.tipoResponsable === 'Prestador' && (
                <Campo
                  id="idPrestador"
                  etiqueta="Prestador"
                  tipo="lista"
                  valor={valores.idPrestador}
                  alCambiar={(valor) => cambiar('idPrestador', valor)}
                  opciones={prestadores.map((prestador) => ({
                    valor: String(prestador.idPrestador),
                    texto: prestador.nombre,
                  }))}
                  placeholder={
                    prestadores.length === 0 ? 'Todavía no hay prestadores cargados' : 'Elegir prestador'
                  }
                  obligatorio
                  deshabilitado={prestadores.length === 0}
                  revisado={revisado}
                  error={errores.idPrestador}
                  ancho={34}
                />
              )}
            </CCol>
          </CRow>

          <Campo
            id="horasEstimadas"
            etiqueta="Duración prevista"
            tipo="duracion"
            valor={valores.horasEstimadas}
            alCambiar={(valor) => cambiar('horasEstimadas', valor)}
            revisado={revisado}
            error={errores.horasEstimadas}
          />

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : tarea ? 'Guardar cambios' : 'Agregar'}
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

/**
 * El técnico como se lee en el desplegable: nombre, especialidades y, si no
 * está disponible, el aviso.
 *
 * Las especialidades se muestran para poder elegir al que corresponde al
 * trabajo (corrección #2 de la profe). No se filtra la lista: el sistema
 * todavía no sabe qué especialidad pide cada tipo de activo, así que la
 * decisión es del administrador.
 */
function textoDelTecnico(tecnico) {
  const especialidades = (tecnico.especialidades ?? []).map((una) => una.nombre).join(', ');
  const partes = [tecnico.nombre];

  if (especialidades) partes.push(especialidades);
  if (tecnico.disponibilidad === 'No disponible') partes.push('no disponible');

  return partes.join(' — ');
}
