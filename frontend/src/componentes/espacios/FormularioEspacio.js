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
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CButton,
  CCard,
  CCardBody,
  CCol,
  CForm,
  CFormFeedback,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormText,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import { Cargando } from '@/componentes/EstadoTabla.js';
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
  const partes = String(texto ?? '').match(
    /(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)/i
  );

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
  const editando = Boolean(espacio);

  const medidas = separarDimensiones(espacio?.dimensiones);

  const [idEdificio, setIdEdificio] = useState(espacio?.idEdificio ?? '');
  const [nombre, setNombre] = useState(espacio?.nombre ?? '');
  const [tipo, setTipo] = useState(espacio?.tipo ?? '');
  const [piso, setPiso] = useState(espacio?.piso ?? '');
  const [numero, setNumero] = useState(espacio?.numero ?? '');
  const [ancho, setAncho] = useState(medidas.ancho);
  const [largo, setLargo] = useState(medidas.largo);

  const [edificios, setEdificios] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [validado, setValidado] = useState(false);
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

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setValidado(true);
    setError('');

    if (!nombre.trim() || !idEdificio || !tipo) return;

    // Media medida no sirve para nada, y guardarla a medias seria peor que no
    // guardarla: mejor avisar.
    if (Boolean(ancho.trim()) !== Boolean(largo.trim())) {
      setError('Para las dimensiones hay que cargar el ancho y el largo, o dejar los dos vacios.');
      return;
    }

    setGuardando(true);

    try {
      await onGuardar({
        idEdificio: Number(idEdificio),
        nombre,
        tipo,
        piso,
        numero,
        dimensiones: unirDimensiones(ancho, largo),
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

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <CForm noValidate validated={validado} onSubmit={manejarEnvio}>
          <CRow className="g-3">
            <CCol md={5}>
              <CFormLabel htmlFor="idEdificio" className="sigma-obligatorio">
                Edificio
              </CFormLabel>
              <CFormSelect
                id="idEdificio"
                value={idEdificio}
                onChange={(evento) => setIdEdificio(evento.target.value)}
                required
              >
                <option value="">Elegi un edificio...</option>
                {edificios.map((edificio) => (
                  <option key={edificio.idEdificio} value={edificio.idEdificio}>
                    {edificio.nombre}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir el edificio.</CFormFeedback>
            </CCol>

            <CCol md={7}>
              <CFormLabel htmlFor="nombre" className="sigma-obligatorio">
                Nombre
              </CFormLabel>
              <CFormInput
                id="nombre"
                value={nombre}
                onChange={(evento) => setNombre(evento.target.value)}
                placeholder="Aula 1"
                required
                maxLength={100}
              />
              <CFormFeedback invalid>El nombre es obligatorio.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="tipo" className="sigma-obligatorio">
                Tipo
              </CFormLabel>
              <CFormSelect
                id="tipo"
                value={tipo}
                onChange={(evento) => setTipo(evento.target.value)}
                required
              >
                <option value="">Elegi el tipo...</option>
                {tipos.map((unTipo) => (
                  <option key={unTipo} value={unTipo}>
                    {unTipo}
                  </option>
                ))}
              </CFormSelect>
              <CFormFeedback invalid>Hay que elegir el tipo de espacio.</CFormFeedback>
            </CCol>

            <CCol xs={6} md={3}>
              <CFormLabel htmlFor="piso">Piso</CFormLabel>
              <CFormInput
                id="piso"
                value={piso}
                onChange={(evento) => setPiso(evento.target.value)}
                placeholder="Planta baja"
                maxLength={50}
              />
            </CCol>

            <CCol xs={4} md={2}>
              <CFormLabel htmlFor="numero">Numero</CFormLabel>
              <CFormInput
                id="numero"
                value={numero}
                onChange={(evento) => setNumero(evento.target.value)}
                placeholder="12"
                maxLength={20}
              />
            </CCol>

            <CCol xs={8} md={4}>
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
              <CFormText>Ancho y largo, en metros.</CFormText>
            </CCol>
          </CRow>

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : editando ? 'Guardar cambios' : 'Agregar espacio'}
            </CButton>
            <BotonEnlace href="/espacios" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </CForm>
      </CCardBody>
    </CCard>
  );
}
