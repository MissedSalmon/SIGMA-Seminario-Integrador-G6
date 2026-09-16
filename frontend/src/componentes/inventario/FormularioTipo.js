'use client';

/**
 * Alta y edicion de un tipo de material o de herramienta (HU-15).
 *
 * Un tipo es la categoria con la que se ordena el deposito (cables, pinturas,
 * herramientas electricas). Va pegado a una clase: un tipo de material no
 * sirve para una herramienta, asi que la clase se elige al darlo de alta y
 * despues no se cambia.
 */
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';

const CLASES = ['Material', 'Herramienta'];

export default function FormularioTipo({ tipo = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(tipo);

  const [nombre, setNombre] = useState(tipo?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(tipo?.descripcion ?? '');
  const [clase, setClase] = useState(tipo?.clase ?? 'Material');

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

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
      await onGuardar({ nombre: nombre.trim(), descripcion: descripcion.trim(), clase });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó el tipo "${nombre}".`,
      });
      router.push('/inventario/tipos');
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
          <div className="sigma-campos mb-4">
            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder={clase === 'Herramienta' ? 'Herramientas eléctricas' : 'Cables'}
              obligatorio
              maxLength={150}
              ancho={20}
              revisado={revisado}
              error={errores.nombre}
              ayuda="Así va a aparecer en el desplegable al cargar un material o una herramienta."
            />

            <Campo
              id="clase"
              etiqueta="Clase"
              tipo="lista"
              valor={clase}
              alCambiar={setClase}
              opciones={CLASES.map((texto) => ({ valor: texto, texto }))}
              placeholder="Elegir clase"
              obligatorio
              deshabilitado={editando}
              ancho={14}
              revisado={revisado}
              ayuda={
                editando
                  ? 'La clase no se puede cambiar despues del alta.'
                  : 'Un tipo de material no sirve para una herramienta, ni al reves.'
              }
            />

            <Campo
              id="descripcion"
              etiqueta="Descripción"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Opcional: qué entra en esta categoría."
              maxLength={300}
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
            <BotonEnlace href="/inventario/tipos" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
