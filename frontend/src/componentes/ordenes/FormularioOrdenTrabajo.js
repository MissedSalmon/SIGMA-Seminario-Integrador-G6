'use client';

/**
 * Alta de una orden de trabajo (HU-14).
 *
 * Una OT no se inventa de la nada: sale de un ticket. Por eso acá no se carga
 * un activo ni un área, se elige el ticket y el resto viene con él.
 *
 * En la lista sólo aparecen los tickets que **están validados y todavía no
 * tienen OT**, que son los únicos de los que se puede generar una. Si no hay
 * ninguno, se dice con todas las letras en vez de mostrar un desplegable vacío.
 *
 * Lo normal es que esta pantalla casi no se use: la OT se genera sola al
 * validar el ticket. Está para el ticket que quedó validado sin OT, y para
 * poder crearla desde el listado de órdenes sin tener que ir a buscar el
 * ticket primero.
 */
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CButton, CCard, CCardBody } from '@coreui/react';

import Aviso from '@/componentes/Aviso.js';
import BotonEnlace from '@/componentes/BotonEnlace.js';
import Campo from '@/componentes/formulario/Campo.js';
import { useToast } from '@/componentes/toast/ContextoToast.js';
import { crearOrdenDesdeTicket } from '@/servicios/ordenesTrabajo.js';
import { listarTickets } from '@/servicios/tickets.js';

/** El único estado de ticket del que se puede generar una OT. */
const ESTADO_HABILITADO = 'Validado';

/** El ticket como se lee en el desplegable: número, activo y motivo. */
function textoDelTicket(ticket) {
  const partes = [`#${ticket.id}`];

  if (ticket.codigoActivo) partes.push(ticket.codigoActivo);
  if (ticket.descripcion) partes.push(recortar(ticket.descripcion, 60));

  return partes.join(' — ');
}

function recortar(texto, largo) {
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > largo ? `${limpio.slice(0, largo - 1)}…` : limpio;
}

export default function FormularioOrdenTrabajo() {
  const router = useRouter();
  const { mostrarToast } = useToast();

  const [tickets, setTickets] = useState([]);
  const [cargando, setCargando] = useState(true);

  const [idTicket, setIdTicket] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const [revisado, setRevisado] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  /*
   * Los tickets validados que todavía no tienen OT. El estado lo filtra la
   * API; que no tenga OT se mira acá, porque el ticket ya viene con la suya
   * cuando existe.
   */
  useEffect(() => {
    listarTickets({ estado: ESTADO_HABILITADO })
      .then((lista) => setTickets(lista.filter((ticket) => !ticket.ot)))
      .catch((fallo) => setError(fallo.message))
      .finally(() => setCargando(false));
  }, []);

  const errores = useMemo(() => {
    const encontrados = {};
    if (!idTicket) encontrados.idTicket = 'Elegí de qué ticket sale la orden.';
    return encontrados;
  }, [idTicket]);

  const hayErrores = Object.keys(errores).length > 0;

  /** Al elegir el ticket, la descripción arranca con el motivo que reportaron. */
  function elegirTicket(valor) {
    setIdTicket(valor);

    const ticket = tickets.find((uno) => String(uno.id) === String(valor));
    setDescripcion(ticket?.descripcion ?? '');
  }

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setRevisado(true);
    setError('');
    if (hayErrores) return;

    setGuardando(true);

    try {
      const orden = await crearOrdenDesdeTicket(Number(idTicket), descripcion.trim());

      mostrarToast({ tipo: 'exito', mensaje: `Se creó la orden de trabajo #${orden.id}.` });

      // Se entra directo a la OT recién creada: lo que sigue es cargarle las tareas.
      router.push(`/ordenes-trabajo/${orden.id}`);
      router.refresh();
    } catch (fallo) {
      setError(fallo.message);
      setGuardando(false);
    }
  }

  const opcionesTickets = tickets.map((ticket) => ({
    valor: String(ticket.id),
    texto: textoDelTicket(ticket),
  }));

  return (
    <CCard>
      <CCardBody>
        <Aviso mensaje={error} onCerrar={() => setError('')} />

        {!cargando && tickets.length === 0 ? (
          <>
            <p className="mb-1 fw-semibold">No hay ningún ticket esperando una orden de trabajo.</p>
            <p className="text-body-secondary">
              Una OT sale de un ticket validado. Los que ya están validados tienen su OT, y los que
              todavía no se validaron no pueden tener una.
            </p>
            <div className="d-flex gap-2 mt-4">
              <BotonEnlace href="/tickets">Ir a los tickets</BotonEnlace>
              <BotonEnlace href="/ordenes-trabajo" color="secondary" variante="outline">
                Volver al listado
              </BotonEnlace>
            </div>
          </>
        ) : (
          <form noValidate onSubmit={manejarEnvio}>
            <div className="sigma-campos mb-4">
              <Campo
                id="idTicket"
                etiqueta="Ticket"
                tipo="lista"
                valor={idTicket}
                alCambiar={elegirTicket}
                opciones={opcionesTickets}
                placeholder={cargando ? 'Cargando los tickets...' : 'Elegir ticket'}
                deshabilitado={cargando}
                obligatorio
                ancho={48}
                revisado={revisado}
                error={errores.idTicket}
              />

              <Campo
                id="descripcion"
                etiqueta="Qué hay que resolver"
                tipo="area"
                filas={3}
                valor={descripcion}
                alCambiar={setDescripcion}
                revisado={revisado}
              />
            </div>

            {revisado && hayErrores && (
              <p className="sigma-campo-mensaje sigma-campo-mensaje--error mb-3">
                Revisá los campos marcados y volvé a guardar.
              </p>
            )}

            <div className="d-flex gap-2 mt-4">
              <CButton type="submit" color="primary" disabled={guardando || cargando}>
                {guardando ? 'Creando...' : 'Agregar'}
              </CButton>
              <BotonEnlace href="/ordenes-trabajo" color="secondary" variante="outline">
                Cancelar
              </BotonEnlace>
            </div>
          </form>
        )}
      </CCardBody>
    </CCard>
  );
}
