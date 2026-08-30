/**
 * Cliente HTTP para hablar con la API del backend.
 *
 * Todos los servicios del frontend usan esta instancia, asi la direccion base
 * y el manejo de errores estan en un solo lugar.
 *
 * Convencion: un archivo por modulo en esta carpeta.
 * Ejemplo, src/servicios/tickets.js:
 *
 *   import { api } from './api.js';
 *
 *   export async function listarTickets() {
 *     const { data } = await api.get('/tickets');
 *     return data;
 *   }
 */
import axios from 'axios';

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export const api = axios.create({
  baseURL,
  headers: { 
    'Content-Type': 'application/json',
    'x-rol': 'Administrador'
  },
  timeout: 15000,
});

// Si algo sale mal, dejamos un mensaje entendible en lugar del error crudo de
// axios. Las pantallas lo muestran tal cual, asi que tiene que decir que paso y,
// si se puede, que hacer.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    // Caso 1: el backend contesto, pero con un error. El mensaje ya viene
    // escrito por el ("El nombre del edificio es obligatorio.").
    if (error.response) {
      const mensaje =
        error.response.data?.mensaje ??
        `La API respondio con el error ${error.response.status}.`;

      return Promise.reject(new Error(mensaje));
    }

    // Caso 2: el pedido salio pero nadie contesto a tiempo.
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error(`La API (${baseURL}) tardo demasiado en responder.`)
      );
    }

    // Caso 3: el pedido no llego a ningun lado. Axios dice solo "Network Error",
    // que no ayuda a nadie. Casi siempre es que el backend no esta levantado.
    return Promise.reject(
      new Error(
        `No se pudo conectar con la API (${baseURL}). ` +
          'Fijate que el backend este levantado: npm run dev'
      )
    );
  }
);
