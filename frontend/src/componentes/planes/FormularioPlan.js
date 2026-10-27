'use client';

/**
 * Alta y edición de un plan de mantenimiento preventivo (Sprint 5).
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CAlert,
  CCard,
  CCardBody,
  CCol,
  CFormCheck,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';
import { listarPlantillas } from '@/servicios/plantillasTareas.js';
import { listarTecnicos } from '@/servicios/tecnicos.js';

const OPCIONES_TIPO_MANT = [
  { valor: 'Preventivo', texto: 'Preventivo' },
  { valor: 'Predictivo', texto: 'Predictivo' },
  { valor: 'Rutinario', texto: 'Rutinario' },
  { valor: 'Inspección', texto: 'Inspección' },
];

const OPCIONES_UNIDAD = [
  { valor: 'dias', texto: 'Días' },
  { valor: 'semanas', texto: 'Semanas' },
  { valor: 'meses', texto: 'Meses' },
  { valor: 'anios', texto: 'Años' },
];

export default function FormularioPlan({ plan = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(plan);

  const [nombre, setNombre] = useState(plan?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? '');
  const [tipoMantenimiento, setTipoMantenimiento] = useState(plan?.tipoMantenimiento ?? 'Preventivo');
  const [idTipoActivo, setIdTipoActivo] = useState(plan?.tipoActivo?.id ? String(plan.tipoActivo.id) : '');
  const [intervalo, setIntervalo] = useState(plan?.intervalo ? String(plan.intervalo) : '6');
  const [unidadFrecuencia, setUnidadFrecuencia] = useState(plan?.unidadFrecuencia ?? 'meses');
  const [fechaProximaGeneracion, setFechaProximaGeneracion] = useState(
    plan?.fechaProximaGeneracion ?? ''
  );

  const [tareasSeleccionadas, setTareasSeleccionadas] = useState(
    plan?.tareas ? plan.tareas.map((t) => t.id) : []
  );
  const [tecnicosSeleccionados, setTecnicosSeleccionados] = useState(
    plan?.tecnicos ? plan.tecnicos.map((t) => t.legajo) : []
  );

  const [tiposActivos, setTiposActivos] = useState([]);
  const [plantillasDisponibles, setPlantillasDisponibles] = useState([]);
  const [tecnicosDisponibles, setTecnicosDisponibles] = useState([]);

  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Carga inicial de tipos de activo y técnicos
  useEffect(() => {
    Promise.all([listarTiposActivos(), listarTecnicos()])
      .then(([tipos, tecnicos]) => {
        setTiposActivos(tipos);
        setTecnicosDisponibles(tecnicos);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Cargar plantillas de tareas cuando cambia el tipo de activo seleccionado
  useEffect(() => {
    if (!idTipoActivo) {
      setPlantillasDisponibles([]);
      if (!editando) setTareasSeleccionadas([]);
      return;
    }

    setCargandoPlantillas(true);
    listarPlantillas(idTipoActivo)
      .then((plantillas) => {
        setPlantillasDisponibles(plantillas);
        // Si no estamos editando o si cambió el tipo de activo, seleccionamos por defecto
        if (!editando) {
          setTareasSeleccionadas(plantillas.map((p) => p.idPlantilla));
        }
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargandoPlantillas(false));
  }, [idTipoActivo, editando]);

  // Si no hay fecha cargada, poner hoy por defecto
  useEffect(() => {
    if (!fechaProximaGeneracion) {
      const hoy = new Date().toISOString().slice(0, 10);
      setFechaProximaGeneracion(hoy);
    }
  }, [fechaProximaGeneracion]);

  const errores = useMemo(() => {
    const encontrados = {};

    if (!nombre.trim()) encontrados.nombre = 'El nombre del plan es obligatorio.';
    if (!idTipoActivo) encontrados.idTipoActivo = 'Elegí a qué tipo de activo se aplica.';
    if (!intervalo || Number(intervalo) <= 0) {
      encontrados.intervalo = 'El intervalo debe ser un número entero mayor a 0.';
    }
    if (!fechaProximaGeneracion) {
      encontrados.fechaProximaGeneracion = 'Elegí la fecha de próxima ejecución.';
    }
    if (tareasSeleccionadas.length === 0) {
      encontrados.tareas = 'El plan debe incluir al menos una tarea.';
    }

    return encontrados;
  }, [nombre, idTipoActivo, intervalo, fechaProximaGeneracion, tareasSeleccionadas]);

  const hayErrores = Object.keys(errores).length > 0;

  function alternarTarea(idTarea) {
    setTareasSeleccionadas((previas) =>
      previas.includes(idTarea) ? previas.filter((id) => id !== idTarea) : [...previas, idTarea]
    );
  }

  function alternarTecnico(legajo) {
    setTecnicosSeleccionados((previos) =>
      previos.includes(legajo) ? previos.filter((l) => l !== legajo) : [...previos, legajo]
    );
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);

    if (hayErrores) return;

    setGuardando(true);
    setError('');

    try {
      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        tipoMantenimiento: tipoMantenimiento || 'Preventivo',
        tipoActivoId: Number(idTipoActivo),
        intervalo: Number(intervalo),
        unidadFrecuencia,
        fechaProximaGeneracion,
        tareasIds: tareasSeleccionadas,
        tecnicosLegajos: tecnicosSeleccionados,
      };

      await onGuardar(payload);
      mostrarToast({
        tipo: 'exito',
        mensaje: editando ? 'Se guardaron los cambios del plan.' : 'Se dio de alta el plan.',
      });
      router.push('/planes-mantenimiento');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      {error && <Aviso color="danger" className="mb-4">{error}</Aviso>}

      <CCard className="mb-4">
        <CCardBody>
          <form onSubmit={manejarEnvio} noValidate>
            <CRow className="g-3">
              <CCol md={6}>
                <Campo
                  id="nombre"
                  etiqueta="Nombre del plan"
                  valor={nombre}
                  alCambiar={setNombre}
                  obligatorio
                  revisado={revisado}
                  error={errores.nombre}
                  ancho={32}
                />
              </CCol>

              <CCol md={3}>
                <Campo
                  id="tipoMantenimiento"
                  etiqueta="Tipo"
                  tipo="lista"
                  valor={tipoMantenimiento}
                  alCambiar={setTipoMantenimiento}
                  opciones={OPCIONES_TIPO_MANT}
                  revisado={revisado}
                />
              </CCol>

              <CCol md={6}>
                <Campo
                  id="tipoActivo"
                  etiqueta="Tipo de activo"
                  tipo="lista"
                  valor={idTipoActivo}
                  alCambiar={setIdTipoActivo}
                  opciones={tiposActivos.map((t) => ({
                    valor: String(t.idTipoActivo),
                    texto: t.nombre,
                  }))}
                  obligatorio
                  revisado={revisado}
                  error={errores.idTipoActivo}
                  deshabilitado={editando}
                />
              </CCol>

              <CCol md={2}>
                <Campo
                  id="intervalo"
                  etiqueta="Intervalo"
                  tipo="numero"
                  min="1"
                  max="99"
                  ancho={2}
                  valor={intervalo}
                  alCambiar={setIntervalo}
                  obligatorio
                  revisado={revisado}
                  error={errores.intervalo}
                />
              </CCol>

              <CCol md={2}>
                <Campo
                  id="unidadFrecuencia"
                  etiqueta="Frecuencia"
                  tipo="lista"
                  valor={unidadFrecuencia}
                  alCambiar={setUnidadFrecuencia}
                  opciones={OPCIONES_UNIDAD}
                  revisado={revisado}
                />
              </CCol>

              <CCol md={6}>
                <Campo
                  id="fechaProximaGeneracion"
                  etiqueta="Próxima ejecución"
                  tipoHtml="date"
                  min={new Date().toISOString().slice(0, 10)}
                  valor={fechaProximaGeneracion}
                  alCambiar={setFechaProximaGeneracion}
                  obligatorio
                  revisado={revisado}
                  error={errores.fechaProximaGeneracion}
                />
              </CCol>

              <CCol md={12}>
                <Campo
                  id="descripcion"
                  etiqueta="Descripción"
                  tipo="area"
                  valor={descripcion}
                  alCambiar={setDescripcion}
                />
              </CCol>

              {/* Tareas que incluye el plan (CA1) */}
              <CCol md={12} className="mt-4">
                <div className="fw-semibold mb-2">Tareas incluidas *</div>
                {!idTipoActivo ? (
                  <div className="text-body-tertiary small fst-italic">
                    Elegí primero un tipo de activo para ver sus tareas modelo disponibles.
                  </div>
                ) : cargandoPlantillas ? (
                  <div className="text-body-secondary small">Cargando tareas modelo...</div>
                ) : plantillasDisponibles.length === 0 ? (
                  <div className="text-body-tertiary small fst-italic">
                    No hay plantillas de tareas creadas para este tipo de activo.
                  </div>
                ) : (
                  <div className="border rounded p-3 bg-light">
                    {plantillasDisponibles.map((plantilla) => {
                      const tildada = tareasSeleccionadas.includes(plantilla.idPlantilla);
                      return (
                        <CFormCheck
                          key={plantilla.idPlantilla}
                          id={`tarea-${plantilla.idPlantilla}`}
                          label={
                            <div>
                              <span className="fw-medium">{plantilla.descripcion}</span>
                            </div>
                          }
                          checked={tildada}
                          onChange={() => alternarTarea(plantilla.idPlantilla)}
                          className="mb-2"
                        />
                      );
                    })}
                  </div>
                )}
                {revisado && errores.tareas && (
                  <div className="text-danger small mt-1">{errores.tareas}</div>
                )}
              </CCol>

              {/* Técnicos responsables del plan (CA2, C4, C5) */}
              <CCol md={12} className="mt-4">
                <div className="fw-semibold mb-1">Técnicos asignados (opcional)</div>
                {tecnicosDisponibles.length === 0 ? (
                  <div className="text-body-tertiary small fst-italic">
                    No hay técnicos registrados en el sistema.
                  </div>
                ) : (
                  <div className="border rounded p-3 bg-light">
                    {tecnicosDisponibles.map((tecnico) => {
                      const tildado = tecnicosSeleccionados.includes(tecnico.legajo);
                      return (
                        <CFormCheck
                          key={tecnico.legajo}
                          id={`tecnico-${tecnico.legajo}`}
                          label={
                            <span>
                              <strong>{tecnico.nombre}</strong> (Legajo {tecnico.legajo})
                            </span>
                          }
                          checked={tildado}
                          onChange={() => alternarTecnico(tecnico.legajo)}
                          className="mb-2"
                        />
                      );
                    })}
                  </div>
                )}
              </CCol>

              <CCol md={12} className="mt-4">
                <BotonesAccion
                  procesando={guardando}
                  hrefCancelar="/planes-mantenimiento"
                />
              </CCol>
            </CRow>
          </form>
        </CCardBody>
      </CCard>
    </>
  );
}
