'use client';

/**
 * Alta y edición de una plantilla de tareas (HU-12).
 *
 * Una plantilla es una tarea modelo que va pegada a un tipo de activo: "limpiar
 * los filtros" para los aires, "revisar el cableado" para las luminarias. Por
 * eso son sólo dos datos: de qué tipo de activo es, y qué hay que hacer.
 *
 * Los campos usan <Campo>, así que las cajas miden lo que mide su contenido y
 * la validación marca cada campo en chico, sin pintar toda la caja de verde o
 * de rojo. Ver src/componentes/formulario/Campo.js.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposActivos } from '@/servicios/tiposActivos.js';

export default function FormularioPlantilla({ plantilla = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(plantilla);

  const [idTipoActivo, setIdTipoActivo] = useState(plantilla?.idTipoActivo ?? '');
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? '');

  const [tipos, setTipos] = useState([]);
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTiposActivos()
      .then(setTipos)
      .catch((fallo) => setError(fallo.message));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahí en más se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!idTipoActivo) encontrados.idTipoActivo = 'Elegí a qué tipo de activo pertenece.';
    if (!descripcion.trim()) encontrados.descripcion = 'Escribí qué hay que hacer.';

    return encontrados;
  }, [idTipoActivo, descripcion]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);
    try {
      await onGuardar({
        idTipoActivo: Number(idTipoActivo),
        descripcion: descripcion.trim(),
      });

      mostrarToast({
        tipo: 'exito',
        mensaje: editando ? 'Se guardaron los cambios.' : 'Se agregó la plantilla.',
      });
      router.push('/plantillas-tareas');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const opcionesTipos = tipos.map((tipo) => ({
    valor: tipo.idTipoActivo,
    texto: tipo.nombre,
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <div className="sigma-campos mb-4">
            <Campo
              id="idTipoActivo"
              etiqueta="Tipo de activo"
              tipo="lista"
              valor={idTipoActivo}
              alCambiar={setIdTipoActivo}
              opciones={opcionesTipos}
              placeholder="Elegir tipo"
              obligatorio
              revisado={revisado}
              error={errores.idTipoActivo}
              ayuda="La tarea se va a precargar en las OT de los activos de este tipo."
            />

            <Campo
              id="descripcion"
              etiqueta="Tarea"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Ej: limpiar los filtros"
              obligatorio
              maxLength={200}
              anchoMaximo={60}
              revisado={revisado}
              error={errores.descripcion}
              ayuda="Una tarea por plantilla, escrita como una instrucción."
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
            <BotonEnlace href="/plantillas-tareas" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
