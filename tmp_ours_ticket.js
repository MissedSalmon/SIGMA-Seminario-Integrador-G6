'use client';

/**
 * Alta de un ticket (HU-9).
 *
 * Un ticket avisa que algo se rompió. Tiene tres partes: QUÉ se rompió (un
 * activo), QUÉ PASÓ (la descripción) y, si hay, una foto.
 *
 * Todo ticket va contra un activo. No se puede reportar un espacio suelto: el
 * modelo de datos exige que el ticket tenga un activo asociado, y el backend
 * rechaza el alta si no viene (ver backend/src/servicios/tickets.servicio.js).
 * Si algun dia se reportan espacios, hay que cambiar primero la base.
 *
 * Lo que el formulario NO pide, porque no lo elige quien reporta:
 *   - el estado: todo ticket nace en "Creado";
 *   - la fecha: se muestra la de hoy para que se vea con que dia va a quedar
 *     registrado, pero no se puede cambiar ni se manda a la API: la pone la
 *     base de datos sola al insertar el ticket;
 *   - la prioridad: la pone el administrador después, en la orden de trabajo.
 *
 * Validación: no se usa el `validated` de CoreUI, que pinta todas las cajas de
 * verde o de rojo. Los errores se calculan acá, campo por campo, y los muestra
 * cada <Campo> con una marca chica. Ver src/componentes/formulario/Campo.js.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import { CAlert, CButton, CCard, CCardBody, CFormLabel } from '@coreui/react';
import CIcon from '@coreui/icons-react';
import { cilExternalLink, cilImagePlus, cilTrash, cilWarning } from '@coreui/icons';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { listarActivos } from '@/servicios/activos.js';
import { subirEvidencia, TAMANO_MAXIMO } from '@/servicios/evidencias.js';
import { listarTickets } from '@/servicios/tickets.js';
import EtiquetaEstadoTicket from '@/componentes/tickets/EtiquetaEstadoTicket.js';
import { formatearFechaHora, hoyLegible } from '@/utils/fechas.js';

/** Un activo retirado ya no se mantiene, así que no puede recibir un ticket. */
const ESTADO_RETIRADO = 'Retirado';

/*
 * Los estados en los que un ticket ya termino su camino. Todo lo demas
 * (Creado, Validado, Asignado, En ejecución) sigue en proceso: el problema
 * todavia esta abierto.
 *
 * Se escribe al reves, listando los terminados, a proposito: si manana se
 * agrega un estado nuevo en el medio del circuito, va a contar como "en
 * proceso" solo, que es lo que corresponde.
 */
const ESTADOS_TERMINADOS = ['Finalizado', 'Cerrado', 'Rechazado'];

/** El tamaño del archivo, para mostrarlo al lado del nombre. */
function pesoLegible(bytes) {
  const mega = bytes / (1024 * 1024);
  return mega >= 1 ? `${mega.toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export default function FormularioTicket({ onGuardar }) {
  const { mostrarToast } = useToast();

  const [codigoActivo, setCodigoActivo] = useState('');
  const [descripcion, setDescripcion] = useState('');

  /*
   * La fecha de hoy, solo para mostrar. No lleva estado: no es un dato que se
   * elija ni que se mande, asi que se calcula cada vez que se dibuja la
   * pantalla. De paso, si alguien deja el formulario abierto y lo termina
   * despues de las doce, la fecha que ve se actualiza sola.
   */
  const fechaDeHoy = hoyLegible();

  // La foto: el archivo elegido, su miniatura y el motivo si no sirve.
  const [foto, setFoto] = useState(null);
  const [miniatura, setMiniatura] = useState('');
  const [errorFoto, setErrorFoto] = useState('');
  const refArchivo = useRef(null);

  const [activos, setActivos] = useState([]);

  /*
   * Los tickets sin terminar que ya tiene el activo elegido, para avisar antes
   * de cargar uno repetido. La lista arranca cerrada: primero se avisa cuantos
   * hay, y recien si se quiere se despliega el detalle.
   */
  const [ticketsEnProceso, setTicketsEnProceso] = useState([]);
  const [verTicketsEnProceso, setVerTicketsEnProceso] = useState(false);

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Los activos que se pueden reportar.
  useEffect(() => {
    listarActivos()
      .then((lista) => setActivos(lista.filter((activo) => activo.estado !== ESTADO_RETIRADO)))
      .catch((fallo) => setError(fallo.message));
  }, []);

  /*
   * Al elegir un activo se buscan los tickets que ya tiene sin terminar.
   *
   * Si la busqueda falla no se muestra nada ni se corta el formulario: es un
   * aviso de ayuda, no un requisito. Que la consulta no ande no puede impedir
   * que alguien reporte que algo se rompio.
   */
  useEffect(() => {
    if (!codigoActivo) return;

    let vigente = true;

    listarTickets({ codigoActivo })
      .then((lista) => {
        if (!vigente) return;
        setTicketsEnProceso(lista.filter((ticket) => !ESTADOS_TERMINADOS.includes(ticket.estado)));
      })
      .catch(() => {});

    return () => {
      vigente = false;
    };
  }, [codigoActivo]);

  /*
   * Los errores de cada campo, recalculados en cada tecla. Mientras `revisado`
   * sea falso nadie los muestra; después de apretar Guardar se ven, y se van
   * actualizando solos a medida que se corrigen.
   */
  const errores = useMemo(() => {
    const encontrados = {};

    if (!codigoActivo) encontrados.codigoActivo = 'Elegí el activo que falló.';

    if (!descripcion.trim()) {
      encontrados.descripcion = 'Contanos qué pasó: sin descripción no se puede evaluar el ticket.';
    }

    if (errorFoto) encontrados.foto = errorFoto;

    return encontrados;
  }, [codigoActivo, descripcion, errorFoto]);

  const hayErrores = Object.keys(errores).length > 0;

  /*
   * Se eligio otro activo: lo que se habia encontrado del anterior ya no sirve.
   * Se borra aca, en el momento del cambio, y no cuando llega la respuesta
   * nueva, asi no queda un instante mostrando los tickets del activo viejo.
   */
  function elegirActivo(codigo) {
    setCodigoActivo(codigo);
    olvidarTicketsEnProceso();
  }

  function olvidarTicketsEnProceso() {
    setTicketsEnProceso([]);
    setVerTicketsEnProceso(false);
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
    setCodigoActivo('');
    setDescripcion('');
    setRevisado(false);
    quitarFoto();
    olvidarTicketsEnProceso();
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
          <h2 className="sigma-seccion-titulo"></h2>

          <div className="sigma-campos mb-4">
            <Campo
              id="fechaDeHoy"
              etiqueta="Fecha"
              valor={fechaDeHoy}
              alCambiar={() => {}}
              soloLectura
              deshabilitado
              anchoMinimo={10}
              anchoMaximo={10}
            />
          </div>

          <div className="sigma-campos mb-4">
            <Campo
              id="codigoActivo"
              etiqueta="Activo"
              tipo="lista"
              valor={codigoActivo}
              alCambiar={elegirActivo}
              opciones={opcionesActivos}
              placeholder="Elegir activo"
              obligatorio
              revisado={revisado}
              error={errores.codigoActivo}
              ayuda="Los activos retirados no aparecen en la lista."
            />
          </div>

          {ticketsEnProceso.length > 0 && (
            <CAlert color="warning" className="d-flex flex-column gap-2">
              <div className="d-flex align-items-start gap-2">
                <CIcon icon={cilWarning} className="flex-shrink-0 mt-1" />
                <div>
                  <div className="fw-semibold">
                    {ticketsEnProceso.length === 1
                      ? 'Este activo ya tiene 1 ticket sin terminar.'
                      : `Este activo ya tiene ${ticketsEnProceso.length} tickets sin terminar.`}
                  </div>
                  <div className="small">
                    Fijate si no es el mismo problema antes de cargar otro. Si es otra falla, segui
                    normalmente.
                  </div>
                </div>
              </div>

              <div>
                <CButton
                  color="warning"
                  variant="outline"
                  size="sm"
                  onClick={() => setVerTicketsEnProceso((visible) => !visible)}
                >
                  {verTicketsEnProceso ? 'Ocultar' : 'Ver cuáles son'}
                </CButton>
              </div>

              {verTicketsEnProceso && (
                <ul className="list-unstyled mb-0 d-flex flex-column gap-2">
                  {ticketsEnProceso.map((ticket) => (
                    <li key={ticket.id} className="d-flex flex-wrap align-items-center gap-2">
                      {/*
                        Se abre en otra pestaña a proposito: si se fuera de la pantalla,
                        se perderia lo que ya escribio en el formulario.
                      */}
                      <a
                        href={`/tickets/${ticket.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="fw-semibold text-nowrap"
                      >
                        #{ticket.id}
                        <CIcon icon={cilExternalLink} size="sm" className="ms-1" />
                      </a>
                      <EtiquetaEstadoTicket estado={ticket.estado} />
                      <span className="small text-nowrap">{formatearFechaHora(ticket.fechaAlta)}</span>
                      {ticket.descripcion && <span className="small">— {ticket.descripcion}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CAlert>
          )}

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
