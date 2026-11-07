'use client';

/**
 * Ventana «Modificar stock» de un material (06/11/2026): un ingreso que no
 * viene de un remito o un egreso que no es de una tarea.
 *
 * - El egreso tiene como tope el stock actual; la base lo vuelve a controlar.
 * - La fecha va de la del último movimiento del material hasta hoy, para que el
 *   historial no quede con el stock negativo en el medio.
 *
 * La API recibe el tipo como 'Entrada' o 'Salida'; en el historial queda como
 * «Ingreso manual» o «Egreso manual».
 *
 * Se abre montándola y se cierra desmontándola, así cada vez arranca limpia.
 */
import { useState } from 'react';
import { CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { registrarAjuste } from '@/servicios/inventario.js';
import { hoyTexto, soloFechaLegible } from '@/utils/fechas.js';

const OPCIONES_TIPO = [
  { valor: 'Entrada', texto: 'Ingreso' },
  { valor: 'Salida', texto: 'Egreso' },
];

/**
 * @param {object} material - el ítem de la ficha (codigo, nombre, stockActual)
 * @param {string|null} ultimaFecha - la fecha del último movimiento, o null si no tiene
 */
export default function DialogoAjusteStock({ material, ultimaFecha, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();
  const hoy = hoyTexto();
  // Se compara sólo el día, igual que la base.
  const fechaMinima = ultimaFecha ? String(ultimaFecha).slice(0, 10) : undefined;

  const [tipo, setTipo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [fecha, setFecha] = useState(hoy);
  const [observacion, setObservacion] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const stock = material.stockActual;
  const esEgreso = tipo === 'Salida';

  const errores = {};
  if (!tipo) errores.tipo = 'Elegí ingreso o egreso.';

  const textoCantidad = String(cantidad).trim();
  const numero = Number(textoCantidad);
  if (textoCantidad === '') {
    errores.cantidad = 'Falta la cantidad.';
  } else if (!Number.isInteger(numero) || numero <= 0) {
    errores.cantidad = 'Tiene que ser un número entero mayor que cero.';
  } else if (esEgreso && numero > stock) {
    errores.cantidad = `Quedan ${stock}: no se puede descontar más.`;
  }

  if (!fecha) {
    errores.fecha = 'Falta la fecha.';
  } else if (fecha > hoy) {
    errores.fecha = 'No puede ser posterior a hoy.';
  } else if (fechaMinima && fecha < fechaMinima) {
    errores.fecha = `No puede ser anterior al último movimiento (${soloFechaLegible(fechaMinima)}).`;
  }

  const hayErrores = Object.keys(errores).length > 0;
  const stockResultante = tipo && !errores.cantidad ? (esEgreso ? stock - numero : stock + numero) : null;

  async function guardar() {
    setError('');
    setRevisado(true);
    if (hayErrores) return;

    setGuardando(true);
    try {
      const actualizado = await registrarAjuste(material.codigo, {
        tipo,
        cantidad: numero,
        fecha,
        observacion,
      });
      mostrarToast({
        tipo: 'exito',
        mensaje: `Se registró el ${esEgreso ? 'egreso' : 'ingreso'} de "${material.nombre}": quedan ${actualizado.stockActual}.`,
      });
      onGuardado(actualizado);
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>Modificar stock</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        <div className="d-flex flex-wrap justify-content-between align-items-baseline column-gap-3 mb-3">
          <div>
            <strong>{material.nombre}</strong>{' '}
            <span className="text-body-secondary">({material.codigo})</span>
          </div>
          <div className="text-nowrap">
            <span className="text-body-secondary small">Stock actual:</span>{' '}
            <span className="fw-semibold">{stock}</span>
          </div>
        </div>

        <div className="d-flex flex-wrap column-gap-3">
          <Campo
            id="tipoAjuste"
            etiqueta="Movimiento"
            tipo="lista"
            valor={tipo}
            alCambiar={setTipo}
            opciones={OPCIONES_TIPO}
            placeholder="Elegir"
            obligatorio
            ancho={8}
            revisado={revisado}
            error={errores.tipo}
          />
          <Campo
            id="cantidadAjuste"
            etiqueta="Cantidad"
            tipo="numero"
            valor={cantidad}
            alCambiar={setCantidad}
            min={1}
            max={esEgreso ? stock : undefined}
            obligatorio
            ancho={5}
            revisado={revisado}
            error={errores.cantidad}
          />
          <Campo
            id="fechaAjuste"
            etiqueta="Fecha"
            tipoHtml="date"
            valor={fecha}
            alCambiar={setFecha}
            min={fechaMinima}
            max={hoy}
            obligatorio
            revisado={revisado}
            error={errores.fecha}
          />
        </div>

        <Campo
          id="observacionAjuste"
          etiqueta="Observación"
          tipo="area"
          valor={observacion}
          alCambiar={setObservacion}
          maxLength={500}
          filas={3}
        />

        {stockResultante !== null && (
          <p className="mb-0">
            <span className="text-body-secondary">Stock después del {esEgreso ? 'egreso' : 'ingreso'}:</span>{' '}
            {stock} → <strong>{stockResultante}</strong>
          </p>
        )}
      </CModalBody>

      <CModalFooter>
        <BotonesAccion procesando={guardando} alAceptar={guardar} alCancelar={onCerrar} />
      </CModalFooter>
    </CModal>
  );
}
