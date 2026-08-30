'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';

import EncabezadoPagina from '@/componentes/EncabezadoPagina.js';
import FormularioEspecialidad from '@/componentes/especialidades/FormularioEspecialidad.js';
import { obtenerEspecialidad, actualizarEspecialidad } from '@/servicios/especialidades.js';
import { Cargando } from '@/componentes/EstadoTabla.js';

export default function PantallaEditarEspecialidad({ params }) {
  const { id } = use(params);
  const router = useRouter();

  const [especialidad, setEspecialidad] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;
    async function pedir() {
      try {
        const fila = await obtenerEspecialidad(id);
        if (!vigente) return;
        setEspecialidad(fila);
      } catch (err) {
        // Si falla, volvemos al listado
        router.push('/especialidades');
      } finally {
        if (vigente) setCargando(false);
      }
    }
    pedir();
    return () => (vigente = false);
  }, [id]);

  if (cargando) return <Cargando texto="Cargando especialidad..." />;

  return (
    <>
      <EncabezadoPagina titulo="Editar especialidad" descripcion="Los campos marcados con * son obligatorios." />
      <FormularioEspecialidad especialidad={especialidad} onGuardar={async ({ nombre }) => actualizarEspecialidad(id, nombre)} />
    </>
  );
}
