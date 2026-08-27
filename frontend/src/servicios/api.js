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
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Si el backend responde con error, dejamos un mensaje entendible
// en lugar del error crudo de axios.
api.interceptors.response.use(
  (respuesta) => respuesta,
  (error) => {
    const mensaje =
      error.response?.data?.mensaje ??
      error.message ??
      'No se pudo conectar con el servidor.';

    return Promise.reject(new Error(mensaje));
  }
);
