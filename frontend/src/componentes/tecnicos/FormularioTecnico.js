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
import { CButton, CCard, CCardBody, CFormCheck, CFormLabel } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';

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
      encontrados.especialidades = 'Elegi al menos una especialidad.';
    }

    return encontrados;
  }, [legajo, nombre, especialidadesElegidas]);

  const hayErrores = Object.keys(errores).length > 0;

  function alternarEspecialidad(idEspecialidad) {
    setEspecialidadesElegidas((actuales) =>
      actuales.includes(idEspecialidad)
        ? actuales.filter((id) => id !== idEspecialidad)
        : [...actuales, idEspecialidad]
    );
  }

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
          : `Se agrego el tecnico "${nombre}".`,
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

  const errorEspecialidades = revisado ? errores.especialidades : '';

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
              anchoMinimo={8}
              anchoMaximo={12}
              revisado={revisado}
              error={errores.legajo}
              ayuda={editando ? 'El legajo identifica al tecnico y no se puede cambiar.' : ''}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Juan Perez"
              obligatorio
              maxLength={100}
              anchoMinimo={20}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="telefono"
              etiqueta="Telefono"
              tipoHtml="tel"
              valor={telefono}
              alCambiar={setTelefono}
              placeholder="3624 123456"
              maxLength={50}
              anchoMinimo={14}
              anchoMaximo={20}
              revisado={revisado}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Especialidad y disponibilidad</h2>

          <div className="sigma-campos mb-4">
            {/*
              Las especialidades son varias casillas y no una caja, asi que no
              entran en <Campo>. Se arman a mano con las mismas clases, para que
              el recuadro y la marca de error queden igual que en el resto.
            */}
            <div
              className={`sigma-campo sigma-campo--ancho${errorEspecialidades ? ' sigma-campo--error' : ''}`}
            >
              <CFormLabel className="sigma-obligatorio">Especialidades</CFormLabel>

              {especialidades.length === 0 ? (
                <Aviso
                  color="warning"
                  mensaje="Todavia no hay especialidades cargadas: hace falta al menos una para poder dar de alta un tecnico."
                />
              ) : (
                <>
                  <div className="sigma-campo-opciones">
                    {especialidades.map((especialidad) => (
                      <CFormCheck
                        key={especialidad.idEspecialidad}
                        id={`especialidad-${especialidad.idEspecialidad}`}
                        label={especialidad.nombre}
                        checked={especialidadesElegidas.includes(especialidad.idEspecialidad)}
                        onChange={() => alternarEspecialidad(especialidad.idEspecialidad)}
                      />
                    ))}
                  </div>
                  <p
                    className={`sigma-campo-mensaje${errorEspecialidades ? ' sigma-campo-mensaje--error' : ''}`}
                  >
                    {errorEspecialidades || 'Un tecnico puede tener mas de una.'}
                  </p>
                </>
              )}
            </div>

            <Campo
              id="disponibilidad"
              etiqueta="Disponibilidad"
              tipo="lista"
              valor={disponibilidad}
              alCambiar={setDisponibilidad}
              opciones={DISPONIBILIDADES.map((texto) => ({ valor: texto, texto }))}
              obligatorio
              anchoMinimo={14}
              revisado={revisado}
              ayuda={
                editando
                  ? 'Marcarlo como "No disponible" no lo elimina: sigue en el sistema con su historial.'
                  : ''
              }
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisa los campos marcados y volve a guardar.
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
