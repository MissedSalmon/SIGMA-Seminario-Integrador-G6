'use client';

/**
 * Ventana para que el técnico cargue la falla que encontró en su tarea
 * (10/11/2026).
 *
 * - Es opcional: la tarea se puede finalizar sin falla.
 * - Sólo mientras la tarea está en ejecución (la API lo vuelve a controlar).
 * - Hay una sola falla por tarea: si ya tenía una, la ventana arranca con sus
 *   datos y al guardar se reemplaza.
 * - El tipo sale del catálogo de tipos de falla.
 *
 * Se abre montándola y se cierra desmontándola, así cada vez arranca limpia.
 */
import { useEffect, useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarTiposDeFalla, registrarFallaDeTarea } from '@/servicios/tareas.js';

export default function DialogoFalla({ idOt, idTarea, fallaActual, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();

  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [tipo, setTipo] = useState(fallaActual?.tipo ?? '');
  const [descripcion, setDescripcion] = useState(fallaActual?.descripcion ?? '');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarTiposDeFalla()
      .then(setTipos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const errores = {};
  if (!tipo) errores.tipo = 'Elegí el tipo de falla.';
  if (!descripcion.trim()) errores.descripcion = 'Describí la falla.';
  const hayErrores = Object.keys(errores).length > 0;

  async function guardar() {
    setError('');
    setRevisado(true);
    if (hayErrores) return;

    setGuardando(true);
    try {
      const tarea = await registrarFallaDeTarea(idOt, idTarea, { tipo, descripcion });
      mostrarToast({ tipo: 'exito', mensaje: 'La falla quedó registrada en la tarea.' });
      onGuardado(tarea);
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>{fallaActual ? 'Editar la falla' : 'Registrar una falla'}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        {cargando ? (
          <Cargando texto="Cargando los tipos de falla..." />
        ) : (
          <>
            <Campo
              id="tipo-falla"
              etiqueta="Tipo de falla"
              tipo="lista"
              valor={tipo}
              alCambiar={setTipo}
              opciones={tipos.map((uno) => ({ valor: uno, texto: uno }))}
              placeholder="Seleccionar"
              obligatorio
              ancho={20}
              revisado={revisado}
              error={errores.tipo}
            />
            <Campo
              id="descripcion-falla"
              etiqueta="Descripción"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              maxLength={1000}
              obligatorio
              revisado={revisado}
              error={errores.descripcion}
            />
          </>
        )}
      </CModalBody>

      <CModalFooter>
        <BotonesAccion
          procesando={guardando}
          deshabilitado={cargando}
          alAceptar={guardar}
          alCancelar={onCerrar}
        />
      </CModalFooter>
    </CModal>
  );
}
