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
    if (!idArea) encontrados.idArea = 'Hay que elegir el area de la que es responsable.';

    const digitosDni = soloDigitos(dni);
    if (digitosDni && (digitosDni.length < 7 || digitosDni.length > 8)) {
      encontrados.dni = 'El DNI tiene 7 u 8 digitos.';
    }

    const digitosCuil = soloDigitos(cuil);
    if (digitosCuil && digitosCuil.length !== 11) {
      encontrados.cuil = 'El CUIL tiene 11 digitos.';
    }

    if (email.trim() && !email.includes('@')) {
      encontrados.email = 'Revisa el email: falta el @ o esta incompleto.';
    }

    if (fechaNacimiento && fechaNacimiento > hoy()) {
      encontrados.fechaNacimiento = 'La fecha no puede ser posterior a hoy.';
    }

    return encontrados;
  }, [legajo, nombre, idArea, dni, cuil, email, fechaNacimiento]);

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
              anchoMinimo={8}
              revisado={revisado}
              error={errores.legajo}
              ayuda={editando ? 'El legajo identifica a la persona y no se puede cambiar.' : ''}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre y apellido"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Juan Perez"
              obligatorio
              maxLength={150}
              anchoMinimo={24}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="fechaNacimiento"
              etiqueta="Fecha de nacimiento"
              tipoHtml="date"
              valor={fechaNacimiento}
              alCambiar={setFechaNacimiento}
              max={hoy()}
              revisado={revisado}
              error={errores.fechaNacimiento}
            />

            <Campo
              id="dni"
              etiqueta="DNI"
              valor={dni}
              alCambiar={setDni}
              placeholder="20345678"
              maxLength={8}
              anchoMinimo={10}
              revisado={revisado}
              error={errores.dni}
            />

            <Campo
              id="cuil"
              etiqueta="CUIL"
              valor={cuil}
              alCambiar={setCuil}
              placeholder="20203456783"
              maxLength={11}
              anchoMinimo={13}
              revisado={revisado}
              error={errores.cuil}
            />

            <Campo
              id="email"
              etiqueta="Email"
              tipoHtml="email"
              valor={email}
              alCambiar={setEmail}
              placeholder="jperez@frre.utn.edu.ar"
              maxLength={150}
              anchoMinimo={24}
              revisado={revisado}
              error={errores.email}
            />

            <Campo
              id="telefono"
              etiqueta="Telefono"
              valor={telefono}
              alCambiar={setTelefono}
              placeholder="3624 123456"
              maxLength={30}
              anchoMinimo={14}
              revisado={revisado}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Area a cargo</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="idArea"
              etiqueta="Area"
              tipo="lista"
              valor={idArea}
              alCambiar={setIdArea}
              opciones={areas.map((area) => ({ valor: area.idArea, texto: area.nombre }))}
              placeholder="Elegi el area..."
              obligatorio
              anchoMinimo={24}
              revisado={revisado}
              error={errores.idArea}
              ayuda="Queda habilitado para cargar tickets sobre los activos de esta area. Solo se listan las areas que todavia no tienen responsable."
            />
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
            <BotonEnlace href="/autorizados" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
