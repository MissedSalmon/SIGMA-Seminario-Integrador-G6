'use client';

/**
 * Alta y edición de un plan de mantenimiento preventivo (Sprint 5).
 *
 * Desde el 03/11/2026 el plan sólo dice a qué tipo de activo aplica, cada
 * cuánto y con qué tareas. No tiene "próxima ejecución": la fecha se calcula
 * para cada activo (ver el detalle del plan). Tampoco tiene "tipo": todos los
 * planes son preventivos. Desde el 04/11/2026 tampoco tiene técnicos: a las OT
 * que genera se les asignan después, como a cualquier OT.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody, CCol, CRow } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilPlus } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import SeleccionMultiple from '@/componentes/formulario/SeleccionMultiple.js';
import DialogoNuevaPlantilla from '@/componentes/plantillas/DialogoNuevaPlantilla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';
import { listarPlantillas } from '@/servicios/plantillasTareas.js';

/** Las frecuencias de siempre. Cualquier otra se carga con "Otra…". */
const FRECUENCIAS = [
  { valor: 'semanas-1', texto: 'Semanal', intervalo: 1, unidad: 'semanas' },
  { valor: 'semanas-2', texto: 'Quincenal', intervalo: 2, unidad: 'semanas' },
  { valor: 'meses-1', texto: 'Mensual', intervalo: 1, unidad: 'meses' },
  { valor: 'meses-2', texto: 'Bimestral', intervalo: 2, unidad: 'meses' },
  { valor: 'meses-3', texto: 'Trimestral', intervalo: 3, unidad: 'meses' },
  { valor: 'meses-4', texto: 'Cuatrimestral', intervalo: 4, unidad: 'meses' },
  { valor: 'meses-6', texto: 'Semestral', intervalo: 6, unidad: 'meses' },
  { valor: 'anios-1', texto: 'Anual', intervalo: 1, unidad: 'anios' },
];
const OTRA = 'otra';

const UNIDADES = [
  { valor: 'dias', texto: 'Días' },
  { valor: 'semanas', texto: 'Semanas' },
  { valor: 'meses', texto: 'Meses' },
  { valor: 'anios', texto: 'Años' },
];

/** La opción de la lista que corresponde al plan, u "Otra…" si no es una de las de siempre. */
function frecuenciaDelPlan(plan) {
  if (!plan) return 'meses-6';
  const fija = FRECUENCIAS.find((una) => una.intervalo === plan.intervalo && una.unidad === plan.unidadFrecuencia);
  return fija ? fija.valor : OTRA;
}

export default function FormularioPlan({ plan = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(plan);

  const [nombre, setNombre] = useState(plan?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? '');
  const [idTipoActivo, setIdTipoActivo] = useState(plan?.tipoActivo?.id ? String(plan.tipoActivo.id) : '');
  const [frecuencia, setFrecuencia] = useState(() => frecuenciaDelPlan(plan));
  const [intervaloOtro, setIntervaloOtro] = useState(plan?.intervalo ? String(plan.intervalo) : '1');
  const [unidadOtra, setUnidadOtra] = useState(plan?.unidadFrecuencia ?? 'meses');

  const [idsTareas, setIdsTareas] = useState(plan?.tareas?.map((tarea) => tarea.id) ?? []);

  const [tiposActivos, setTiposActivos] = useState([]);
  const [plantillas, setPlantillas] = useState([]);

  // La ventana para crear una tarea estándar sin salir del plan.
  const [nuevaVisible, setNuevaVisible] = useState(false);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarTiposActivos(), listarPlantillas()])
      .then(([tipos, listaPlantillas]) => {
        setTiposActivos(tipos);
        setPlantillas(listaPlantillas);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  const esOtra = frecuencia === OTRA;
  const fija = FRECUENCIAS.find((una) => una.valor === frecuencia);
  const intervalo = esOtra ? Number(intervaloOtro) : fija?.intervalo;
  const unidad = esOtra ? unidadOtra : fija?.unidad;

  const errores = useMemo(() => {
    const encontrados = {};

    if (!nombre.trim()) encontrados.nombre = 'Escribí el nombre del plan.';
    if (!idTipoActivo) encontrados.idTipoActivo = 'Elegí a qué tipo de activo se aplica.';
    if (!frecuencia) encontrados.frecuencia = 'Elegí cada cuánto se hace.';
    if (esOtra && (!Number.isInteger(intervalo) || intervalo <= 0)) {
      encontrados.intervaloOtro = 'Tiene que ser un número entero mayor que 0.';
    }
    if (idsTareas.length === 0) encontrados.tareas = 'Agregá al menos una tarea.';

    return encontrados;
  }, [nombre, idTipoActivo, frecuencia, esOtra, intervalo, idsTareas]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    if (hayErrores) return;

    setGuardando(true);
    setError('');

    try {
      await onGuardar({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        tipoActivoId: Number(idTipoActivo),
        intervalo,
        unidadFrecuencia: unidad,
        tareasIds: idsTareas,
      });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando ? 'Se guardaron los cambios del plan.' : 'Se agregó el plan.',
      });
      router.push('/planes-mantenimiento');
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  function usarPlantillaNueva(nueva) {
    setPlantillas((anteriores) => [...anteriores, nueva]);
    setIdsTareas((anteriores) => [...anteriores, nueva.idPlantilla]);
  }

  const opcionesTareas = plantillas.map((plantilla) => ({
    valor: plantilla.idPlantilla,
    texto: `${plantilla.descripcion} (${plantilla.nombreEspecialidad ?? 'sin especialidad'})`,
  }));

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

              <CCol md={6}>
                <Campo
                  id="tipoActivo"
                  etiqueta="Tipo de activo"
                  tipo="lista"
                  valor={idTipoActivo}
                  alCambiar={setIdTipoActivo}
                  opciones={tiposActivos.map((tipo) => ({ valor: String(tipo.idTipoActivo), texto: tipo.nombre }))}
                  obligatorio
                  revisado={revisado}
                  error={errores.idTipoActivo}
                  deshabilitado={editando}
                  ancho={24}
                />
              </CCol>

              <CCol xs={12}>
                <div className="d-flex flex-wrap gap-3 align-items-start">
                  <Campo
                    id="frecuencia"
                    etiqueta="Frecuencia"
                    tipo="lista"
                    valor={frecuencia}
                    alCambiar={setFrecuencia}
                    opciones={[...FRECUENCIAS, { valor: OTRA, texto: 'Otra…' }]}
                    obligatorio
                    revisado={revisado}
                    error={errores.frecuencia}
                    ancho={14}
                  />

                  {esOtra && (
                    <>
                      <Campo
                        id="intervaloOtro"
                        etiqueta="Cada"
                        tipo="numero"
                        min="1"
                        max="99"
                        valor={intervaloOtro}
                        alCambiar={setIntervaloOtro}
                        obligatorio
                        revisado={revisado}
                        error={errores.intervaloOtro}
                        ancho={3}
                      />
                      <Campo
                        id="unidadOtra"
                        etiqueta="Unidad"
                        tipo="lista"
                        valor={unidadOtra}
                        alCambiar={setUnidadOtra}
                        opciones={UNIDADES}
                        obligatorio
                        ancho={8}
                      />
                    </>
                  )}
                </div>
              </CCol>

              <CCol xs={12}>
                <Campo
                  id="descripcion"
                  etiqueta="Descripción"
                  tipo="area"
                  valor={descripcion}
                  alCambiar={setDescripcion}
                />
              </CCol>

              <CCol xs={12}>
                <SeleccionMultiple
                  id="tareas"
                  etiqueta="Tareas"
                  opciones={opcionesTareas}
                  elegidos={idsTareas}
                  alCambiar={setIdsTareas}
                  textoTodas="Todas las tareas"
                  textoCantidad={(cantidad) => `${cantidad} tareas`}
                  placeholder="Elegir tareas"
                  ancho={40}
                  obligatorio
                  revisado={revisado}
                  error={errores.tareas}
                  accion={
                    <CButton
                      type="button"
                      color="secondary"
                      variant="outline"
                      onClick={() => setNuevaVisible(true)}
                      title="Crear una tarea estándar nueva y agregarla al plan"
                    >
                      <CIcon icon={cilPlus} size="sm" className="me-1" />
                      Agregar
                    </CButton>
                  }
                />
              </CCol>

              <CCol xs={12} className="mt-4">
                <BotonesAccion procesando={guardando} hrefCancelar="/planes-mantenimiento" />
              </CCol>
            </CRow>
          </form>
        </CCardBody>
      </CCard>

      <DialogoNuevaPlantilla
        visible={nuevaVisible}
        alCrear={usarPlantillaNueva}
        alCerrar={() => setNuevaVisible(false)}
      />
    </>
  );
}
