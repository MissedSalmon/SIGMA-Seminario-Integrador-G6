/**
 * La linea de etapas de un ticket: en que punto del ciclo esta.
 *
 *   Registrado → Validado → En trabajo → Finalizado → Cerrado
 *
 * Contesta lo que el relevamiento marco como problema: quien reporta un
 * desperfecto no sabia en que estado estaba. Va sin colores: cada paso dice
 * con texto si ya paso («Hecho»), si es el de ahora («Ahora») o si falta, y la
 * raya de arriba es mas gruesa en los pasos alcanzados. Si el ticket fue
 * rechazado, la linea termina en «Rechazado».
 *
 * Las etapas son siempre del mismo ancho, asi un ticket se compara con otro
 * de un vistazo (mundo «Talonario», ver frontend/DESIGN.md).
 */

const PASOS = [
  { clave: 'registrado', texto: 'Registrado', estados: ['Creado'] },
  { clave: 'validado', texto: 'Validado', estados: ['Validado'] },
  { clave: 'trabajo', texto: 'En trabajo', estados: ['Asignado', 'En ejecución'] },
  { clave: 'finalizado', texto: 'Finalizado', estados: ['Finalizado'] },
  { clave: 'cerrado', texto: 'Cerrado', estados: ['Cerrado'] },
];

const RECHAZADO = { clave: 'rechazado', texto: 'Rechazado', estados: ['Rechazado'] };

export default function LineaEtapasTicket({ estado }) {
  if (!estado) return null;

  // Un ticket rechazado no sigue: se registro y se rechazo.
  const pasos = estado === 'Rechazado' ? [PASOS[0], RECHAZADO] : PASOS;
  const actual = Math.max(0, pasos.findIndex((paso) => paso.estados.includes(estado)));

  return (
    <ol className="sigma-linea-etapas" aria-label="Etapas del ticket">
      {pasos.map((paso, indice) => {
        const situacion = indice < actual ? 'hecho' : indice === actual ? 'ahora' : 'falta';
        return (
          <li
            key={paso.clave}
            className={`sigma-linea-etapa sigma-linea-etapa--${situacion}`}
            aria-current={situacion === 'ahora' ? 'step' : undefined}
          >
            <span className="sigma-linea-etapa-numero">{indice + 1}</span>
            <span className="sigma-linea-etapa-texto">{paso.texto}</span>
            <span className="sigma-linea-etapa-situacion">
              {situacion === 'hecho' ? 'Hecho' : situacion === 'ahora' ? 'Ahora' : 'Falta'}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
