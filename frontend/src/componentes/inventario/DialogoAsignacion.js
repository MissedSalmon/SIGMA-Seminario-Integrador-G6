'use client';

/**
 * Ventana para asignar una herramienta a un técnico o para registrar que la
 * devolvió (devolución del Sprint 3, HU-13). La usa la ficha de una herramienta:
 * el listado sólo muestra quién la tiene.
 *
 * - Si la herramienta está libre, se elige el técnico y se guarda.
 * - Si ya la tiene alguien, la ventana confirma la devolución. Cada
 *   herramienta la tiene un solo técnico a la vez: para pasársela a otro,
 *   primero se registra la devolución y después se asigna de nuevo.
 *
 * Se abre montándola y se cierra desmontándola, así cada vez arranca limpia:
 *
 *   {aAsignar && (
 *     <DialogoAsignacion
 *       herramienta={aAsignar}
 *       onCerrar={() => setAAsignar(null)}
 *       onGuardado={() => { setAAsignar(null); recargar(); }}
 *     />
 *   )}
 */
import { useEffect, useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { asignarHerramienta, devolverHerramienta } from '@/servicios/inventario.js';
import { listarTecnicos } from '@/servicios/tecnicos.js';
import { soloFechaLegible } from '@/utils/fechas.js';

export default function DialogoAsignacion({ herramienta, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();
  const devolviendo = Boolean(herramienta.legajoTecnico);

  const [tecnicos, setTecnicos] = useState([]);
  const [cargandoTecnicos, setCargandoTecnicos] = useState(!devolviendo);
  const [legajo, setLegajo] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Los técnicos sólo hacen falta para asignar.
  useEffect(() => {
    if (devolviendo) return;
    listarTecnicos()
      .then(setTecnicos)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargandoTecnicos(false));
  }, [devolviendo]);

  async function guardar() {
    setError('');
    if (!devolviendo) {
      setRevisado(true);
      if (!legajo) return;
    }

    setGuardando(true);
    try {
      const actualizada = devolviendo
        ? await devolverHerramienta(herramienta.codigo)
        : await asignarHerramienta(herramienta.codigo, legajo);

      mostrarToast({
        tipo: 'exito',
        mensaje: devolviendo
          ? `Se registró la devolución de "${herramienta.nombre}".`
          : `Se asignó "${herramienta.nombre}" a ${actualizada.tecnico}.`,
      });
      onGuardado(actualizada);
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const opcionesTecnicos = tecnicos.map((tecnico) => ({
    valor: tecnico.legajo,
    texto: `${tecnico.nombre} (legajo ${tecnico.legajo})`,
  }));

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>{devolviendo ? 'Registrar la devolución' : 'Asignar herramienta'}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        {devolviendo ? (
          <>
            <p className="mb-0">
              <strong>{herramienta.nombre}</strong> ({herramienta.codigo}) la tiene{' '}
              <strong>{herramienta.tecnico}</strong>
              {herramienta.asignadaDesde && <> desde el {soloFechaLegible(herramienta.asignadaDesde)}</>}.
            </p>
            <p className="text-body-secondary mt-2 mb-0">
              Al registrar la devolución queda disponible para asignarla a otro técnico.
            </p>
          </>
        ) : (
          <>
            <p>
              <strong>{herramienta.nombre}</strong> ({herramienta.codigo})
            </p>
            {!cargandoTecnicos && tecnicos.length === 0 ? (
              <Aviso color="warning" mensaje="Todavía no hay técnicos cargados." />
            ) : (
              <Campo
                id="tecnicoAsignado"
                etiqueta="Técnico"
                tipo="lista"
                valor={legajo}
                alCambiar={setLegajo}
                opciones={opcionesTecnicos}
                placeholder={cargandoTecnicos ? 'Cargando...' : 'Elegir técnico'}
                deshabilitado={cargandoTecnicos}
                obligatorio
                ancho={30}
                revisado={revisado}
                error={revisado && !legajo ? 'Elegí el técnico.' : ''}
              />
            )}
          </>
        )}
      </CModalBody>

      <CModalFooter>
        {devolviendo ? (
          <BotonesAccion
            texto="Devolver"
            textoProcesando="Devolviendo..."
            procesando={guardando}
            alAceptar={guardar}
            alCancelar={onCerrar}
          />
        ) : (
          <BotonesAccion
            procesando={guardando}
            deshabilitado={cargandoTecnicos || tecnicos.length === 0}
            alAceptar={guardar}
            alCancelar={onCerrar}
          />
        )}
      </CModalFooter>
    </CModal>
  );
}
