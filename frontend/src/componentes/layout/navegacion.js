/**
 * El menu de la barra lateral.
 *
 * Cada vez que se agrega una pantalla al sistema, se suma una entrada aca.
 * Los grupos (titulo) sirven para separar por modulo.
 *
 *   { tipo: 'titulo', texto: 'ESTRUCTURA EDILICIA' }
 *   { tipo: 'item', texto: 'Edificios', direccion: '/edificios', icono: cilBuilding }
 */
import {
  cilSpeedometer,
  cilBuilding,
  cilRoom,
  cilSitemap,
} from '@coreui/icons';

export const navegacion = [
  {
    tipo: 'item',
    texto: 'Panel',
    direccion: '/',
    icono: cilSpeedometer,
  },
  {
    tipo: 'titulo',
    texto: 'Estructura edilicia',
  },
  {
    tipo: 'item',
    texto: 'Edificios',
    direccion: '/edificios',
    icono: cilBuilding,
  },
  {
    tipo: 'item',
    texto: 'Espacios',
    direccion: '/espacios',
    icono: cilRoom,
  },
  {
    tipo: 'item',
    texto: 'Areas',
    direccion: '/areas',
    icono: cilSitemap,
  },
];
