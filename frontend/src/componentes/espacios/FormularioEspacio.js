'use client';

/**
 * Formulario de alta y de edicion de un espacio (HU-2).
 *
 * Un espacio siempre pertenece a un edificio, asi que el formulario primero
 * carga la lista de edificios para armar el desplegable. Si todavia no hay
 * ningun edificio, avisa y no deja cargar nada: sin edificio no hay espacio.
 *
 * Cada campo ocupa el ancho que necesita su contenido: Numero es corto y
 * Nombre es largo, asi que no tienen por que medir lo mismo.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarEdificios } from '@/servicios/edificios.js';
import { listarTiposDeEspacio } from '@/servicios/espacios.js';

/*
 * Las dimensiones se guardan como un texto solo (8 x 6 m), igual que en el
 * modelo. Pero cargarlas a mano es incomodo y cada uno las escribe distinto,
 * asi que el formulario pide dos numeros y arma el texto solo. Estas dos
 * funciones traducen de una forma a la otra.
 */

/** De 8 x 6 m saca { ancho: 8, largo: 6 }. */
function separarDimensiones(texto) {
  const partes = String(texto ?? '').match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i);

  if (!partes) {
    return { ancho: '', largo: '' };
  }

  return {
    ancho: partes[1].replace(',', '.'),
    largo: partes[2].replace(',', '.'),
  };
}

/** De { ancho: 8, largo: 6 } arma 8 x 6 m. Si falta uno, no guarda nada. */
function unirDimensiones(ancho, largo) {
  const unAncho = ancho.trim();
  const unLargo = largo.trim();

  if (!unAncho || !unLargo) {
    return '';
  }

  return `${unAncho} x ${unLargo} m`;
}

export default function FormularioEspacio({ espacio = null, onGuardar }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const editando = Boolean(espacio);

  const medidas = separarDimensiones(espacio?.dimensiones);

  const [idEdificio, setIdEdificio] = useState(espacio?.idEdificio ?? '');
  const [nombre, setNombre] = useState(espacio?.nombre ?? '');
  const [idTipoEspacio, setIdTipoEspacio] = useState(espacio?.idTipoEspacio ?? '');
  const [piso, setPiso] = useState(espacio?.piso ?? '');
  const [numero, setNumero] = useState(espacio?.numero ?? '');
  const [ancho, setAncho] = useState(medidas.ancho);
  const [largo, setLargo] = useState(medidas.largo);

  const [edificios, setEdificios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([listarEdificios(), listarTiposDeEspacio()])
      .then(([listaEdificios, listaTipos]) => {
        setEdificios(listaEdificios);
        setTipos(listaTipos);
      })
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  /*
   * Los errores se recalculan en cada tecla, pero no se muestran hasta apretar
   * Guardar. De ahi en mas se actualizan solos mientras se corrige.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!idEdificio) encontrados.idEdificio = 'Elegi a que edificio pertenece.';
    if (!nombre.trim()) encontrados.nombre = 'El nombre es obligatorio.';
    if (!idTipoEspacio) encontrados.idTipoEspacio = 'Elegi el tipo de espacio.';

    // Media medida no sirve para nada, y guardarla a medias seria peor que no
    // guardarla: mejor avisar.
    if (Boolean(String(ancho).trim()) !== Boolean(String(largo).trim())) {
      encontrados.dimensiones = 'Carga el ancho y el largo, o deja los dos vacios.';
    }

    return encontrados;
  }, [idEdificio, nombre, idTipoEspacio, ancho, largo]);

  const hayErrores = Object.keys(errores).length > 0;

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      await onGuardar({
        idEdificio: Number(idEdificio),
        nombre: nombre.trim(),
        idTipoEspacio,
        piso,
        numero,
        dimensiones: unirDimensiones(ancho, largo),
      });
      mostrarToast({
        tipo: 'exito',
        mensaje: editando
          ? `Se guardaron los cambios de "${nombre}".`
          : `Se agrego el espacio "${nombre}".`,
      });
      router.push('/espacios');
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

  if (edificios.length === 0) {
    return (
      <Aviso
        color="warning"
        mensaje="Primero hay que cargar por lo menos un edificio: todo espacio pertenece a uno."
      />
    );
  }

  const opcionesEdificios = edificios.map((edificio) => ({
    valor: edificio.idEdificio,
    texto: edificio.nombre,
  }));

  const opcionesTipos = tipos.map((unTipo) => ({
    valor: unTipo.idTipoEspacio,
    texto: unTipo.nombre,
  }));

  const errorDimensiones = revisado ? errores.dimensiones : '';

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">Datos del espacio</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="idEdificio"
              etiqueta="Edificio"
              tipo="lista"
              valor={idEdificio}
              alCambiar={setIdEdificio}
              opciones={opcionesEdificios}
              placeholder="Elegir edificio"
              obligatorio
              anchoMinimo={18}
              revisado={revisado}
              error={errores.idEdificio}
            />

            <Campo
              id="nombre"
              etiqueta="Nombre"
              valor={nombre}
              alCambiar={setNombre}
              placeholder="Aula 1"
              obligatorio
              maxLength={100}
              anchoMinimo={16}
              revisado={revisado}
              error={errores.nombre}
            />

            <Campo
              id="idTipoEspacio"
              etiqueta="Tipo"
              tipo="lista"
              valor={idTipoEspacio}
              alCambiar={setIdTipoEspacio}
              opciones={opcionesTipos}
              placeholder="Elegir tipo"
              obligatorio
              anchoMinimo={14}
              revisado={revisado}
              error={errores.idTipoEspacio}
            />

            <Campo
              id="piso"
              etiqueta="Piso"
              valor={piso}
              alCambiar={setPiso}
              placeholder="Planta baja"
              maxLength={50}
              anchoMinimo={12}
              revisado={revisado}
            />

            <Campo
              id="numero"
              etiqueta="Numero"
              valor={numero}
              alCambiar={setNumero}
              placeholder="12"
              maxLength={20}
              anchoMinimo={6}
              anchoMaximo={10}
              revisado={revisado}
            />

            {/*
              Las dimensiones son dos cajitas y no una, asi que no entran en
              <Campo>. Se arman a mano con las mismas clases, para que queden
              igual que el resto de la fila.
            */}
            <div className={`sigma-campo${errorDimensiones ? ' sigma-campo--error' : ''}`}>
              <CFormLabel htmlFor="ancho">Dimensiones</CFormLabel>
              <CInputGroup className="sigma-medidas">
                <CFormInput
                  id="ancho"
                  type="number"
                  min="0"
                  step="0.01"
                  value={ancho}
                  onChange={(evento) => setAncho(evento.target.value)}
                  placeholder="8"
                  aria-label="Ancho en metros"
                />
                <CInputGroupText>&times;</CInputGroupText>
                <CFormInput
                  id="largo"
                  type="number"
                  min="0"
                  step="0.01"
                  value={largo}
                  onChange={(evento) => setLargo(evento.target.value)}
                  placeholder="6"
                  aria-label="Largo en metros"
                />
                <CInputGroupText>m</CInputGroupText>
              </CInputGroup>
              <p
                className={`sigma-campo-mensaje${errorDimensiones ? ' sigma-campo-mensaje--error' : ''}`}
              >
                {errorDimensiones || 'Ancho y largo, en metros.'}
              </p>
            </div>
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisa los campos marcados y volve a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar'}
            </CButton>
            <BotonEnlace href="/espacios" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
