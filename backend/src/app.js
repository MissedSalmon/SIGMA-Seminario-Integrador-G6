/**
 * Configuracion de la aplicacion Express.
 *
 * Este archivo arma la app pero NO la pone a escuchar: de eso se encarga
 * src/index.js. Separarlos permite importar la app en los tests sin
 * levantar un servidor.
 */
import express from 'express';
import cors from 'cors';

import { env } from './config/env.js';
import rutas from './rutas/index.js';
import { noEncontrado } from './middlewares/noEncontrado.js';
import { manejadorErrores } from './middlewares/manejadorErrores.js';

const app = express();

// Permite que el frontend (otro dominio) llame a esta API.
app.use(
  cors({
    origin: env.origenesPermitidos,
    credentials: true,
  })
);

// Interpreta el cuerpo de los pedidos que vienen en formato JSON.
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Todas las rutas de la API cuelgan de /api.
app.use('/api', rutas);

// Estos dos van siempre al final y en este orden.
app.use(noEncontrado);
app.use(manejadorErrores);

export default app;
