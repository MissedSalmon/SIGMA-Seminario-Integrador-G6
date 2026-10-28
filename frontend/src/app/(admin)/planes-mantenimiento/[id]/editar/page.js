'use client';

/**
 * /planes-mantenimiento/5/editar - edición de plan de mantenimiento preventivo (Sprint 5).
 */
import { use, useEffect, useState } from 'react';
import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioPlan from '@/componentes/planes/FormularioPlan.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import Aviso from '@/componentes/Aviso.js';
import { obtenerPlan, actualizarPlan } from '@/servicios/planesMantenimiento.js';

export default function PantallaEditarPlan({ params }) {
  const { id } = use(params);
  const [plan, setPlan] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setCargando(true);
    obtenerPlan(id)
      .then(setPlan)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, [id]);

  if (cargando) return <Cargando />;
  if (error) return <Aviso color="danger">{error}</Aviso>;
  if (!plan) return <Aviso color="warning">No se encontró el plan de mantenimiento.</Aviso>;

  return (
    <>
      <EncabezadoPagina titulo={`Editar plan: ${plan.nombre}`} />
      <FormularioPlan
        plan={plan}
        onGuardar={(payload) => actualizarPlan(id, payload)}
      />
    </>
  );
}
