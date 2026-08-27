/**
 * Punto de entrada del backend: pone la API a escuchar pedidos.
 *
 * Se ejecuta con:
 *   npm run dev     (desarrollo, se reinicia solo al guardar)
 *   npm start       (produccion)
 */
import app from './app.js';
import { env } from './config/env.js';

app.listen(env.puerto, () => {
  console.log(`API SIGMA escuchando en http://localhost:${env.puerto}`);
  console.log(`Entorno: ${env.entorno}`);
  console.log(`Prueba: http://localhost:${env.puerto}/api/salud`);
});
