'use client';

/**
 * Formulario de alta y de edicion de un usuario autorizado (HU-8).
 *
 * Dos cosas que conviene saber antes de tocarlo:
 *
 * 1. El legajo identifica a la persona, asi que en la edicion se muestra pero
 *    no se puede cambiar.
 * 2. El area es obligatoria: es lo que habilita a cargar tickets sobre los
 *    activos de esa area (HU-9). Un area tiene un solo responsable, asi que el
 *    desplegable muestra unicamente las areas libres (y la propia, cuando se
 *    esta editando). Asi no hace falta rechazar el alta despues.
 */
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
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
import { listarAreas } from '@/servicios/areas.js';
import { listarAutorizados } from '@/servicios/autorizados.js';

/** Deja solo los digitos, para poder contarlos sin importar puntos ni guiones. */
function soloDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/** La fecha de hoy en el formato que entiende un <input type="date">. */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function FormularioAutorizado({ autorizado = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(autorizado);

  const [legajo, setLegajo] = useState(autorizado?.legajo ?? '');
  const [nombre, setNombre] = useState(autorizado?.nombre ?? '');
  const [dni, setDni] = useState(autorizado?.dni ?? '');
  const [cuil, setCuil] = useState(autorizado?.cuil ?? '');
  const [email, setEmail] = useState(autorizado?.email ?? '');
  const [telefono, setTelefono] = useState(autorizado?.telefono ?? '');
  const [fechaNacimiento, setFechaNacimiento] = useState(autorizado?.fechaNacimiento ?? '');
  const [idArea, setIdArea] = useState(autorizado?.idArea ? String(autorizado.idArea) : '');

  const [areas, setAreas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [validado, setValidado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  /*
   * Las areas para elegir. De cada usuario autorizado ya cargado se mira cual
   * tiene a cargo, para dejar afuera las que ya tienen responsable. La propia
   * se conserva: si no, al editar no se veria el area actual.
   */
  useEffect(() => {
    Promise.all([listarAreas(), listarAutorizados()])
      .then(([listaAreas, listaAutorizados]) => {
        const tomadas = listaAutorizados
          .filter((otro) => otro.idArea && otro.legajo !== autorizado?.legajo)
          .map((otro) => otro.idArea);

        setAreas(listaAreas.filter((area) => !tomadas.includes(area.idArea)));
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [autorizado?.legajo]);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    const digitosDni = soloDigitos(dni);
    const digitosCuil = soloDigitos(cuil);

    if (
      !String(legajo).trim() ||
      !nombre.trim() ||
      !idArea ||
      (digitosDni && (digitosDni.length < 7 || digitosDni.length > 8)) ||
      (digitosCuil && digitosCuil.length !== 11) ||
      (email.trim() && !email.includes('@')) ||
      (fechaNacimiento && fechaNacimiento > hoy())
    ) {
      return;
    }

    setGuardando(true);

    try {
      await onGuardar({
        legajo: editando ? undefined : String(legajo).trim(),
        nombre: nombre.trim(),
        dni,
        cuil,
        email,
        telefono,
        fechaNacimiento: fechaNacimiento || null,
        idArea: Number(idArea),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agrego el usuario autorizado "${nombre}".`,
      });

      router.push('/autorizados');
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

  // Sin area no se puede registrar a nadie: es lo que lo habilita a cargar tickets.
  if (areas.length === 0) {
    return (
      <>
        <Aviso
          color="warning"
          mensaje="No hay areas disponibles para asignar: o todavia no se cargo ninguna, o todas ya tienen un responsable. Carga un area nueva o sacale el area a quien la tenga."
        />
        <BotonEnlace href="/areas" color="secondary" variante="outline">
          Ir a areas
        </BotonEnlace>
      </>
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
                value={legajo}
                onChange={(evento) => setLegajo(evento.target.value)}
                placeholder="1024"
                required
                maxLength={50}
                disabled={editando}
              />
              <CFormFeedback invalid>El legajo es obligatorio.</CFormFeedback>
              {editando && <CFormText>El legajo identifica a la persona y no se puede cambiar.</CFormText>}
            </CCol>

            <CCol xs={12} md={5}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre y apellido
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Juan Perez"
                required
                maxLength={150}
              />
              <CFormFeedback invalid>El nombre y apellido es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={4}>
              <CFormLabel htmlFor="fechaNacimiento">Fecha de nacimiento</CFormLabel>
              <CFormInput
                id="fechaNacimiento"
                type="date"
                value={fechaNacimiento}
                onChange={(evento) => setFechaNacimiento(evento.target.value)}
                max={hoy()}
              />
              <CFormFeedback invalid>La fecha no puede ser posterior a hoy.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="dni">DNI</CFormLabel>
              <CFormInput
                id="dni"
                inputMode="numeric"
                pattern="\d{7,8}"
                value={dni}
                onChange={(evento) => setDni(evento.target.value)}
                placeholder="20345678"
                maxLength={8}
              />
              <CFormFeedback invalid>El DNI tiene 7 u 8 digitos.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="cuil">CUIL</CFormLabel>
              <CFormInput
                id="cuil"
                inputMode="numeric"
                pattern="\d{11}"
                value={cuil}
                onChange={(evento) => setCuil(evento.target.value)}
                placeholder="20203456783"
                maxLength={11}
              />
              <CFormFeedback invalid>El CUIL tiene 11 digitos.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="email">Email</CFormLabel>
              <CFormInput
                id="email"
                type="email"
                value={email}
                onChange={(evento) => setEmail(evento.target.value)}
                placeholder="jperez@frre.utn.edu.ar"
                maxLength={150}
              />
              <CFormFeedback invalid>Revisa el email: falta el @ o esta incompleto.</CFormFeedback>
            </CCol>

            <CCol xs={12} md={4}>
              <CFormLabel htmlFor="telefono">Telefono</CFormLabel>
              <CFormInput
                id="telefono"
                value={telefono}
                onChange={(evento) => setTelefono(evento.target.value)}
                placeholder="3624 123456"
                maxLength={30}
              />
            </CCol>
          </CRow>

          <h2 className="sigma-seccion-titulo">Area a cargo</h2>

          <CRow className="g-3">
            <CCol xs={12} md={6}>
              <CFormLabel htmlFor="idArea" className="sigma-obligatorio">
                Area
              </CFormLabel>
              <CFormSelect
                id="idArea"
                value={idArea}
                onChange={(evento) => setIdArea(evento.target.value)}
                required
              >
                <option value="">Elegi el area...</option>
                {areas.map((area) => (
                  <option key={area.idArea} value={area.idArea}>
                    {area.nombre}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir el area de la que es responsable.</CFormFeedback>
              <CFormText>
                Queda habilitado para cargar tickets sobre los activos de esta area. Solo se listan
                las areas que todavia no tienen responsable.
              </CFormText>
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar usuario autorizado'}
            </CButton>
            <BotonEnlace href="/autorizados" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
