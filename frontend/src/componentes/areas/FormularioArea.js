'use client';

/**
 * Formulario de alta y de edicion de un area funcional (HU-3).
 *
 * El area se ubica en un espacio, asi que el desplegable muestra los espacios
 * con su edificio adelante ("Edificio Central - Aula 1"), que es como los
 * distingue la gente de infraestructura.
 *
 * No pide el responsable del area a proposito: el usuario autorizado es el que
 * apunta a su area, no al reves (contexto.md, pregunta abierta 4). Se asigna
 * al dar de alta al usuario, en el Sprint 6.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEspacios } from '@/servicios/espacios.js';

export default function FormularioArea({ area = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(area);

  const [nombre, setNombre] = useState(area?.nombre ?? '');
  const [idEspacio, setIdEspacio] = useState(area?.idEspacio ?? '');

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
    if (!idEspacio) encontrados.idEspacio = 'Elegí el espacio donde funciona el área.';
    return encontrados;
  }, [nombre, idEspacio]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({ nombre: nombre.trim(), idEspacio });
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

  if (espacios.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un espacio: toda área funciona en uno."
      />
    );
  }

  const opcionesEspacios = espacios.map((espacio) => ({
    valor: espacio.idEspacio,
    texto: `${espacio.nombreEdificio} - ${espacio.nombre}`,
  }));

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
              placeholder="Departamento de Sistemas"
              obligatorio
              maxLength={100}
              ancho={22}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="idEspacio"
              etiqueta="Espacio donde funciona"
              tipo="lista"
              valor={idEspacio}
              alCambiar={setIdEspacio}
              opciones={opcionesEspacios}
              placeholder="Elegir espacio"
              obligatorio
              ancho={22}
              revisado={revisado}
              error={errores.idEspacio}
            />
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/areas" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
