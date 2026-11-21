'use client';

/**
 * Formulario de alta y de edicion de un area funcional (HU-3).
 *
 * Un area tiene varios espacios, incluso en distintos edificios, y cada
 * espacio es de un area como maximo (21/11/2026). Por eso la lista ofrece los
 * espacios libres y los que ya son de esta area; los de otra area no aparecen.
 * Cada espacio se muestra con su edificio adelante ("Edificio Central - Aula 1"),
 * que es como los distingue la gente de infraestructura.
 *
 * No pide el responsable del area a proposito: el usuario autorizado es el que
 * apunta a su area, no al reves. Se asigna al dar de alta al solicitante.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonesAccion from '@/componentes/BotonesAccion.js';
import Campo from '@/componentes/formulario/Campo.js';
import SeleccionMultiple from '@/componentes/formulario/SeleccionMultiple.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';

export default function FormularioArea({ area = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(area);

  const [nombre, setNombre] = useState(area?.nombre ?? '');
  const [espaciosElegidos, setEspaciosElegidos] = useState(area?.idsEspacios ?? []);

  const [espacios, setEspacios] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    listarEspacios()
      .then(setEspacios)
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const errores = useMemo(() => {
    const encontrados = {};
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    return encontrados;
  }, [nombre]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre: nombre.trim(), idsEspacios: espaciosElegidos });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agregó el área "${nombre}".`,
      });
      router.push('/areas');
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <CCard>
        <CCardBody>
          <Cargando texto="Cargando el formulario..." />
        </CCardBody>
      </CCard>
    );
  }

  const opcionesEspacios = espacios
    .filter((espacio) => !espacio.idArea || espacio.idArea === area?.idArea)
    .map((espacio) => ({
      valor: espacio.idEspacio,
      texto: `${espacio.nombreEdificio} - ${espacio.nombre}`,
    }))
    .sort((a, b) => a.texto.localeCompare(b.texto, 'es'));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos del área</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Secretaría de Asuntos Universitarios"
              obligatorio
              maxLength={100}
              ancho={30}
              revisado={revisado}
              error={errores.nombre}
            />

            <SeleccionMultiple
              id="espacios"
              etiqueta="Espacios"
              opciones={opcionesEspacios}
              elegidos={espaciosElegidos}
              alCambiar={setEspaciosElegidos}
              textoTodas="Todos los espacios"
              textoCantidad={(cantidad) => `${cantidad} espacios`}
              placeholder={opcionesEspacios.length === 0 ? 'No hay espacios libres' : 'Elegir espacios'}
              ancho={30}
              revisado={revisado}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <BotonesAccion procesando={guardando} hrefCancelar="/areas" className="mt-4" />
        </form>
      </CCardBody>
    </CCard>
  );
}
