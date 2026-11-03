'use client';

/**
 * Formulario de alta y de edicion de un prestador de servicio (HU-25).
 *
 * Un prestador es una empresa o un profesional de afuera. Tiene uno o mas
 * tipos de prestador (HU-24), que son los trabajos que puede hacer: aca solo
 * se eligen, los tipos se cargan en su propia pantalla.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import SeleccionMultiple from '@/componentes/formulario/SeleccionMultiple.js';
import CampoCuil from '@/componentes/formulario/CampoCuil.js';
import CampoTelefono from '@/componentes/formulario/CampoTelefono.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposPrestador } from '@/servicios/tiposPrestador.js';
import { validarCuil, validarEmail, validarTelefono } from '@/utils/validaciones.js';

export default function FormularioPrestador({ prestador = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(prestador);

  const [nombre, setNombre] = useState(prestador?.nombre ?? '');
  const [cuil, setCuil] = useState(prestador?.cuil ?? '');
  const [telefono, setTelefono] = useState(prestador?.telefono ?? '');
  const [email, setEmail] = useState(prestador?.email ?? '');
  const [garantia, setGarantia] = useState(prestador?.garantia ?? '');
  const [tiposElegidos, setTiposElegidos] = useState(
    prestador?.tipos?.map((tipo) => tipo.idTipoPrestador) ?? []
  );

  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTiposPrestador()
      .then(setTipos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';

    if (!cuil.trim()) encontrados.cuil = 'El CUIL o CUIT es obligatorio.';
    else if (validarCuil(cuil, '', 'CUIL o CUIT')) encontrados.cuil = validarCuil(cuil, '', 'CUIL o CUIT');

    if (validarTelefono(telefono)) encontrados.telefono = validarTelefono(telefono);
    if (validarEmail(email)) encontrados.email = validarEmail(email);

    if (tiposElegidos.length === 0) encontrados.tipos = 'Elegí al menos un tipo de prestador.';

    return encontrados;
  }, [nombre, cuil, telefono, email, tiposElegidos]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({
        nombre: nombre.trim(),
        cuil: cuil.trim(),
        telefono: telefono.trim(),
        email: email.trim(),
        garantia: garantia.trim(),
        tipos: tiposElegidos,
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre.trim()}".`
          : `Se agregó el prestador "${nombre.trim()}".`,
      });

      router.push('/prestadores');
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

  const errorTipos = revisado ? errores.tipos : '';

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos del prestador</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Refrigeración del Norte S.R.L."
              obligatorio
              maxLength={150}
              ancho={32}
              revisado={revisado}
              error={errores.nombre}
            />

            <CampoCuil
              etiqueta="CUIL o CUIT"
              valor={cuil}
              alCambiar={setCuil}
              obligatorio
              revisado={revisado}
              error={errores.cuil}
            />

            <CampoTelefono
              valor={telefono}
              alCambiar={setTelefono}
              revisado={revisado}
              error={errores.telefono}
            />

            <Campo
              id="email"
              etiqueta="Email"
              tipoHtml="email"
              valor={email}
              alCambiar={setEmail}
              placeholder="contacto@empresa.com"
              maxLength={150}
              ancho={28}
              revisado={revisado}
              error={errores.email}
            />

            <Campo
              id="garantia"
              etiqueta="Garantía"
              valor={garantia}
              alCambiar={setGarantia}
              placeholder="6 meses en mano de obra"
              maxLength={200}
              ancho={32}
              revisado={revisado}
            />
          </div>

          <h2 className="sigma-seccion-titulo">Trabajos que realiza</h2>

          <div className="sigma-campos mb-4">
            {tipos.length === 0 ? (
              <Aviso
                color="warning"
                mensaje="Todavía no hay tipos de prestador cargados: hace falta al menos uno para poder dar de alta un prestador."
              />
            ) : (
              <SeleccionMultiple
                id="tipos"
                etiqueta="Tipos de prestador"
                opciones={tipos.map((tipo) => ({ valor: tipo.idTipoPrestador, texto: tipo.nombre }))}
                elegidos={tiposElegidos}
                alCambiar={setTiposElegidos}
                textoTodas="Todos los tipos"
                textoCantidad={(cantidad) => `${cantidad} tipos`}
                placeholder="Elegir tipos"
                obligatorio
                revisado={revisado}
                error={errorTipos}
              />
            )}
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <BotonesAccion
            procesando={guardando}
            deshabilitado={tipos.length === 0}
            hrefCancelar="/prestadores"
            className="mt-4"
          />
        </form>
      </CCardBody>
    </CCard>
  );
}
