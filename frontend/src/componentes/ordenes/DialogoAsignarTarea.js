'use client';

/**
 * Asignar una tarea de la OT que no tiene responsable, desde su ficha y sin
 * pasar por «Editar» (22/11/2026). Se elige un técnico o un prestador con las
 * mismas reglas del formulario de la tarea: sólo los técnicos activos con la
 * especialidad de la tarea estándar. El resto de la tarea no cambia.
 *
 * Se abre montándola y se cierra desmontándola, así cada vez arranca limpia.
 */
import { useEffect, useMemo, useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { textoDelTecnico } from '@/componentes/ordenes/FormularioTareaOT.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { actualizarTarea } from '@/servicios/ordenesTrabajo.js';
import { listarPlantillas } from '@/servicios/plantillasTareas.js';
import { listarPrestadores } from '@/servicios/prestadores.js';
import { listarTecnicos } from '@/servicios/tecnicos.js';

const TIPOS = ['Técnico', 'Prestador'];

export default function DialogoAsignarTarea({ idOt, tarea, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();

  const [tipo, setTipo] = useState('Técnico');
  const [legajo, setLegajo] = useState('');
  const [idPrestador, setIdPrestador] = useState('');

  const [tecnicos, setTecnicos] = useState([]);
  const [prestadores, setPrestadores] = useState([]);
  const [plantillas, setPlantillas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarTecnicos(), listarPrestadores(), listarPlantillas()])
      .then(([listaTecnicos, listaPrestadores, listaPlantillas]) => {
        setTecnicos(listaTecnicos);
        setPrestadores(listaPrestadores);
        setPlantillas(listaPlantillas);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const plantilla = plantillas.find((una) => String(una.idPlantilla) === String(tarea.idPlantilla));
  const idEspecialidad = plantilla?.idEspecialidad ?? null;

  const tecnicosAptos = useMemo(
    () =>
      tecnicos.filter(
        (tecnico) =>
          tecnico.activo !== false &&
          (!idEspecialidad || (tecnico.especialidades ?? []).some((una) => una.idEspecialidad === idEspecialidad))
      ),
    [tecnicos, idEspecialidad]
  );

  const elegido = tipo === 'Técnico' ? legajo : tipo === 'Prestador' ? idPrestador : '';
  const errorTipo = revisado && !tipo ? 'Elegí quién la hace.' : '';
  const errorElegido = revisado && tipo && !elegido ? `Elegí el ${tipo === 'Técnico' ? 'técnico' : 'prestador'} que la va a hacer.` : '';

  async function guardar() {
    setRevisado(true);
    setError('');
    if (!tipo || !elegido) return;

    setGuardando(true);
    try {
      await actualizarTarea(idOt, tarea.idTarea, {
        descripcion: tarea.descripcion,
        prioridad: tarea.prioridad,
        idPlantilla: tarea.idPlantilla,
        legajoTecnico: tipo === 'Técnico' ? legajo : null,
        idPrestador: tipo === 'Prestador' ? Number(idPrestador) : null,
        fechaInicio: tarea.fechaInicio ? String(tarea.fechaInicio).slice(0, 10) : null,
        fechaFin: tarea.fechaFin ? String(tarea.fechaFin).slice(0, 10) : null,
        horasEstimadas: tarea.horasEstimadas ?? null,
      });

      const nombre =
        tipo === 'Técnico'
          ? tecnicos.find((tecnico) => String(tecnico.legajo) === String(legajo))?.nombre
          : prestadores.find((prestador) => String(prestador.idPrestador) === String(idPrestador))?.nombre;
      mostrarToast({ tipo: 'exito', mensaje: `La tarea ${tarea.idTarea} quedó asignada a ${nombre}.` });
      onGuardado();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>Asignar la tarea</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        <div className="sigma-campos">
          <Campo
            id="tipoResponsable"
            etiqueta="Lo hace"
            tipo="lista"
            valor={tipo}
            alCambiar={(valor) => {
              // Al escribir, la lista avisa que se borró la elección (""): no se fuerza otra.
              setTipo(valor);
              setLegajo('');
              setIdPrestador('');
            }}
            opciones={TIPOS.map((uno) => ({ valor: uno, texto: uno }))}
            placeholder="Elegir"
            obligatorio
            revisado={revisado}
            error={errorTipo}
            ancho={12}
          />

          {tipo === 'Técnico' && (
            <Campo
              id="legajoTecnico"
              etiqueta="Técnico"
              tipo="lista"
              valor={legajo}
              alCambiar={setLegajo}
              opciones={tecnicosAptos.map((tecnico) => ({ valor: tecnico.legajo, texto: textoDelTecnico(tecnico) }))}
              placeholder={
                cargando
                  ? 'Cargando...'
                  : tecnicosAptos.length > 0
                    ? 'Elegir técnico'
                    : idEspecialidad
                      ? `Ningún técnico tiene la especialidad ${plantilla.nombreEspecialidad}`
                      : 'Todavía no hay técnicos cargados'
              }
              deshabilitado={cargando || tecnicosAptos.length === 0}
              obligatorio
              revisado={revisado}
              error={errorElegido}
              ancho={34}
            />
          )}

          {tipo === 'Prestador' && (
            <Campo
              id="idPrestador"
              etiqueta="Prestador"
              tipo="lista"
              valor={idPrestador}
              alCambiar={setIdPrestador}
              opciones={prestadores.map((prestador) => ({ valor: String(prestador.idPrestador), texto: prestador.nombre }))}
              placeholder={
                cargando ? 'Cargando...' : prestadores.length > 0 ? 'Elegir prestador' : 'Todavía no hay prestadores cargados'
              }
              deshabilitado={cargando || prestadores.length === 0}
              obligatorio
              revisado={revisado}
              error={errorElegido}
              ancho={34}
            />
          )}
        </div>
      </CModalBody>

      <CModalFooter>
        <BotonesAccion procesando={guardando} alAceptar={guardar} alCancelar={onCerrar} />
      </CModalFooter>
    </CModal>
  );
}
