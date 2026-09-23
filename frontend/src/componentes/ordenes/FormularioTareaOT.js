'use client';

/**
 * Ventana para cargar o cambiar una tarea de la orden de trabajo (HU-14).
 *
 * Es el corazón de la HU: acá se dice qué hay que hacer, con qué urgencia,
 * quién lo hace y para cuándo. Se abre desde el detalle de la OT, con el botón
 * "Agregar" o con el lápiz de cada tarea.
 *
 * Dos cosas que conviene saber:
 *
 * 1. LA TAREA ESTÁNDAR ES UN ATAJO, NO UN CANDADO. El desplegable de arriba
 *    trae las plantillas del tipo de activo del ticket (HU-12) y copia el
 *    texto en la descripción. Después se puede editar: lo que se guarda es lo
 *    que quedó escrito, y la plantilla queda anotada como origen.
 *
 * 2. EL RESPONSABLE ES UNO SOLO. O un técnico de la facultad, o un prestador
 *    externo, nunca los dos (corrección #13 de la profe). También puede quedar
 *    sin asignar: se carga la tarea ahora y se decide después. Mientras haya
 *    una tarea sin responsable, la OT sigue en "Creada".
 */
import { useState } from 'react';
import {
  CButton,
  CCol,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import Campo from '@/componentes/formulario/Campo.js';
import { SUGERENCIAS, formatearDuracion, interpretarDuracion } from '@/utils/duracion.js';
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
    // Se muestra como se escribe ("1 h 30 min"), no como se guarda (1.5).
    horasEstimadas: formatearDuracion(tarea.horasEstimadas) ?? '',
    idPlantilla: tarea.idPlantilla ? String(tarea.idPlantilla) : '',
  };
}

/**
 * OJO: esta ventana se monta recien cuando se abre y se desmonta al cerrarla
 * (ver la pantalla del detalle de la OT). Por eso las cajas arrancan cargadas
 * de una sola vez, aca abajo, y no hace falta ningun efecto que las vuelva a
 * llenar: cada vez que se abre, el componente nace de nuevo.
 */
export default function FormularioTareaOT({
  visible,
  tarea = null,
  prioridades = ['Alta', 'Media', 'Baja'],
  plantillas = [],
  tecnicos = [],
  prestadores = [],
  guardando = false,
  error = '',
  onGuardar,
  onCancelar,
}) {
  const [valores, setValores] = useState(() => comoValores(tarea));
  const [errores, setErrores] = useState({});
  const [revisado, setRevisado] = useState(false);

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

    if (!valores.descripcion.trim()) {
      fallos.descripcion = 'Escribí qué hay que hacer.';
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

    if (valores.horasEstimadas.trim() !== '') {
      const horas = interpretarDuracion(valores.horasEstimadas);

      if (horas === null) {
        fallos.horasEstimadas = 'No se entiende. Escribilo como "30 min", "1 h 30 min" o "2 h".';
      } else if (horas <= 0 || horas >= 1000) {
        fallos.horasEstimadas = 'Tiene que ser más de 0 y menos de 1000 horas.';
      }
    }

    setErrores(fallos);
    return Object.keys(fallos).length === 0;
  }

  function guardar() {
    setRevisado(true);
    if (!revisar()) return;

    onGuardar({
      descripcion: valores.descripcion.trim(),
      prioridad: valores.prioridad,
      legajoTecnico: valores.tipoResponsable === 'Técnico' ? valores.legajoTecnico : null,
      idPrestador: valores.tipoResponsable === 'Prestador' ? Number(valores.idPrestador) : null,
      idPlantilla: valores.idPlantilla ? Number(valores.idPlantilla) : null,
      fechaInicio: valores.fechaInicio || null,
      fechaFin: valores.fechaFin || null,
      horasEstimadas: interpretarDuracion(valores.horasEstimadas),
    });
  }

  return (
    <CModal visible={visible} onClose={onCancelar} alignment="center" size="lg" scrollable>
      <CModalHeader>
        <CModalTitle>{tarea ? `Tarea ${tarea.idTarea}` : 'Agregar tarea'}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        {plantillas.length > 0 && (
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
            placeholder="Escribir una tarea nueva"
            ancho={40}
          />
        )}

        <Campo
          id="descripcion"
          etiqueta="Qué hay que hacer"
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
          valor={valores.horasEstimadas}
          alCambiar={(valor) => cambiar('horasEstimadas', valor)}
          sugerencias={SUGERENCIAS}
          placeholder="30 min"
          revisado={revisado}
          error={errores.horasEstimadas}
          ancho={14}
        />
      </CModalBody>

      <CModalFooter>
        <CButton color="secondary" variant="outline" onClick={onCancelar} disabled={guardando}>
          Cancelar
        </CButton>
        <CButton color="primary" onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar'}
        </CButton>
      </CModalFooter>
    </CModal>
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
