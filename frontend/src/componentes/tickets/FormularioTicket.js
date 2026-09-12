'use client';

/**
 * Alta de un ticket (HU-9).
 *
 * Un ticket avisa que algo se rompió. Tiene tres partes: QUÉ se rompió (un
 * activo o un espacio, nunca los dos), QUÉ PASÓ (la descripción) y, si hay,
 * una foto.
 *
 * Lo que el formulario NO pide, porque no lo elige quien reporta:
 *   - el estado: todo ticket nace en "Creado";
 *   - la fecha: es la del alta;
 *   - la prioridad: la pone el administrador después, en la orden de trabajo.
 *
 * Validación: no se usa el `validated` de CoreUI, que pinta todas las cajas de
 * verde o de rojo. Los errores se calculan acá, campo por campo, y los muestra
 * cada <Campo> con una marca chica. Ver src/componentes/formulario/Campo.js.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CButton, CCard, CCardBody, CFormCheck, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilImagePlus, cilTrash } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarActivos } from '@/servicios/activos.js';
import { listarEdificios } from '@/servicios/edificios.js';
import { listarEspacios } from '@/servicios/espacios.js';
import { subirEvidencia, TAMANO_MAXIMO } from '@/servicios/evidencias.js';

/** Un activo retirado ya no se mantiene, así que no puede recibir un ticket. */
const ESTADO_RETIRADO = 'Retirado';

/** El tamaño del archivo, para mostrarlo al lado del nombre. */
function pesoLegible(bytes) {
  const mega = bytes / (1024 * 1024);
  return mega >= 1 ? `${mega.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function FormularioTicket({ onGuardar }) {
  const { mostrarToast } = useToast();

  const [tipoObjeto, setTipoObjeto] = useState('activo');
  const [codigoActivo, setCodigoActivo] = useState('');
  const [idEdificio, setIdEdificio] = useState('');
  const [espacioNum, setEspacioNum] = useState('');
  const [descripcion, setDescripcion] = useState('');

  // La foto: el archivo elegido, su miniatura y el motivo si no sirve.
  const [foto, setFoto] = useState(null);
  const [miniatura, setMiniatura] = useState('');
  const [errorFoto, setErrorFoto] = useState('');
  const refArchivo = useRef(null);

  const [activos, setActivos] = useState([]);
  const [edificios, setEdificios] = useState([]);
  const [espacios, setEspacios] = useState([]);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Lo que hay para elegir como objeto afectado.
  useEffect(() => {
    Promise.all([listarActivos(), listarEdificios()])
      .then(([listaActivos, listaEdificios]) => {
        setActivos(listaActivos.filter((activo) => activo.estado !== ESTADO_RETIRADO));
        setEdificios(listaEdificios);
      })
      .catch((fallo) => setError(fallo.message));
  }, []);

  // Los espacios se piden recién cuando hay un edificio elegido.
  useEffect(() => {
    if (!idEdificio) return;
    listarEspacios(idEdificio)
      .then(setEspacios)
      .catch((fallo) => setError(fallo.message));
  }, [idEdificio]);

  /*
   * Los errores de cada campo, recalculados en cada tecla. Mientras `revisado`
   * sea falso nadie los muestra; después de apretar Guardar se ven, y se van
   * actualizando solos a medida que se corrigen.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (tipoObjeto === 'activo') {
      if (!codigoActivo) encontrados.codigoActivo = 'Elegí el activo que falló.';
    } else {
      if (!idEdificio) encontrados.idEdificio = 'Elegí el edificio.';
      if (!espacioNum) encontrados.espacioNum = 'Elegí el espacio.';
    }

    if (!descripcion.trim()) {
      encontrados.descripcion = 'Contanos qué pasó: sin descripción no se puede evaluar el ticket.';
    }

    if (errorFoto) encontrados.foto = errorFoto;

    return encontrados;
  }, [tipoObjeto, codigoActivo, idEdificio, espacioNum, descripcion, errorFoto]);

  const hayErrores = Object.keys(errores).length > 0;

  function cambiarTipoObjeto(nuevo) {
    setTipoObjeto(nuevo);
    // Se limpia lo del otro camino: un ticket apunta a uno solo de los dos.
    setCodigoActivo('');
    setIdEdificio('');
    setEspacioNum('');
  }

  /**
   * Se eligio una foto. Se revisa antes de aceptarla: que sea una imagen y que
   * no pase de los 5 MB. La miniatura sale del archivo que esta en la maquina,
   * asi se ve al instante y sin subir nada todavia.
   */
  function elegirFoto(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    if (!archivo.type.startsWith('image/')) {
      setErrorFoto('El archivo tiene que ser una imagen (jpg, png, etc.).');
      return;
    }
    if (archivo.size > TAMANO_MAXIMO) {
      setErrorFoto(`La foto pesa ${pesoLegible(archivo.size)} y el maximo son 5 MB.`);
      return;
    }

    setErrorFoto('');
    setFoto(archivo);
    setMiniatura(URL.createObjectURL(archivo));
  }

  function quitarFoto() {
    setFoto(null);
    setMiniatura('');
    setErrorFoto('');
    // Sin esto, volver a elegir el mismo archivo no dispara el onChange.
    if (refArchivo.current) refArchivo.current.value = '';
  }

  // La miniatura ocupa memoria del navegador hasta que se la suelta.
  useEffect(() => {
    if (!miniatura) return undefined;
    return () => URL.revokeObjectURL(miniatura);
  }, [miniatura]);

  function limpiar() {
    setTipoObjeto('activo');
    setCodigoActivo('');
    setIdEdificio('');
    setEspacioNum('');
    setDescripcion('');
    setRevisado(false);
    quitarFoto();
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);
    try {
      // La foto va primero: al ticket se le guarda su direccion, no el archivo.
      const direccionFoto = foto ? await subirEvidencia(foto) : null;

      await onGuardar({
        ...(tipoObjeto === 'activo'
          ? { codigoActivo }
          : { idEdificio: Number(idEdificio), espacioNum }),
        descripcion: descripcion.trim(),
        evidencia: direccionFoto,
      });

      mostrarToast({ tipo: 'exito', mensaje: 'Se registró el ticket.' });
      limpiar();
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  }

  const opcionesActivos = activos.map((activo) => ({
    valor: activo.codigo,
    texto: activo.descripcion ? `${activo.codigo} - ${activo.descripcion}` : activo.codigo,
  }));

  const opcionesEdificios = edificios.map((edificio) => ({
    valor: edificio.idEdificio,
    texto: edificio.nombre,
  }));

  // Sin edificio elegido no se ofrece ningún espacio, aunque queden en memoria
  // los del edificio anterior.
  const opcionesEspacios = (idEdificio ? espacios : []).map((espacio) => ({
    valor: espacio.espacioNum,
    texto: espacio.nombre ? `${espacio.nombre} (${espacio.espacioNum})` : espacio.espacioNum,
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">¿Qué se rompió?</h2>

          <div className="mb-3">
            <CFormLabel className="sigma-obligatorio">¿De qué es el ticket?</CFormLabel>
            <div className="d-flex gap-4">
              <CFormCheck
                type="radio"
                name="tipoObjeto"
                id="objetoActivo"
                label="Un activo"
                checked={tipoObjeto === 'activo'}
                onChange={() => cambiarTipoObjeto('activo')}
              />
              <CFormCheck
                type="radio"
                name="tipoObjeto"
                id="objetoEspacio"
                label="Un espacio"
                checked={tipoObjeto === 'espacio'}
                onChange={() => cambiarTipoObjeto('espacio')}
              />
            </div>
          </div>

          <div className="sigma-campos mb-4">
            {tipoObjeto === 'activo' ? (
              <Campo
                id="codigoActivo"
                etiqueta="Activo"
                tipo="lista"
                valor={codigoActivo}
                alCambiar={setCodigoActivo}
                opciones={opcionesActivos}
                placeholder="Elegir activo"
                obligatorio
                revisado={revisado}
                error={errores.codigoActivo}
                ayuda="Los activos retirados no aparecen en la lista."
              />
            ) : (
              <>
                <Campo
                  id="idEdificio"
                  etiqueta="Edificio"
                  tipo="lista"
                  valor={idEdificio}
                  alCambiar={(valor) => {
                    setIdEdificio(valor);
                    setEspacioNum('');
                  }}
                  opciones={opcionesEdificios}
                  placeholder="Elegir edificio"
                  obligatorio
                  revisado={revisado}
                  error={errores.idEdificio}
                />
                <Campo
                  id="espacioNum"
                  etiqueta="Espacio"
                  tipo="lista"
                  valor={espacioNum}
                  alCambiar={setEspacioNum}
                  opciones={opcionesEspacios}
                  placeholder={idEdificio ? 'Elegir espacio' : 'Primero el edificio'}
                  deshabilitado={!idEdificio}
                  obligatorio
                  revisado={revisado}
                  error={errores.espacioNum}
                />
              </>
            )}
          </div>

          <h2 className="sigma-seccion-titulo">¿Qué pasó?</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="descripcion"
              etiqueta="Descripción del problema"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              obligatorio
              maxLength={500}
              revisado={revisado}
              error={errores.descripcion}
            />

            <div
              className={`sigma-campo sigma-campo--ancho${errores.foto ? ' sigma-campo--error' : ''}`}
            >
              <CFormLabel htmlFor="foto">Foto (opcional)</CFormLabel>

              {/*
                El <input type="file"> no se puede maquillar, asi que se lo deja
                accesible pero fuera de la vista (con el teclado se llega igual)
                y se muestra un boton comun, del mismo estilo que el resto.
              */}
              <input
                id="foto"
                ref={refArchivo}
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={elegirFoto}
              />

              {foto ? (
                <div className="sigma-campo-foto">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={miniatura} alt={`Vista previa de ${foto.name}`} />
                  <div className="sigma-campo-foto-datos">
                    <span className="fw-semibold">{foto.name}</span>
                    <small className="text-body-secondary">{pesoLegible(foto.size)}</small>
                  </div>
                  <CButton
                    type="button"
                    color="danger"
                    variant="ghost"
                    className="btn-icono"
                    title="Quitar la foto"
                    onClick={quitarFoto}
                  >
                    <CIcon icon={cilTrash} />
                  </CButton>
                </div>
              ) : (
                <CButton
                  type="button"
                  color="secondary"
                  variant="outline"
                  className="align-self-start"
                  onClick={() => refArchivo.current.click()}
                >
                  <CIcon icon={cilImagePlus} className="me-2" />
                  Elegir foto
                </CButton>
              )}

              <p className={`sigma-campo-mensaje${errores.foto ? ' sigma-campo-mensaje--error' : ''}`}>
                {errores.foto || 'Una imagen de hasta 5 MB.'}
              </p>
            </div>
          </div>

          {revisado && hayErrores && (
            <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
              Revisá los campos marcados y volvé a guardar.
            </p>
          )}

          <div className="d-flex gap-2 mt-4">
            <CButton type="submit" color="primary" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Registrar'}
            </CButton>
            <BotonEnlace href="/" color="secondary" variante="outline">
              Cancelar
            </BotonEnlace>
          </div>
        </form>
      </CCardBody>
    </CCard>
  );
}
