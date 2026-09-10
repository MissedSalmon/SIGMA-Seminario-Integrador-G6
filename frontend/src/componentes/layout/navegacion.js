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
 *
 * EL ORDEN NO ES LIBRE: primero la clasificacion y despues lo que depende de
 * ella. Los tipos de espacio antes que los espacios, los tipos de activo antes
 * que los activos, las especialidades antes que los tecnicos. Es el orden en
 * que hay que cargar los datos: sin especialidades no se puede dar de alta un
 * tecnico, asi que el menu se lee de arriba hacia abajo como una guia de por
 * donde empezar.
 */
import {
  cilSpeedometer,
  cilBuilding,
  cilRoom,
  cilSitemap,
  cilList,
  cilTags,
  cilDevices,
  cilPeople,
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
        texto: 'Tipos de espacio',
        direccion: '/espacios/tipos',
        icono: cilTags,
      },
      {
        tipo: 'item',
        texto: 'Listado de espacios',
        direccion: '/espacios',
        icono: cilList,
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
    tipo: 'grupo',
    texto: 'Activos',
    icono: cilDevices,
    items: [
      {
        tipo: 'item',
        texto: 'Tipos de activos',
        direccion: '/tipos-activos',
        icono: cilTags,
      },
      {
        tipo: 'item',
        texto: 'Listado de activos',
        direccion: '/activos',
        icono: cilList,
      },
    ],
  },
  {
    tipo: 'titulo',
    texto: 'Personal',
  },
  {
    tipo: 'item',
    texto: 'Especialidades',
    direccion: '/especialidades',
    icono: cilTags,
  },
  {
    tipo: 'item',
    texto: 'Tecnicos',
    direccion: '/tecnicos',
    icono: cilPeople,
  },
];
