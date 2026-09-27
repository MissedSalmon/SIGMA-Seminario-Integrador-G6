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
 * 3. La fecha de nacimiento es obligatoria y tiene que dar 18 anios cumplidos:
 *    un responsable de area firma el alta de tickets, asi que tiene que ser
 *    mayor de edad. Si la fecha se pudiera dejar vacia, la regla no serviria de
 *    nada, porque alcanzaria con no completarla.
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
import { hoyTexto, fechaMinimaParaEdad } from '@/utils/fechas.js';
import { LARGO_TELEFONO, digitosDelTelefono, limpiarTelefono } from '@/utils/telefono.js';

/** Deja solo los digitos, para poder contarlos sin importar puntos ni guiones. */
function soloDigitos(texto) {
  return String(texto ?? '').replace(/\D/g, '');
}

/** Los anios que hay que tener cumplidos para quedar registrado. */
const EDAD_MINIMA = 18;

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

  /*
   * La fecha de nacimiento mas reciente que ya da los 18 cumplidos. Se calcula
   * una sola vez por pantalla: se usa para validar y tambien como tope del
   * almanaque, asi el que carga ni siquiera puede elegir una fecha mas nueva.
   */
  const fechaMinimaNacimiento = useMemo(() => fechaMinimaParaEdad(EDAD_MINIMA), []);

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

    /*
     * Se cuentan los digitos de lo que hay guardado y no los de la caja: un
     * telefono cargado antes de esta regla puede tener espacios o guiones, y
     * hay que avisar igual si le faltan o le sobran numeros.
     */
    const digitosTelefono = digitosDelTelefono(telefono);
    if (digitosTelefono && digitosTelefono.length !== LARGO_TELEFONO) {
      encontrados.telefono = `El telefono tiene ${LARGO_TELEFONO} digitos y este tiene ${digitosTelefono.length}.`;
    }

    if (!fechaNacimiento) {
      encontrados.fechaNacimiento = 'La fecha de nacimiento es obligatoria.';
    } else if (fechaNacimiento > hoyTexto()) {
      encontrados.fechaNacimiento = 'La fecha no puede ser posterior a hoy.';
    } else if (fechaNacimiento > fechaMinimaNacimiento) {
      encontrados.fechaNacimiento = `Tiene que tener ${EDAD_MINIMA} anios cumplidos: con esa fecha todavia no los cumplio.`;
    }

    return encontrados;
  }, [legajo, nombre, idArea, dni, cuil, email, telefono, fechaNacimiento, fechaMinimaNacimiento]);

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
        fechaNacimiento,
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
              obligatorio
              max={fechaMinimaNacimiento}
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
              tipoHtml="tel"
              valor={telefono}
              alCambiar={(valor) => setTelefono(limpiarTelefono(valor))}
              placeholder="3624123456"
              maxLength={LARGO_TELEFONO}
              anchoMinimo={LARGO_TELEFONO + 2}
              anchoMaximo={LARGO_TELEFONO + 2}
              revisado={revisado}
              error={errores.telefono}
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
              placeholder={areas.length === 0 ? 'No hay áreas libres' : 'Elegí el área...'}
              deshabilitado={areas.length === 0}
              obligatorio
              anchoMinimo={24}
              revisado={revisado}
              error={errores.idArea}
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
