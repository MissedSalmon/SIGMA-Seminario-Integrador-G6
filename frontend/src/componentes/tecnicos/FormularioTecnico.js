'use client';

/**
 * Formulario de alta y de edicion de un tecnico (HU-5).
 *
 * El legajo es la clave del tecnico: se pide al dar de alta pero no se puede
 * cambiar despues (en edicion se muestra deshabilitado). Las especialidades
 * se cargan con HU-4 (ver servicios/especialidades.js): ac solo se listan y
 * se eligen, no se pueden crear especialidades nuevas desde este formulario.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormCheck,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormText,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';

export default function FormularioTecnico({ tecnico = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tecnico);

  const [legajo, setLegajo] = useState(tecnico?.legajo ?? '');
  const [nombre, setNombre] = useState(tecnico?.nombre ?? '');
  const [apellido, setApellido] = useState(tecnico?.apellido ?? '');
  const [dni, setDni] = useState(tecnico?.dni ?? '');
  const [cuil, setCuil] = useState(tecnico?.cuil ?? '');
  const [email, setEmail] = useState(tecnico?.email ?? '');
  const [telefono, setTelefono] = useState(tecnico?.telefono ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(tecnico?.fechaNacimiento ?? '');
  const [disponibilidad, setDisponibilidad] = useState(tecnico?.disponibilidad ?? 'Disponible');
  const [especialidadesElegidas, setEspecialidadesElegidas] = useState(
    tecnico?.especialidades?.map((especialidad) => especialidad.idEspecialidad) ?? []
  );

  const [especialidades, setEspecialidades] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [validado, setValidado] = useState(false);
  const [sinEspecialidad, setSinEspecialidad] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  function alternarEspecialidad(idEspecialidad) {
    setEspecialidadesElegidas((actuales) =>
      actuales.includes(idEspecialidad)
        ? actuales.filter((id) => id !== idEspecialidad)
        : [...actuales, idEspecialidad]
    );
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    const sinElegir = especialidadesElegidas.length === 0;
    setSinEspecialidad(sinElegir);

    if (
      !legajo ||
      !nombre.trim() ||
      !apellido.trim() ||
      !dni.trim() ||
      !cuil.trim() ||
      !email.trim() ||
      !fechaNacimiento ||
      sinElegir
    ) {
      return;
    }

    setGuardando(true);

    try {
      await onGuardar({
        legajo: editando ? undefined : Number(legajo),
        nombre,
        apellido,
        dni,
        cuil,
        email,
        telefono,
        fechaNacimiento,
        disponibilidad,
        especialidades: especialidadesElegidas,
      });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre} ${apellido}".`
          : `Se agrego el tecnico "${nombre} ${apellido}".`,
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

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos personales</h2>
          <CRow className="g-3 mb-4">
            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="legajo" className="sigma-obligatorio">
                Legajo
              </CFormLabel>
              <CFormInput
                id="legajo"
                type="number"
                min="1"
                value={legajo}
                onChange={(evento) => setLegajo(evento.target.value)}
                placeholder="1024"
                required
                disabled={editando}
              />
              <CFormFeedback invalid>El legajo es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={4}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Juan"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={5}>
              <CFormLabel htmlFor="apellido" className="sigma-obligatorio">
                Apellido
              </CFormLabel>
              <CFormInput
                id="apellido"
                value={apellido}
                onChange={(evento) => setApellido(evento.target.value)}
                placeholder="Perez"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El apellido es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={4}>
              <CFormLabel htmlFor="dni" className="sigma-obligatorio">
                DNI
              </CFormLabel>
              <CFormInput
                id="dni"
                value={dni}
                onChange={(evento) => setDni(evento.target.value)}
                placeholder="30123456"
                required
                pattern="\d{7,8}"
                maxLength={10}
              />
              <CFormFeedback invalid>El DNI tiene que tener 7 u 8 digitos.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={4}>
              <CFormLabel htmlFor="cuil" className="sigma-obligatorio">
                CUIL
              </CFormLabel>
              <CFormInput
                id="cuil"
                value={cuil}
                onChange={(evento) => setCuil(evento.target.value)}
                placeholder="20-30123456-4"
                required
                maxLength={13}
              />
              <CFormFeedback invalid>El CUIL tiene que tener 11 digitos.</CFormFeedback>
              <CFormText>Con o sin guiones.</CFormText>
            </CCol>

            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="fechaNacimiento" className="sigma-obligatorio">
                Fecha de nacimiento
              </CFormLabel>
              <CFormInput
                id="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(evento) => setFechaNacimiento(evento.target.value)}
                required
              />
              <CFormFeedback invalid>La fecha de nacimiento es obligatoria.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="email" className="sigma-obligatorio">
                Email
              </CFormLabel>
              <CFormInput
                id="email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="juan.perez@ejemplo.com"
                required
              />
              <CFormFeedback invalid>El email es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="telefono">Telefono</CFormLabel>
              <CFormInput
                id="telefono"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                placeholder="3624 123456"
                maxLength={50}
              />
            </CCol>
          </CRow>

          <h2 className="sigma-seccion-titulo">Especialidad y disponibilidad</h2>
          <CRow className="g-3">
            <CCol xs={12} md={7}>
              <CFormLabel className="sigma-obligatorio">Especialidades</CFormLabel>

              {especialidades.length === 0 ? (
                <Aviso
                  color="warning"
                  mensaje="Todavia no hay especialidades cargadas: hace falta al menos una para poder dar de alta un tecnico."
                />
              ) : (
                <div className={`border rounded p-3 ${sinEspecialidad ? 'border-danger' : ''}`}>
                  <div className="d-flex flex-wrap gap-3">
                    {especialidades.map((especialidad) => (
                      <CFormCheck
                        key={especialidad.idEspecialidad}
                        id={`especialidad-${especialidad.idEspecialidad}`}
                        label={especialidad.nombre}
                        checked={especialidadesElegidas.includes(especialidad.idEspecialidad)}
                        onChange={() => {
                          alternarEspecialidad(especialidad.idEspecialidad);
                          setSinEspecialidad(false);
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              {sinEspecialidad && (
                <div className="text-danger small mt-1">Hay que seleccionar al menos una especialidad.</div>
              )}
            </CCol>

            <CCol xs={12} md={5}>
              <CFormLabel htmlFor="disponibilidad" className="sigma-obligatorio">
                Disponibilidad
              </CFormLabel>
              <CFormSelect
                id="disponibilidad"
                value={disponibilidad}
                onChange={(evento) => setDisponibilidad(evento.target.value)}
                required
              >
                <option value="Disponible">Disponible</option>
                <option value="No disponible">No disponible</option>
              </CFormSelect>
              {editando && (
                <CFormText>
                  Marcar como &quot;No disponible&quot; no elimina al tecnico: sigue en el sistema con su historial.
                </CFormText>
              )}
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando || especialidades.length === 0}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar tecnico'}
            </CButton>
            <BotonEnlace href="/tecnicos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
