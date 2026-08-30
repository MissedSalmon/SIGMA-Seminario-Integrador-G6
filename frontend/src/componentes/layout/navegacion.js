/**
 * El menu de la barra lateral.
 *
 * Cada vez que se agrega una pantalla al sistema, se suma una entrada aca.
 * Los grupos (titulo) sirven para separar por modulo.
 *
 *   { tipo: 'titulo', texto: 'ESTRUCTURA EDILICIA' }
 *   { tipo: 'item', texto: 'Edificios', direccion: '/edificios', icono: cilBuilding }
 *
 * Cuando un modulo tiene mas de una pantalla, en lugar de un item va un
 * desplegable con sus pantallas adentro:
 *
 *   { tipo: 'grupo', texto: 'Espacios', icono: cilRoom, items: [ ...items... ] }
 */
import {
  cilSpeedometer,
  cilBuilding,
  cilRoom,
  cilSitemap,
  cilList,
  cilTags,
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
    tipo: 'grupo',
    texto: 'Espacios',
    icono: cilRoom,
    items: [
      {
        tipo: 'item',
        texto: 'Listado de espacios',
        direccion: '/espacios',
        icono: cilList,
      },
      {
        tipo: 'item',
        texto: 'Tipos de espacio',
        direccion: '/espacios/tipos',
        icono: cilTags,
      },
    ],
  },
  {
    tipo: 'item',
    texto: 'Áreas',
    direccion: '/areas',
    icono: cilSitemap,
  },
  {
    tipo: 'titulo',
    texto: 'Gestión de Activos',
  },
  {
    tipo: 'item',
    texto: 'Tipos de Activos',
    direccion: '/tipos-activos',
    icono: cilSitemap,
  },
];
