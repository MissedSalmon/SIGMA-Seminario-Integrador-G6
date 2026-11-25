'use client';

import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { registrarIngresoHerramienta } from '@/servicios/inventario.js';
import { hoyTexto } from '@/utils/fechas.js';

function leerSeries(texto) {
  return texto
    .split(/\r?\n/)
    .map((serie) => serie.trim())
    .filter(Boolean);
}

export default function DialogoIngresoHerramienta({ modelo, onCerrar, onGuardado }) {
  const [fecha, setFecha] = useState(hoyTexto());
  const [seriesTexto, setSeriesTexto] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const series = leerSeries(seriesTexto);
  const fechaInvalida = !fecha || fecha > hoyTexto();
  const seriesInvalidas = series.length === 0 || new Set(series).size !== series.length;

  async function guardar() {
    setRevisado(true);
    setError('');
    if (fechaInvalida || seriesInvalidas) return;

    setGuardando(true);
    try {
      const actualizada = await registrarIngresoHerramienta(modelo.codigo, { fecha, series });
      onGuardado(actualizada);
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>Registrar ingreso manual</CModalTitle>
      </CModalHeader>
      <CModalBody>
        <Aviso mensaje={error} />
        <p>
          <strong>{modelo.nombre}</strong> ({modelo.codigo})
        </p>
        <div className="sigma-campos">
          <Campo
            id="fechaIngresoHerramienta"
            etiqueta="Fecha de ingreso"
            tipoHtml="date"
            valor={fecha}
            alCambiar={setFecha}
            max={hoyTexto()}
            obligatorio
            revisado={revisado}
            error={revisado && fechaInvalida ? 'Indicá una fecha válida que no sea posterior a hoy.' : ''}
          />
          <Campo
            id="seriesHerramienta"
            etiqueta="Números de serie o inventario"
            tipo="area"
            valor={seriesTexto}
            alCambiar={setSeriesTexto}
            placeholder="Una identificación por línea"
            obligatorio
            revisado={revisado}
            error={
              revisado && seriesInvalidas
                ? series.length === 0
                  ? 'Cargá al menos una unidad.'
                  : 'No repitas números de serie.'
                : ''
            }
          />
        </div>
      </CModalBody>
      <CModalFooter>
        <BotonesAccion
          procesando={guardando}
          alAceptar={guardar}
          alCancelar={onCerrar}
        />
      </CModalFooter>
    </CModal>
  );
}
