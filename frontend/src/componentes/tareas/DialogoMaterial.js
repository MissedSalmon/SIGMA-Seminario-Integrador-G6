'use client';

/**
 * Ventana para que el técnico registre un material que usó en la tarea (HU-22).
 * Reemplaza a la pantalla aparte /tareas/[idOt]/[idTarea]/materiales (13/10/2026).
 *
 * - Se elige un material del depósito y la cantidad usada. Al guardar, el stock baja.
 * - No deja usar más de lo que hay: la cantidad tiene como tope el stock actual,
 *   y la base lo vuelve a controlar al guardar (si otro técnico se llevó
 *   unidades en el medio, avisa y vuelve a traer el stock).
 * - Antes de guardar se ve cómo queda el stock: el consumo no se deshace desde acá.
 * - Si se registra otra vez un material que la tarea ya tenía, se suma.
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
import { listarMaterialesDelDeposito, registrarMateriales } from '@/servicios/tareas.js';

export default function DialogoMaterial({ idOt, idTarea, onCerrar, onGuardado }) {
  const { mostrarToast } = useToast();

  const [materiales, setMateriales] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [codigo, setCodigo] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarMaterialesDelDeposito()
      .then(setMateriales)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const conStock = materiales.filter((material) => material.stock > 0);
  const opciones = conStock.map((material) => ({
    valor: material.codigo,
    texto: `${material.codigo} — ${material.nombre} (quedan ${material.stock})`,
  }));

  const elegido = materiales.find((material) => material.codigo === codigo) ?? null;
  const stock = elegido?.stock ?? null;

  const errores = {};
  if (!codigo) errores.material = 'Elegí el material.';
  const texto = String(cantidad).trim();
  if (texto === '') {
    errores.cantidad = 'Falta la cantidad.';
  } else if (!Number.isInteger(Number(texto)) || Number(texto) <= 0) {
    errores.cantidad = 'Tiene que ser un número entero mayor que cero.';
  } else if (stock !== null && Number(texto) > stock) {
    errores.cantidad = `Quedan ${stock}: no podés usar más.`;
  }
  const hayErrores = Object.keys(errores).length > 0;

  async function guardar() {
    setError('');
    setRevisado(true);
    if (hayErrores) return;

    setGuardando(true);
    try {
      const tarea = await registrarMateriales(idOt, idTarea, [{ codigo, cantidad: Number(texto) }]);
      mostrarToast({ tipo: 'exito', mensaje: `Se registró "${elegido.nombre}" y se descontó del stock.` });
      onGuardado(tarea);
    } catch (fallo) {
      // Si no alcanzó el stock (otro técnico se llevó unidades), se vuelve a
      // traer el stock para que el tope quede al día.
      setError(fallo.message);
      setGuardando(false);
      listarMaterialesDelDeposito().then(setMateriales).catch(() => {});
    }
  }

  const sinStock = !cargando && conStock.length === 0;

  return (
    <CModal visible onClose={() => !guardando && onCerrar()} alignment="center">
      <CModalHeader>
        <CModalTitle>Registrar un material</CModalTitle>
      </CModalHeader>

      <CModalBody>
        <Aviso mensaje={error} />

        {cargando ? (
          <Cargando texto="Cargando el depósito..." />
        ) : sinStock ? (
          <Aviso color="warning" mensaje="No hay materiales con stock en el depósito." />
        ) : (
          <>
            <Campo
              id="material"
              etiqueta="Material"
              tipo="lista"
              valor={codigo}
              alCambiar={setCodigo}
              opciones={opciones}
              placeholder="Buscar por código o nombre"
              obligatorio
              ancho={32}
              revisado={revisado}
              error={errores.material}
            />
            <Campo
              id="cantidad"
              etiqueta="Cantidad usada"
              tipo="numero"
              valor={cantidad}
              alCambiar={setCantidad}
              min={1}
              max={stock ?? undefined}
              obligatorio
              ancho={5}
              revisado={revisado}
              error={errores.cantidad}
            />
            {elegido && !errores.cantidad && (
              <p className="mb-0 text-body-secondary">
                Stock: {stock} → <strong>{stock - Number(texto)}</strong>
              </p>
            )}
          </>
        )}
      </CModalBody>

      <CModalFooter>
        <BotonesAccion
          procesando={guardando}
          deshabilitado={cargando || sinStock}
          alAceptar={guardar}
          alCancelar={onCerrar}
        />
      </CModalFooter>
    </CModal>
  );
}
