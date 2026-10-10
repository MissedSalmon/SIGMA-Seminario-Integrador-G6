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
 * ROLES: cada entrada puede tener un array `roles` que indica quienes la ven.
 * Si no tiene `roles`, la ven todos. Los valores posibles son:
 *   'administrador' | 'tecnico' | 'autorizado'
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
  cilStorage,
  cilTask,
  cilListRich,
  cilUser,
  cilCog,
  cilClipboard,
  cilBriefcase,
} from '@coreui/icons';

export const navegacion = [
  // ─── PANEL PRINCIPAL ───────────────────────────────────────────────────────
  {
    tipo: 'item',
    texto: 'Panel',
    direccion: '/',
    icono: cilSpeedometer,
    roles: ['administrador'],
  },

  // ─── TÉCNICO ───────────────────────────────────────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Mis tareas',
    roles: ['tecnico'],
  },
  {
    tipo: 'item',
    texto: 'Tareas asignadas',
    direccion: '/tareas',
    icono: cilTask,
    roles: ['tecnico'],
  },

  // ─── MANTENIMIENTO (ADMINISTRADOR Y AUTORIZADO) ────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Mantenimiento',
    roles: ['administrador', 'autorizado'],
  },
  {
    tipo: 'item',
    texto: 'Registrar ticket',
    direccion: '/tickets/agregar',
    icono: cilTask,
    roles: ['administrador', 'autorizado'],
  },
  {
    tipo: 'item',
    texto: 'Tickets',
    direccion: '/tickets',
    icono: cilList,
    roles: ['administrador', 'autorizado'],
  },
  {
    // Va despues de los tickets: la OT nace de un ticket validado.
    tipo: 'item',
    texto: 'Órdenes de trabajo',
    direccion: '/ordenes-trabajo',
    icono: cilClipboard,
    roles: ['administrador'],
  },
  {
    tipo: 'item',
    texto: 'Plantillas de tareas',
    direccion: '/plantillas-tareas',
    icono: cilListRich,
    roles: ['administrador'],
  },

  // ─── ESTRUCTURA EDILICIA (SOLO ADMINISTRADOR) ──────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Estructura edilicia',
    roles: ['administrador'],
  },
  {
    tipo: 'item',
    texto: 'Edificios',
    direccion: '/edificios',
    icono: cilBuilding,
    roles: ['administrador'],
  },
  {
    tipo: 'grupo',
    texto: 'Espacios',
    icono: cilRoom,
    roles: ['administrador'],
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
    roles: ['administrador'],
  },

  // ─── GESTIÓN DE ACTIVOS (SOLO ADMINISTRADOR) ──────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Gestión de Activos',
    roles: ['administrador'],
  },
  {
    tipo: 'grupo',
    texto: 'Activos',
    icono: cilDevices,
    roles: ['administrador'],
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

  // ─── INVENTARIO (SOLO ADMINISTRADOR) ──────────────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Gestión de inventario',
    roles: ['administrador'],
  },
  {
    tipo: 'grupo',
    texto: 'Inventario',
    icono: cilStorage,
    roles: ['administrador'],
    items: [
      {
        tipo: 'item',
        texto: 'Tipos de materiales y herramientas',
        direccion: '/inventario/tipos',
        icono: cilTags,
      },
      {
        // Materiales y herramientas se manejan distinto (una lleva stock, la
        // otra se presta y se devuelve), asi que van en pantallas separadas.
        tipo: 'item',
        texto: 'Materiales',
        direccion: '/inventario/materiales',
        icono: cilList,
      },
      {
        tipo: 'item',
        texto: 'Herramientas',
        direccion: '/inventario/herramientas',
        icono: cilCog,
      },
      {
        // Va al final: para ingresar algo por remito, antes tiene que estar en
        // el catalogo.
        tipo: 'item',
        texto: 'Ingresos por remito',
        direccion: '/inventario/remitos',
        icono: cilClipboard,
      },
    ],
  },

  // ─── PERSONAL (SOLO ADMINISTRADOR) ────────────────────────────────────────
  {
    tipo: 'titulo',
    texto: 'Personal',
    roles: ['administrador'],
  },
  {
    tipo: 'item',
    texto: 'Especialidades',
    direccion: '/especialidades',
    icono: cilTags,
    roles: ['administrador'],
  },
  {
    tipo: 'item',
    texto: 'Técnicos',
    direccion: '/tecnicos',
    icono: cilPeople,
    roles: ['administrador'],
  },
  {
    // Por ahora sólo tiene los tipos (HU-24). El listado de prestadores es la
    // HU-33 y va debajo, porque para cargar un prestador hay que elegir su tipo.
    tipo: 'grupo',
    texto: 'Prestadores de servicio',
    icono: cilBriefcase,
    roles: ['administrador'],
    items: [
      {
        tipo: 'item',
        texto: 'Tipos de prestador',
        direccion: '/prestadores/tipos',
        icono: cilTags,
      },
    ],
  },
  {
    // Va despues de las areas (mas arriba, en estructura edilicia): a un usuario
    // autorizado hay que asignarle un area, asi que primero se cargan las areas.
    tipo: 'item',
    texto: 'Usuarios autorizados',
    direccion: '/autorizados',
    icono: cilUser,
    roles: ['administrador'],
  },
];
