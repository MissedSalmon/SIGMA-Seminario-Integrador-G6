'use client';

/**
 * Ventana para que el técnico tome una herramienta o la devuelva (HU-22).
 * Igual que DialogoAsignacion del depósito, pero siempre a nombre del técnico
 * de la sesión: no elige a quién, es él.
 *
 * - Sin `aDevolver`: se elige una de las disponibles y se guarda. Queda En uso
 *   a nombre del técnico hasta que la devuelva.
 * - Con `aDevolver`: confirma la devolución de esa herramienta.
 *
 * Se abre montándola y se cierra desmontándola, así cada vez arranca limpia.
 */
import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { devolverHerramienta, tomarHerramienta } from '@/servicios/tareas.js';
import { soloFechaLegible } from '@/utils/fechas.js';

export default function DialogoHerramienta({ idOt, idTarea, disponibles = [], aDevolver, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();
  const devolviendo = Boolean(aDevolver);

  const [codigo, setCodigo] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    setError('');
    if (!devolviendo) {
      setRevisado(true);
      if (!codigo) return;
    }

    setGuardando(true);
    try {
      const herramientas = devolviendo
        ? await devolverHerramienta(aDevolver.codigo)
        : await tomarHerramienta(idOt, idTarea, codigo);

      const nombre = devolviendo
        ? aDevolver.nombre
        : disponibles.find((herramienta) => herramienta.codigo === codigo)?.nombre ?? codigo;

      mostrarToast({
        tipo: 'exito',
        mensaje: devolviendo
          ? `Se registró la devolución de "${nombre}".`
          : `"${nombre}" quedó a tu nombre hasta que la devuelvas.`,
      });
      onGuardado(herramientas);
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const opciones = disponibles.map((herramienta) => ({
    valor: herramienta.codigo,
    texto: `${herramienta.codigo} — ${herramienta.nombre}`,
  }));

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>{devolviendo ? 'Devolver la herramienta' : 'Tomar una herramienta'}</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        {devolviendo ? (
          <p className="mb-0">
            <strong>{aDevolver.nombre}</strong> ({aDevolver.codigo})
            {aDevolver.desde && <> la tenés desde el {soloFechaLegible(aDevolver.desde)}</>}.
          </p>
        ) : disponibles.length === 0 ? (
          <Aviso color="warning" mensaje="No hay herramientas disponibles en este momento." />
        ) : (
          <Campo
            id="herramienta"
            etiqueta="Herramienta"
            tipo="lista"
            valor={codigo}
            alCambiar={setCodigo}
            opciones={opciones}
            placeholder="Buscar por código o nombre"
            obligatorio
            ancho={30}
            revisado={revisado}
            error={revisado && !codigo ? 'Elegí la herramienta.' : ''}
          />
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
            deshabilitado={disponibles.length === 0}
            alAceptar={guardar}
            alCancelar={onCerrar}
          />
        )}
      </CModalFooter>
    </CModal>
  );
}
