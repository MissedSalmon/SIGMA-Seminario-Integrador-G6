# Frontend — Interfaz de SIGMA

Aplicación web hecha con Next.js 16 (App Router) y React 19.

## Cómo correrlo

Desde la **raíz del repositorio**:

```bash
npm install
```

Después, copiar `frontend/.env.local.example` como `frontend/.env.local` y
completar los valores.

Para levantar sólo el frontend:

```bash
npm run dev:frontend
```

Queda en `http://localhost:3000`.

## Estructura

```
frontend/
├── next.config.mjs       # configuración de Next.js
├── jsconfig.json         # habilita el atajo @/ para importar
├── eslint.config.mjs     # reglas de estilo de código
├── .env.local.example    # plantilla de variables de entorno
├── AGENTS.md             # lo genera Next.js solo (ver nota abajo)
├── CLAUDE.md             # lo genera Next.js solo (ver nota abajo)
├── public/               # imágenes, logos, íconos
└── src/
    ├── app/              # las pantallas (cada carpeta es una dirección)
    │   ├── layout.js     # estructura común a todas las pantallas
    │   ├── page.js       # pantalla de inicio
    │   └── globals.css   # estilos globales y colores del sistema
    ├── componentes/
    │   ├── layout/       # barra lateral, encabezado con las migas, pie
    │   ├── tabla/        # TablaDatos: la tabla que usan todos los listados
    │   ├── toast/        # los carteles flotantes de "se guardó"
    │   ├── activos/      # los formularios de cada módulo, una carpeta por tema
    │   ├── espacios/
    │   └── *.js          # las piezas sueltas: Aviso, BotonEnlace, DialogoEliminar...
    ├── lib/
    │   └── supabase.js   # conexión a Supabase desde el navegador
    └── servicios/
        ├── api.js        # cliente para hablar con el backend
        └── activos.js    # un archivo por módulo, con sus llamadas
```

## Cómo funcionan las pantallas

En el App Router, **cada carpeta dentro de `src/app/` es una dirección** y el
archivo `page.js` es lo que se ve.

Así van a quedar los módulos del sistema a partir del Sprint 1:

```
src/app/
├── dashboard/page.js              →  /dashboard
├── tickets/
│   ├── page.js                    →  /tickets           (listado)
│   ├── agregar/page.js            →  /tickets/agregar
│   └── [id]/page.js               →  /tickets/5         (detalle)
├── ordenes-trabajo/
├── activos/
├── inventario/
└── configuracion/
```

Una carpeta entre corchetes, como `[id]`, significa que esa parte de la
dirección es variable: sirve para el detalle de un ticket, de un activo, etc.

## Cómo se piden datos

Hay dos caminos y no se mezclan:

| Para qué | Qué se usa |
|---|---|
| Tickets, OT, activos, inventario, indicadores | `src/servicios/api.js` → llama al **backend**, donde están las reglas de negocio. |
| Login y subida de fotos | `src/lib/supabase.js` → habla **directo con Supabase**. |

Ejemplo de un servicio nuevo (`src/servicios/tickets.js`):

```js
import { api } from './api.js';

export async function listarTickets() {
  const { data } = await api.get('/tickets');
  return data;
}
```

## Atajo para importar

Gracias a `jsconfig.json` se puede escribir:

```js
import { api } from '@/servicios/api.js';
```

en lugar de contar carpetas con `../../../`.

## Pautas de diseño

> En los ejemplos, `<entidad>` es el módulo que estés haciendo: edificios, técnicos,
> tickets, lo que sea. Reemplazalo por el nombre en plural y en minúscula.

### Un ABM son tres páginas, no un modal

Cada entidad se maneja con tres direcciones y un formulario compartido:

```
src/app/<entidad>/
├── page.js              →  /<entidad>            (listado)
├── agregar/page.js      →  /<entidad>/agregar    (alta)
└── [id]/editar/page.js  →  /<entidad>/5/editar   (edición)

src/componentes/<entidad>/
└── Formulario<Entidad>.js   →  lo usan el alta y la edición
```

Si la entidad no se identifica con un número sino con un código, la carpeta lleva ese
nombre: `[legajo]` para un técnico, `[codigo]` para un activo.

El formulario recibe `{ <entidad> = null, onGuardar }`. Si viene `null` es un alta, y si
viene con datos es una edición: eso decide el texto del botón y el del aviso. La página
de alta le pasa `crear<Entidad>` directamente, y la de edición
`(datos) => actualizar<Entidad>(id, datos)`.

**El alta y la edición nunca van en un modal.** El único modal del sistema es
`DialogoEliminar`, el que confirma una baja.

### Las tablas

Siempre `TablaDatos`, nunca un `CTable` armado a mano. Trae resueltos el buscador, la
paginación, el contador de resultados, el esqueleto de carga y el estado vacío.

```jsx
<TablaDatos
  filas={filas}
  claveFila={(fila) => fila.id}
  columnas={columnas}
  buscarPor={['nombre', 'descripcion']}
  placeholderBusqueda="Buscar por nombre o descripcion..."
  filtros={<>{/* los CFormSelect que hagan falta */}</>}
  cargando={cargando}
  textoVacio="Todavia no hay ... cargados."
  accionVacio={{ texto: 'Agregar ...', direccion: '/<entidad>/agregar' }}
/>
```

Ojo: `buscarPor` sólo mira campos de primer nivel. Si querés buscar por el nombre de algo
relacionado, el servicio del backend tiene que devolverlo **plano** (`nombreTipo`, y no
`tipo.nombre`).

**Todas las columnas van en texto plano**, con `className="text-body-secondary"`. Nada de
pastillas de colores: cuando cada columna tenía su color, la tabla se leía como un
semáforo y costaba encontrar el dato. La única que se resalta es la primera, la que
identifica la fila, con `fw-semibold`.

Los botones de acción, siempre iguales:

```jsx
<CButtonGroup size="sm">
  <BotonEnlace href={`/<entidad>/${fila.id}/editar`} variante="ghost" className="btn-icono" title="Editar">
    <CIcon icon={cilPencil} />
  </BotonEnlace>
  <CButton variant="ghost" color="danger" className="btn-icono" onClick={...} title="Eliminar">
    <CIcon icon={cilTrash} />
  </CButton>
</CButtonGroup>
```

`BotonEnlace` usa `variante` (en español) y `CButton` usa `variant` (en inglés). Es
molesto pero es así: uno es nuestro y el otro es de CoreUI.

### Avisar que algo salió bien o mal

| Qué pasó | Qué se usa |
|---|---|
| Salió bien | `mostrarToast({ tipo: 'exito', mensaje })` — el cartel flotante |
| Salió mal | `<Aviso mensaje={error} />` arriba de la tabla o del formulario |

Los mensajes de error no se escriben en la pantalla: vienen del backend. `servicios/api.js`
ya los convierte en un `Error` con el texto listo, así que alcanza con mostrar
`fallo.message`.

### Los formularios

Validación nativa del navegador más el estilo de CoreUI:

- `<CForm noValidate validated={validado} onSubmit={...}>`
- Los campos obligatorios llevan `required` y su etiqueta `className="sigma-obligatorio"`,
  que agrega el asterisco rojo solo.
- El mensaje de cada campo va en `<CFormFeedback invalid>`.
- Al enviar: `setValidado(true)` y después un `if (!campo.trim()) return;` que frena el
  pedido.

Cuando guarda bien: toast → `router.push('/listado')` → `router.refresh()`.

Si el formulario depende de otra tabla que todavía está vacía, no lo dejes intentar: un
`<Aviso color="warning">` explicando qué hay que cargar primero. Por ejemplo, no se puede
dar de alta algo que va adentro de un edificio si no hay ningún edificio cargado.

### Las migas y el menú

**Las migas tienen que decir lo mismo que el título de la pantalla.** Si arriba dice
«Tipos de espacio», la miga no puede decir «tipos-espacio».

Cada dirección nueva se agrega al mapa `NOMBRES` de
`src/componentes/layout/Encabezado.js`, con el mismo texto que su título:

```js
const NOMBRES = {
  <entidad>: 'Nombre que aparece en el titulo',
  ...
};
```

Si te olvidás de agregarla, la miga muestra el tramo de la dirección tal cual, en
minúscula. Es el error más fácil de cometer al sumar una pantalla.

Los identificadores no se muestran nunca, ni un número ni un código: no son pantallas a
las que se pueda entrar.

El menú lateral se arma en `src/componentes/layout/navegacion.js`. Cuando un módulo tiene
una sola pantalla va un `item`, y cuando tiene varias va un `grupo` con sus `items`
adentro.

**Sólo puede haber un desplegable abierto a la vez**: al abrir uno, se cierra el que
estaba. Así el menú no se llena de opciones y entra en la pantalla sin scroll.

Ese comportamiento lo maneja `BarraLateral.js` con su propio estado, no CoreUI. El
`CSidebarNav` de CoreUI trae un acordeón incorporado, pero se peleaba con nuestro estado:
al abrir un grupo teniendo otro abierto, cerraba el anterior y no abría el nuevo, y había
que hacer clic dos veces. Como ese contexto no se exporta y no se puede desactivar, la
barra arma el `<ul className="sidebar-nav">` a mano. Hay un comentario en el archivo
explicándolo: no lo cambies sin leerlo.

### Cómo se nombran las cosas

Todo en español, incluidas las variables.

| Qué | Cómo |
|---|---|
| Componente de una página | `Pantalla<Entidad>`, `PantallaAgregar<Entidad>` |
| Funciones de un servicio | `listar<Entidad>`, `obtener<Entidad>`, `crear<Entidad>`, `actualizar<Entidad>`, `eliminar<Entidad>` |
| Estado de carga y guardado | `cargando`, `guardando`, `eliminando` |
| Error atrapado | `catch (fallo)` |
| Evento del DOM | `(evento) => ...` |
| Filtros | `filtro<Campo>` |

### Dar de baja no siempre es borrar

Si la entidad tiene historial que hay que conservar, la baja es un **cambio de estado**,
no un `DELETE`. El registro sigue apareciendo en el listado, sin botones de acción, porque
otras partes del sistema le apuntan y borrarlo dejaría huecos.

Cuando sí se borra de verdad, el backend rechaza la baja si hay algo que dependa de ese
registro, y el texto del `DialogoEliminar` lo aclara de antemano:

> Solo se puede eliminar si no tiene ... asociados.

## Notas importantes

**Variables de entorno.** En Next.js, toda variable que empiece con `NEXT_PUBLIC_`
queda visible en el navegador. Ahí sólo van claves públicas. La `SERVICE_ROLE_KEY`
de Supabase va únicamente en `backend/.env`.

**`AGENTS.md` y `CLAUDE.md`.** No los escribimos nosotros: los crea Next.js 16 solo,
cada vez que se ejecuta `npm run dev`. Avisan que esta versión de Next.js cambió
respecto de las anteriores. No hay que borrarlos, porque se vuelven a crear: se dejan
versionados y listo.
