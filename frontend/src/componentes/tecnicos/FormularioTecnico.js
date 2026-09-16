'use client';

/**
 * Formulario de alta y de edicion de un tecnico (HU-5).
 *
 * El legajo es la clave del tecnico: se pide al dar de alta pero no se puede
 * cambiar despues (en edicion se muestra deshabilitado). Las especialidades
 * se cargan con HU-4 (ver servicios/especialidades.js): aca solo se listan y
 * se eligen, no se pueden crear especialidades nuevas desde este formulario.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import CampoTelefono from '@/componentes/formulario/CampoTelefono.js';
import SeleccionMultiple from '@/componentes/formulario/SeleccionMultiple.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';
import { validarTelefono } from '@/utils/validaciones.js';

const DISPONIBILIDADES = ['Disponible', 'No disponible'];

export default function FormularioTecnico({ tecnico = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tecnico);

  const [legajo, setLegajo] = useState(tecnico?.legajo ?? '');
  const [nombre, setNombre] = useState(tecnico?.nombre ?? '');
  const [telefono, setTelefono] = useState(tecnico?.telefono ?? '');
  const [disponibilidad, setDisponibilidad] = useState(tecnico?.disponibilidad ?? 'Disponible');
  const [especialidadesElegidas, setEspecialidadesElegidas] = useState(
    tecnico?.especialidades?.map((especialidad) => especialidad.idEspecialidad) ?? []
  );

  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!String(legajo).trim()) encontrados.legajo = 'El legajo es obligatorio.';
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    if (especialidadesElegidas.length === 0) {
      encontrados.especialidades = 'Elegí al menos una especialidad.';
    }

    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) encontrados.telefono = errorTelefono;

    return encontrados;
  }, [legajo, nombre, telefono, especialidadesElegidas]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({
        legajo: editando ? undefined : Number(legajo),
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        disponibilidad,
        especialidades: especialidadesElegidas,
      });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó el tecnico "${nombre}".`,
      });
      router.push('/tecnicos');
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

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos personales</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="legajo"
              etiqueta="Legajo"
              tipoHtml="number"
              min="1"
              valor={legajo}
              alCambiar={setLegajo}
              placeholder="1024"
              obligatorio
              deshabilitado={editando}
              ancho={8}
              revisado={revisado}
              error={errores.legajo}
              ayuda={editando ? 'No se puede cambiar.' : ''}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Juan Perez"
              obligatorio
              maxLength={100}
              ancho={20}
              revisado={revisado}
              error={errores.nombre}
            />

            <CampoTelefono
              valor={telefono}
              alCambiar={setTelefono}
              revisado={revisado}
              error={errores.telefono}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Especialidad y disponibilidad</h2>

          <div className="sigma-campos mb-4">
            {especialidades.length === 0 ? (
              <Aviso
                color="warning"
                mensaje="Todavía no hay especialidades cargadas: hace falta al menos una para poder dar de alta un técnico."
              />
            ) : (
              <SeleccionMultiple
                id="especialidades"
                etiqueta="Especialidades"
                opciones={especialidades.map((especialidad) => ({
                  valor: especialidad.idEspecialidad,
                  texto: especialidad.nombre,
                }))}
                elegidos={especialidadesElegidas}
                alCambiar={setEspecialidadesElegidas}
                textoTodas="Todas las especialidades"
                placeholder="Seleccionar especialidades"
                obligatorio
                revisado={revisado}
                error={errores.especialidades}
              />
            )}

            <Campo
              id="disponibilidad"
              etiqueta="Disponibilidad"
              tipo="lista"
              valor={disponibilidad}
              alCambiar={setDisponibilidad}
              opciones={DISPONIBILIDADES.map((texto) => ({ valor: texto, texto }))}
              placeholder="Elegir disponibilidad"
              obligatorio
              ancho={14}
              revisado={revisado}
              ayuda={editando ? '"No disponible" no lo elimina: queda con su historial.' : ''}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton
              type="submit"
              color="primary"
              disabled={guardando || especialidades.length === 0}
            >
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/tecnicos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
