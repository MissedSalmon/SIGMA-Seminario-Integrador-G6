/**
 * Job diario que genera las OT de los planes preventivos (03/11/2026).
 *
 * Corre una vez al levantar la API (por si estuvo apagada a la hora de la
 * corrida) y después todos los días a env.planesHoraGeneracion, hora de
 * Argentina. No usa librerías: un setTimeout que se vuelve a programar solo.
 * Como la generación es idempotente, correrla de más no duplica nada.
 *
 * Si la API se despliega como funciones "serverless" (Vercel), este
 * temporizador no vive entre pedidos: ahí hay que agendar un Vercel Cron que
 * llame a POST /api/planes-mantenimiento/procesar-generacion.
 */
import { env } from '../config/env.js';
import { generarOtsPreventivas } from '../servicios/programacionPreventiva.servicio.js';

const MS_POR_HORA = 60 * 60 * 1000;

/** Milisegundos hasta la próxima vez que en Argentina sean las `hora`:00. */
export function msHastaLaProximaCorrida(hora, ahora = new Date()) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Argentina/Buenos_Aires',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(ahora);
  const valor = (tipo) => Number(partes.find((parte) => parte.type === tipo).value);

  const transcurridoHoy = (valor('hour') * 3600 + valor('minute') * 60 + valor('second')) * 1000;
  let espera = hora * MS_POR_HORA - transcurridoHoy;
  if (espera <= 0) espera += 24 * MS_POR_HORA;
  return espera;
}

async function correr() {
  try {
    const resultado = await generarOtsPreventivas();
    const errores = resultado.detalles.filter((detalle) => detalle.estado === 'error');
    console.log(
      `[planes] ${resultado.fechaCorte}: ${resultado.otsGeneradas} OT preventivas generadas` +
        (errores.length > 0 ? `, ${errores.length} con error` : '')
    );
    for (const error of errores) console.error(`[planes] ${error.plan} / ${error.codigoActivo}: ${error.motivo}`);
  } catch (fallo) {
    console.error('[planes] No se pudo correr la generación de OT preventivas:', fallo.message);
  }
}

function programarSiguiente() {
  setTimeout(async () => {
    await correr();
    programarSiguiente();
  }, msHastaLaProximaCorrida(env.planesHoraGeneracion));
}

export function iniciarGeneracionPreventiva() {
  correr();
  programarSiguiente();
}
