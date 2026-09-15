'use client';

/**
 * Formulario de alta y de edicion de un edificio (HU-1).
 *
 * Es el mismo formulario para las dos cosas: si recibe `edificio`, arranca con
 * los datos cargados y edita; si no, arranca vacio y da de alta. Asi los
 * campos y las validaciones se escriben una sola vez.
 *
 * Los campos usan <Campo>, asi que las cajas miden lo que mide su contenido y
 * la validacion marca cada campo en chico, sin pintar toda la caja de verde o
 * de rojo. Ver src/componentes/formulario/Campo.js.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

export default function FormularioEdificio({ edificio = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(edificio);

  const [nombre, setNombre] = useState(edificio?.nombre ?? '');
  const [direccion, setDireccion] = useState(edificio?.direccion ?? '');

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   * El backend igual vuelve a validar: es el que manda.
   */
  const errores = useMemo(() => {
    const encontrados = {};
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    return encontrados;
  }, [nombre]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre: nombre.trim(), direccion: direccion.trim() });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó el edificio "${nombre}".`,
      });
      router.push('/edificios');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos del edificio</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Edificio Central"
              obligatorio
              maxLength={100}
              ancho={18}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="direccion"
              etiqueta="Dirección"
              valor={direccion}
              alCambiar={setDireccion}
              placeholder="French 414, Resistencia"
              maxLength={200}
              ancho={24}
              revisado={revisado}
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
            <BotonEnlace href="/edificios" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
