/**
 * Router principal de la API.
 *
 * Aca se monta cada modulo del sistema. A medida que avancen los sprints,
 * se agrega una linea por modulo:
 *
 *   import rutasTickets from './tickets.rutas.js';
 *   router.use('/tickets', rutasTickets);
 *
 * Convencion de archivos: <modulo>.rutas.js en esta carpeta,
 * <modulo>.controlador.js en ../controladores y <modulo>.servicio.js en ../servicios.
 */
import { Router } from 'express';
import rutasEdificios from './edificios.rutas.js';

const router = Router();

// Rutas de los módulos
router.use('/edificios', rutasEdificios);

// Sirve para verificar que la API esta viva. No consulta la base de datos.
router.get('/salud', (req, res) => {
  res.json({
    ok: true,
    servicio: 'API SIGMA',
    fecha: new Date().toISOString(),
  });
});

export default router;
