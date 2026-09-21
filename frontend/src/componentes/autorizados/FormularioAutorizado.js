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
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import Campo from '@/componentes/formulario/Campo.js';
import CampoCuil from '@/componentes/formulario/CampoCuil.js';
import CampoDni from '@/componentes/formulario/CampoDni.js';
import CampoTelefono from '@/componentes/formulario/CampoTelefono.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarAreas } from '@/servicios/areas.js';
import { listarAutorizados } from '@/servicios/autorizados.js';
import { validarCuil, validarDni, validarEmail, validarTelefono } from '@/utils/validaciones.js';

/** La fecha de hoy en el formato que entiende un <input type="date">. */
function hoy() {
  return new Date().toISOString().slice(0, 10);
}

function fechaHace18Anios() {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 18);
  return d.toISOString().slice(0, 10);
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

  const [revisado, setRevisado] = useState(false);
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

  const errores = useMemo(() => {
    const encontrados = {};

    if (!String(legajo).trim()) encontrados.legajo = 'El legajo es obligatorio.';
    if (!nombre.trim()) encontrados.nombre = 'El nombre y apellido es obligatorio.';
    if (!idArea) encontrados.idArea = 'Hay que elegir el área de la que es responsable.';

    // Las reglas de estos campos son las mismas en todo el sistema.
    if (!String(dni).trim()) {
      encontrados.dni = 'El DNI es obligatorio.';
    } else {
      const errorDni = validarDni(dni);
      if (errorDni) encontrados.dni = errorDni;
    }

    const errorCuil = validarCuil(cuil, dni);
    if (errorCuil) encontrados.cuil = errorCuil;

    const errorTelefono = validarTelefono(telefono);
    if (errorTelefono) encontrados.telefono = errorTelefono;

    const errorEmail = validarEmail(email);
    if (errorEmail) encontrados.email = errorEmail;

    if (!fechaNacimiento) {
      encontrados.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
    } else if (fechaNacimiento > hoy()) {
      encontrados.fechaNacimiento = 'La fecha no puede ser posterior a hoy.';
    } else if (fechaNacimiento > fechaHace18Anios()) {
      encontrados.fechaNacimiento = 'El usuario autorizado debe tener al menos 18 años.';
    }

    return encontrados;
  }, [legajo, nombre, idArea, dni, cuil, telefono, email, fechaNacimiento]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');

    if (hayErrores) {
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
          : `Se agregó el usuario autorizado "${nombre}".`,
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
              valor={legajo}
              alCambiar={setLegajo}
              placeholder="1024"
              obligatorio
              maxLength={50}
              deshabilitado={editando}
              ancho={8}
              revisado={revisado}
              error={errores.legajo}
              ayuda={editando ? 'No se puede cambiar.' : ''}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre y Apellido"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Juan Perez"
              obligatorio
              maxLength={150}
              ancho={24}
              revisado={revisado}
              error={errores.nombre}
            />

            <CampoDni
              valor={dni}
              alCambiar={setDni}
              obligatorio
              revisado={revisado}
              error={errores.dni}
            />

            <CampoCuil valor={cuil} alCambiar={setCuil} revisado={revisado} error={errores.cuil} />

            <Campo
              id="fechaNacimiento"
              etiqueta="Fecha de nacimiento"
              tipoHtml="date"
              valor={fechaNacimiento}
              alCambiar={setFechaNacimiento}
              max={fechaHace18Anios()}
              obligatorio
              revisado={revisado}
              error={errores.fechaNacimiento}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Contacto</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="email"
              etiqueta="Email"
              tipoHtml="email"
              valor={email}
              alCambiar={setEmail}
              placeholder="jperez@frre.utn.edu.ar"
              maxLength={150}
              ancho={24}
              revisado={revisado}
              error={errores.email}
            />

            <CampoTelefono
              valor={telefono}
              alCambiar={setTelefono}
              revisado={revisado}
              error={errores.telefono}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Área a cargo</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="idArea"
              etiqueta="Área"
              tipo="lista"
              valor={idArea}
              alCambiar={setIdArea}
              opciones={areas.map((area) => ({ valor: area.idArea, texto: area.nombre }))}
              placeholder={areas.length === 0 ? 'No hay áreas libres' : 'Elegí el área...'}
              deshabilitado={areas.length === 0}
              obligatorio
              ancho={24}
              revisado={revisado}
              error={errores.idArea}
              ayuda={areas.length === 0 ? "No hay áreas libres: cargá una nueva o sacásela a otro responsable." : "Solo se listan las áreas que todavía no tienen responsable."}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/autorizados" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
