'use client';

import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { registrarIngresoHerramienta } from '@/servicios/inventario.js';
import { hoyTexto } from '@/utils/fechas.js';

export default function DialogoIngresoHerramienta({ modelo, onCerrar, onGuardado }) {
  const [fecha, setFecha] = useState(hoyTexto());
  const [cantidad, setCantidad] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const fechaInvalida = !fecha || fecha > hoyTexto();
  const cantidadInvalida = !Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0;

  async function guardar() {
    setRevisado(true);
    setError('');
    if (fechaInvalida || cantidadInvalida) return;

    setGuardando(true);
    try {
      const actualizada = await registrarIngresoHerramienta(modelo.codigo, { fecha, cantidad: Number(cantidad) });
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
        <p>Cada unidad recibe automáticamente un código con el formato HE-000, HE-001, etc.</p>
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
            id="cantidadHerramientas"
            etiqueta="Cantidad"
            tipo="numero"
            valor={cantidad}
            alCambiar={setCantidad}
            min={1}
            ancho={6}
            obligatorio
            revisado={revisado}
            error={revisado && cantidadInvalida ? 'Indicá una cantidad entera mayor que cero.' : ''}
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
