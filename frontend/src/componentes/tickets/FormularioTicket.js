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
import { useEffect, useRef, useState } from 'react';
import { CButton, CCard, CCardBody, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilImagePlus, cilTrash } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarActivos } from '@/servicios/activos.js';
import { subirEvidencia, TAMANO_MAXIMO } from '@/servicios/evidencias.js';

/** Un activo retirado ya no se mantiene, así que no puede recibir un ticket. */
const ESTADO_RETIRADO = 'Retirado';

/** El tamaño del archivo, para mostrarlo al lado del nombre. */
function pesoLegible(bytes) {
  const mega = bytes / (1024 * 1024);
  return mega >= 1 ? `${mega.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

/**
 * Formulario para cargar un problema con un activo.
 */
export default function FormularioTicket({ onGuardar }) {
  const { mostrarToast } = useToast();

  const [codigoActivo, setCodigoActivo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [foto, setFoto] = useState(null);
  const [miniatura, setMiniatura] = useState(null);

  const [activos, setActivos] = useState([]);

  const [error, setError] = useState('');
  const [errores, setErrores] = useState({});
  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const refArchivo = useRef(null);

  useEffect(() => {
    // Al futuro: aqui habria que filtrar los activos por el area del usuario logueado.
    listarActivos().then((listaActivos) => {
      setActivos(listaActivos.filter((activo) => activo.estado !== ESTADO_RETIRADO));
    });
  }, []);

  const hayErrores = Object.keys(errores).length > 0;

  useEffect(() => {
    const encontrados = {};

    if (!codigoActivo) encontrados.codigoActivo = 'Elegí el activo que falló.';

    if (!descripcion.trim()) encontrados.descripcion = 'Falta describir el problema.';
    else if (descripcion.trim().length < 10) encontrados.descripcion = 'Muy corta.';

    if (foto && foto.size > TAMANO_MAXIMO) encontrados.foto = `Pesa más de ${pesoLegible(TAMANO_MAXIMO)}.`;

    setErrores(encontrados);
  }, [codigoActivo, descripcion, foto]);

  function elegirFoto(evento) {
    const elegida = evento.target.files[0];
    if (!elegida) return;
    setFoto(elegida);
    setMiniatura(URL.createObjectURL(elegida));
  }

  function quitarFoto() {
    setFoto(null);
    if (miniatura) URL.revokeObjectURL(miniatura);
    setMiniatura(null);
    if (refArchivo.current) refArchivo.current.value = '';
  }

  useEffect(() => {
    if (!miniatura) return undefined;
    return () => URL.revokeObjectURL(miniatura);
  }, [miniatura]);

  function limpiar() {
    setCodigoActivo('');
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
      const direccionFoto = foto ? await subirEvidencia(foto) : null;

      await onGuardar({
        codigoActivo,
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
    texto: activo.nombreTipo ? `${activo.codigo} - ${activo.nombreTipo}` : activo.codigo,
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        <form noValidate onSubmit={manejarEnvio}>
          <h2 className="sigma-seccion-titulo">¿Qué activo falló?</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="codigoActivo"
              etiqueta="Activo"
              tipo="buscador"
              valor={codigoActivo}
              alCambiar={setCodigoActivo}
              opciones={opcionesActivos}
              placeholder="Buscar activo..."
              obligatorio
              ancho={30}
              revisado={revisado}
              error={errores.codigoActivo}
              ayuda="Los activos retirados no aparecen en la lista."
            />
          </div>

          <h2 className="sigma-seccion-titulo">¿Qué pasó?</h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="descripcion"
              etiqueta="Descripción del problema"
              tipo="area"
              valor={descripcion}
              alCambiar={setDescripcion}
              placeholder="Ej: el aire acondicionado no enfria desde el lunes."
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
