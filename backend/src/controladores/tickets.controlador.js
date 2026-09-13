import * as ticketsServicio from '../servicios/tickets.servicio.js';

export async function crear(req, res) {
  const nuevo = await ticketsServicio.crear(req.body);
  res.status(201).json({ ok: true, datos: nuevo });
}
