'use client';

/**
 * Alta y edición de una plantilla de tareas (HU-12).
 *
 * Una plantilla es una tarea modelo que va pegada a la especialidad que la
 * hace: "limpiar los filtros" es de refrigeración, "revisar el cableado" de
 * electricidad. Con eso se buscan los técnicos de esa especialidad al asignar.
 * Son sólo dos datos: de qué especialidad es, y qué hay que hacer.
 *
 * Los campos usan <Campo>, así que las cajas miden lo que mide su contenido y
 * la validación marca cada campo en chico, sin pintar toda la caja de verde o
 * de rojo. Ver src/componentes/formulario/Campo.js.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';

export default function FormularioPlantilla({ plantilla = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(plantilla);

  const [idEspecialidad, setIdEspecialidad] = useState(
    plantilla?.idEspecialidad ? String(plantilla.idEspecialidad) : '',
  );
  const [descripcion, setDescripcion] = useState(plantilla?.descripcion ?? '');

  const [especialidades, setEspecialidades] = useState([]);
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahí en más se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!idEspecialidad) encontrados.idEspecialidad = 'Elegí la especialidad que la hace.';
    if (!descripcion.trim()) encontrados.descripcion = 'Escribí qué hay que hacer.';

    return encontrados;
  }, [idEspecialidad, descripcion]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);
    try {
      await onGuardar({
        idEspecialidad: Number(idEspecialidad),
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

  const opcionesEspecialidades = especialidades.map((una) => ({
    valor: String(una.idEspecialidad),
    texto: una.nombre,
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <div className="sigma-campos mb-4">
            <Campo
              id="idEspecialidad"
              etiqueta="Especialidad"
              tipo="lista"
              valor={idEspecialidad}
              alCambiar={setIdEspecialidad}
              opciones={opcionesEspecialidades}
              placeholder="Elegir especialidad"
              obligatorio
              ancho={24}
              revisado={revisado}
              error={errores.idEspecialidad}
            />

            <Campo
              id="descripcion"
              etiqueta="Tarea"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Ej: limpiar los filtros"
              obligatorio
              maxLength={200}
              ancho={36}
              revisado={revisado}
              error={errores.descripcion}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <BotonesAccion procesando={guardando} hrefCancelar="/plantillas-tareas" className="mt-4" />
        </form>
      </CCardBody>
    </CCard>
  );
}
