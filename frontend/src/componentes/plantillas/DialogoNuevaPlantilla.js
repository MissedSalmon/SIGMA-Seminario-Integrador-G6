'use client';

/**
 * Ventana para crear una tarea estándar sin salir del formulario en el que se
 * la necesita (la tarea de una OT o el plan preventivo). Queda guardada como
 * plantilla, la misma que se ve en "Plantillas de tareas", y se le avisa al
 * formulario con `alCrear` para que la elija.
 *
 *   <DialogoNuevaPlantilla
 *     visible={nuevaVisible}
 *     alCrear={(plantilla) => ...}
 *     alCerrar={() => setNuevaVisible(false)}
 *   />
 */
import { useEffect, useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspecialidades } from '@/servicios/especialidades.js';
import { crearPlantilla } from '@/servicios/plantillasTareas.js';

export default function DialogoNuevaPlantilla({ visible, alCrear, alCerrar }) {
  const { mostrarToast } = useToast();

  const [especialidades, setEspecialidades] = useState([]);
  const [idEspecialidad, setIdEspecialidad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [error, setError] = useState('');
  const [creando, setCreando] = useState(false);

  useEffect(() => {
    if (!visible || especialidades.length > 0) return;
    listarEspecialidades()
      .then(setEspecialidades)
      .catch((fallo) => setError(fallo.message));
  }, [visible, especialidades.length]);

  function cerrar() {
    if (creando) return;
    setIdEspecialidad('');
    setDescripcion('');
    setError('');
    alCerrar();
  }

  async function crear() {
    if (!idEspecialidad) {
      setError('Elegí la especialidad que la hace.');
      return;
    }
    if (!descripcion.trim()) {
      setError('Escribí la tarea.');
      return;
    }

    setCreando(true);
    setError('');
    try {
      const nueva = await crearPlantilla({ idEspecialidad: Number(idEspecialidad), descripcion: descripcion.trim() });
      mostrarToast({ tipo: 'exito', mensaje: 'Se agregó la tarea estándar.' });
      alCrear(nueva);
      setIdEspecialidad('');
      setDescripcion('');
      alCerrar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setCreando(false);
    }
  }

  return (
    <CModal visible={visible} onClose={cerrar} alignment="center">
      <CModalHeader>
        <CModalTitle>Nueva tarea estándar</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <Aviso mensaje={error} />
        <Campo
          id="nuevaEspecialidad"
          etiqueta="Especialidad"
          tipo="lista"
          valor={idEspecialidad}
          alCambiar={setIdEspecialidad}
          opciones={especialidades.map((una) => ({ valor: String(una.idEspecialidad), texto: una.nombre }))}
          placeholder="Elegir especialidad"
          obligatorio
          ancho={24}
        />
        <Campo
          id="nuevaTareaEstandar"
          etiqueta="Descripción"
          tipo="area"
          filas={3}
          valor={descripcion}
          alCambiar={setDescripcion}
          placeholder="Ej: limpiar los filtros"
          obligatorio
          maxLength={200}
        />
      </CModalBody>
      <CModalFooter>
        <BotonesAccion procesando={creando} alAceptar={crear} alCancelar={cerrar} />
      </CModalFooter>
    </CModal>
  );
}
