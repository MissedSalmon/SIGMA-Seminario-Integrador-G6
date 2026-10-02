/**
 * Punto de entrada del backend en Vercel.
 *
 * Vercel no deja un servidor escuchando: ejecuta esta funcion en cada pedido.
 * Por eso aca se exporta la app de Express sin llamar a listen().
 * En local se sigue usando src/index.js (npm run dev).
 */
import app from '../src/app.js';

export default app;
