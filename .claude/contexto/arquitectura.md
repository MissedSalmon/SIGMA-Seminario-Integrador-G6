# Arquitectura y entorno

## Cómo está pensado el sistema

SIGMA es una aplicación web: se usa desde el navegador y no hay que instalar nada.
Tres partes:

1. **Frontend:** pantallas, formularios, listados y tablero. Responsive, para que el
   técnico lo use desde el celular mientras el administrador trabaja desde la PC.
2. **Backend:** decide qué puede hacer cada usuario y aplica las reglas del mantenimiento
   (genera la OT al validar, descuenta stock, cierra la OT y el ticket, calcula los
   indicadores). Incluye una tarea programada que genera las OT preventivas.
3. **Base de datos y almacenamiento de fotos:** las fotos se guardan aparte de la base.

## Versiones

Están fijadas en los `package.json`. **No cambiarlas sin avisar al equipo:** si cada uno
usa una versión distinta, aparecen errores que no se pueden reproducir.

| Qué | Versión |
|---|---|
| **Node.js** | 22 LTS (anotado en `.nvmrc`) |
| **Next.js** | 16.3.3 |
| **React** | 19.2.8 |
| **Express** | 5.2.1 |
| **@supabase/supabase-js** | 2.112.4 |
| **Axios** | 1.20.0 |
| **CORS / Dotenv / Nodemon** | 2.8.6 / 17.4.2 / 3.1.14 |
| **ESLint** | 9.39.5 |
| **Concurrently** | 10.0.5 |
| **@coreui/react** | 5.13.0 |
| **@coreui/coreui** | 5.9.0 |
| **@coreui/icons / icons-react** | 3.1.0 / 2.3.0 |
| **@heroui/react** | 3.2.6 (sólo el campo de fecha) |
| **tailwindcss / @tailwindcss/postcss** | 4 (sólo para compilar HeroUI) |
| **react-aria / react-aria-components** | 3.52.1 / 1.21.1 (los pide HeroUI) |
| **@internationalized/date** | 3.12.4 (los pide HeroUI) |

Decisiones tomadas:

- **JavaScript con módulos ES** (`import`/`export`), no TypeScript ni `require`.
- **Monorepo con npm workspaces:** un solo `npm install` en la raíz instala todo.
- **Todo en español**, incluidas carpetas, archivos, variables y nombres de tablas.
- **Decisión del 28/08/2026: la interfaz usa CoreUI**, la plantilla de administración
  gratuita (barra lateral, encabezado, tablas, formularios). Se armó sobre Next.js en
  `frontend/src/componentes/layout/`; no se copió el proyecto de CoreUI, que viene
  hecho para Vite y React Router.

> ESLint queda en la línea 9 a propósito: es la versión con la que está construido
> `eslint-config-next` 16. Al instalar aparece un aviso de que la 9 es antigua. Es sólo
> un aviso, no rompe nada.

**Se publica en Vercel** (pantallas y API) **y Supabase** (base de datos y fotos). Los dos
tienen plan gratuito, con publicación automática y copias de seguridad, sin administrar un
servidor propio.

---

## Estructura del repositorio

```
SIGMA-Seminario-Integrador-G6/
│
├── package.json              # workspaces y comandos generales
├── .nvmrc / .editorconfig    # versión de Node y formato común
├── CLAUDE.md
│
├── frontend/                 # Next.js 16 + React 19
│   ├── next.config.mjs
│   ├── jsconfig.json         # atajo @/ para importar
│   ├── eslint.config.mjs
│   ├── .env.local.example
│   ├── public/               # imágenes, logos
│   └── src/
│       ├── app/              # las pantallas (cada carpeta es una dirección)
│       ├── componentes/      # piezas reutilizables
│       ├── utils/supabase/   # conexión a Supabase con SSR (server, client, middleware)
│       └── servicios/api.js  # cliente para hablar con el backend
│
├── backend/                  # Express 5
│   ├── nodemon.json
│   ├── .env.example
│   └── src/
│       ├── index.js          # arranca el servidor
│       ├── app.js            # configura Express
│       ├── config/           # variables de entorno y conexión a Supabase
│       ├── rutas/            # direcciones de la API
│       ├── controladores/    # reciben el pedido, arman la respuesta
│       ├── servicios/        # reglas de negocio y consultas
│       └── middlewares/      # errores y ruta no encontrada
│
└── supabase/                 # configuración de Supabase CLI y migraciones SQL
```

### Cómo se agrega un módulo

**Backend** — siempre los mismos tres archivos por módulo:

| Archivo | Responsabilidad |
|---|---|
| `rutas/tickets.rutas.js` | Qué direcciones existen. |
| `controladores/tickets.controlador.js` | Lee el pedido, llama al servicio, devuelve la respuesta. **No consulta la base.** |
| `servicios/tickets.servicio.js` | Reglas de negocio y consultas. **No sabe nada de HTTP.** |

**Frontend** — cada carpeta dentro de `src/app/` es una dirección:

```
src/app/tickets/page.js          →  /tickets
src/app/tickets/agregar/page.js  →  /tickets/agregar
src/app/tickets/[id]/page.js     →  /tickets/5
```

**Los tipos cuelgan de su módulo** (15/09/2026): `/espacios/tipos` y `/inventario/tipos`.
(`/tipos-activos` quedó de antes con la otra forma.)

Para que eso funcione, **el breadcrumb busca por la dirección entera y no por el último
tramo**. Si buscara por el tramo suelto, `tipos` tendría que significar una sola cosa y
`/inventario/tipos` mostraría *"Tipos de espacio"*, que es lo que pasaba. Cada pantalla
nueva se agrega a `NOMBRES` en `Encabezado.js` con su dirección completa.

⚠️ Ojo al tocar esto: en `servicios/inventario.js`, `/inventario/tipos` es la dirección de
la **API**, no de la pantalla. Esa no se cambia.

---

### El armazón de las pantallas

Todas las pantallas viven dentro del panel de administración de CoreUI. El armazón se
aplica una sola vez en `frontend/src/app/layout.js`, así que una pantalla nueva sólo
escribe su contenido y ya aparece con la barra lateral y el encabezado.

```
frontend/src/componentes/
├── layout/
│   ├── LayoutAdmin.js       # junta las cuatro piezas de abajo
│   ├── BarraLateral.js      # el menú de la izquierda
│   ├── Encabezado.js        # botón del menú + ruta de migas
│   ├── PieDePagina.js
│   ├── navegacion.js        # ⬅ acá se agrega cada opción del menú
│   └── ContextoLayout.js    # si la barra lateral está abierta o cerrada
├── BotonEnlace.js           # un <Link> con estilo de botón
├── EncabezadoPagina.js      # título + botón de acción
├── Aviso.js                 # cartel de error o de éxito
├── DialogoEliminar.js       # confirmación antes de una baja
└── EstadoTabla.js           # "cargando..." y "no hay datos"
```

**Dos trampas de CoreUI con Next.js**, que ya costaron un rato:

- `CNavItem` usa su prop `as` para el `<li>` de afuera, no para el enlace. El `<Link>`
  de Next va en el `CNavLink` de adentro.
- `CButton`, cuando recibe `href`, ignora el `as` y arma un `<a>` común: cada clic
  recarga toda la aplicación. Para eso está `BotonEnlace`.

### Los campos tienen ancho fijo (15/09/2026)

Cada `<Campo>` declara su `ancho` en caracteres y **esa medida no cambia con lo que se
escribe**. Antes la caja crecía con el texto, y al escribir un nombre largo se corrían de
lugar todos los campos que seguían. El que no declara nada mide 16 caracteres.

Las fechas y los `tipo="area"` no usan `ancho`: la fecha siempre mide lo mismo
(dd/mm/aaaa) y su ancho lo pone `globals.css`, y el área ocupa el renglón entero (sí
crece a lo alto).

### Los campos no llevan descripción (23/09/2026)

Debajo de la caja de un campo **sólo aparece el motivo cuando algo está mal**. No va una
línea gris explicando para qué es el campo: eso lo dice la etiqueta.

Antes había 28 de esas descripciones repartidas por los formularios ("No se puede repetir:
identifica al activo", "Un material se consume; una herramienta se presta", etc.). Se
sacaron todas, junto con la prop `ayuda` de `Campo`, `CampoFecha` y `SeleccionMultiple`,
que era la que las dibujaba. Si algún día se quieren volver a poner hay que reponer la
prop en esos tres componentes.

⬜ **Quedaron cuatro avisos afuera que no eran descripciones**, sino información que no se
lee en ningún otro lado. Están anotados como pendientes de decidir:

| Dónde | Qué decía |
|---|---|
| Activos, Espacio | La fecha de la última reubicación del activo. |
| Activos, Estado | Que ese estado lo maneja la OT y por eso está deshabilitado. |
| Inventario, Stock | Que el stock lo mueven los préstamos, no el formulario. |
| Usuarios autorizados, Área | El aviso de que no hay áreas libres, cuando la lista viene vacía. |

### Las reglas de DNI, CUIL y teléfono (15/09/2026)

Antes cada pantalla tenía su propia copia de estas reglas y no coincidían entre sí: el
teléfono aceptaba 30 caracteres en una pantalla y 50 en otra, y ninguna de las dos
controlaba que fueran números. Ahora las reglas están escritas una sola vez:

| Archivo | Para qué |
|---|---|
| `frontend/src/utils/validaciones.js` | Las reglas del lado de la pantalla. |
| `backend/src/utiles/validaciones.js` | Las mismas reglas del lado de la API. |
| `frontend/src/componentes/formulario/CampoDni.js` | El campo de DNI, listo para usar. |
| `frontend/src/componentes/formulario/CampoCuil.js` | El campo de CUIL. |
| `frontend/src/componentes/formulario/CampoTelefono.js` | El campo de teléfono. |

Una pantalla que pida estos datos **no escribe sus propias reglas**: usa los tres campos
de arriba y llama a `validarDni`, `validarCuil` y `validarTelefono`.

Lo que se decidió:

- **DNI**: 8 dígitos exactos.
- **CUIL**: se escribe a mano. Los guiones se ponen solos (`20-34567883-4`) y al guardar
  se controla el dígito verificador, que es lo que detecta un número mal tipeado. Si
  además hay DNI cargado, se controla que los 8 del medio coincidan.
- **Teléfono**: 10 dígitos, característica y número separados con un espacio
  (`362 4123456`). El 0 de adelante y el 15 se sacan solos.
- **Email**: tiene que tener algo antes del `@`, algo después y terminar en un punto con
  al menos dos letras. Así no pasa un `juan@` ni un `juan@gmail`.
- **Cómo se guarda**: el dato se guarda ya ordenado, tal como se lee.
- En usuarios autorizados, **DNI y fecha de nacimiento son obligatorios**.

⬜ **Las reglas están repetidas a propósito en los dos archivos**, porque a la API se le
puede pegar directo sin pasar por la pantalla. Si se cambia una regla en un lado, hay que
cambiarla en el otro. Las restricciones en la base quedan para después.

### La ruta de migas usa HeroUI (23/09/2026)

El "Inicio › Inventario › Tipos de materiales" de arriba de cada pantalla es el
`Breadcrumbs` de HeroUI. Antes era el de CoreUI. Está en un solo lugar,
`frontend/src/componentes/layout/Encabezado.js`, así que sale igual en las 29 pantallas.

Lo que cambia para quien lo lee: el separador ahora es una flechita (`›`), que es la de
HeroUI, en lugar de la barra (`/`) de CoreUI. **Los colores y el tamaño son los mismos que
antes** (1.25rem, semi-negrita, los enlaces en el teal institucional y la pantalla actual en
gris), y de paso se arreglaron dos cosas:

- **Todos los enlaces se ven igual.** Antes "Inicio" quedaba subrayado y los demás no,
  porque el `text-decoration-none` caía en el `<li>` y no en el enlace. Ahora el subrayado
  aparece sólo al pasar por encima.
- **`/ordenes-trabajo` mostraba "ordenes-trabajo"**, en minúscula y con guión, porque
  faltaba en el mapa `NOMBRES`.

⬜ **Cada pantalla nueva se anota en `NOMBRES`**, con el mismo texto que su título. Si no,
la miga muestra el tramo de la dirección tal cual (que es lo que pasaba con las órdenes de
trabajo). El mapa se busca por la dirección entera y no por el último tramo, para que
"tipos" pueda significar una cosa en espacios y otra en inventario.

⬜ **La última miga la marca el componente solo.** No se le pasa dirección y react-aria ya
la muestra como "estás acá", sin enlace. Antes había que decirle cuál era la última a mano.

⬜ **Las migas navegan por dentro gracias a `RouterProvider`.** Los enlaces de react-aria
son `<a>` comunes hasta que se le dice cómo navegar; sin eso, cada clic recargaría la
pantalla entera en lugar de moverse como un `<Link>` de Next. Comprobado: cero recargas al
hacer clic.

### Elegir una opción usa HeroUI (23/09/2026)

Todos los selectores de SIGMA son `frontend/src/componentes/formulario/CampoLista.js`,
que es el **ComboBox de HeroUI**. Reemplaza a los dos que había: el `<select>` de CoreUI
(18 campos) y `react-select` (el buscador de activos del ticket). Los 16 desplegables de
las barras de filtros de las tablas también son este componente.

**Qué gana:** la lista **se filtra escribiendo**, que es lo que hacía falta en las listas
largas (espacios, activos). El filtrado lo hace react-aria solo: alcanza con **no** pasarle
`items` y entonces filtra la lista que le dimos comparando lo tecleado con el texto de cada
opción. No se puede escribir cualquier cosa: si lo escrito no está en la lista, al salir del
campo vuelve a lo que había.

**Las pantallas no cambiaron.** Se sigue escribiendo `<Campo tipo="lista">` (o
`tipo="buscador"`) como siempre: `Campo.js` delega solo. Y hacia afuera el campo sigue
hablando en texto, igual que el `<select>`: lo que llega a `alCambiar` es siempre una cadena
(`"5"`, o `""` si no hay nada elegido), así que los formularios que hacían `Number(idTipo)`
andan sin tocar nada.

⬜ **Las claves de las opciones se pasan a texto a propósito.** react-aria compara la clave
elegida con la de cada opción, y para él un `5` no es un `"5"`. Si no se convierten, al
editar un registro el campo aparece vacío aunque el valor esté.

**Cómo se vacía:** un `<select>` tenía una opción vacía arriba; acá eso se pide con
`textoVacio`. Es lo que usan los filtros para su "Todos".

**Los colores son los de SIGMA**, no los de HeroUI, y salen de las mismas variables
`--field-*` que usa el campo de fecha (ver la sección de abajo). La lista desplegada se
dibuja al final del `<body>`, así que sus colores van aparte, con la clase
`.sigma-lista-popover`: fondo blanco y la opción bajo el puntero en el celeste suave de la
marca, el mismo de las filas de las tablas.

⬜ **El ancho de los filtros no se fija en el componente**, se deja en `globals.css` con un
`flex` que se encoge. Con un ancho fijo la barra se iba a un renglón de más en las pantallas
medianas, y la regla 2 del CLAUDE.md pide que entre en una sola línea.

⬜ **`react-select` quedó sin usar.** Sigue en `frontend/package.json` porque sacar una
dependencia se avisa al equipo (regla 6). Se puede borrar. Con el cambio se fue de paso un
aviso de hidratación de React que tiraba `/tickets/agregar`: react-select generaba ids
distintos en el servidor y en el navegador.

### El campo de fecha usa HeroUI (23/09/2026)

Todas las fechas de SIGMA se cargan con `frontend/src/componentes/formulario/CampoFecha.js`,
que es el `DatePicker` de **HeroUI v3**. Antes era el `<input type="date">` del navegador.

**Por qué se cambió:** ese input lo dibuja cada navegador a su manera. El almanaque de
Chrome no se parece al de Firefox ni al del celular, y no se le puede dar el estilo de la
plantilla. El de HeroUI se ve igual en todas partes, sale en castellano (`es-AR`, con los
casilleros en orden dd/mm/aaaa) y trae selector de año, que hacía falta para una fecha de
nacimiento.

**Las pantallas no cambiaron.** Se sigue escribiendo `<Campo tipoHtml="date">` como
siempre: `Campo.js` delega solo en `CampoFecha`. Hacia afuera el campo sigue hablando en
texto `"2026-09-14"`, igual que antes, así que los formularios guardan y comparan texto
como venían haciendo. La traducción al `CalendarDate` que pide HeroUI la hacen
`aFechaCalendario` y `deFechaCalendario`, en `frontend/src/utils/fechas.js`.

**Los límites de cada fecha** (`min` y `max` del `<Campo>`, en el mismo formato de texto)
apagan los días que no se pueden elegir en el almanaque:

| Pantalla | Campo | Límite |
|---|---|---|
| Activos | Fecha de alta | No posterior a hoy: todavía no pasó. |
| Usuarios autorizados | Fecha de nacimiento | Hasta hoy menos 18 años. El almanaque abre directamente en ese año. |
| Inventario | Vence el | **No anterior a hoy** (decisión del 23/09/2026): un material no se carga ya vencido. Editando uno que ya estaba vencido, el mínimo es su propia fecha, para poder guardar los demás cambios. |
| Órdenes de trabajo | Inicio y fin previstos | No anteriores a hoy, y el fin no antes del inicio. |
| Tickets y Órdenes | Filtros Desde / Hasta | El rango no se puede dar vuelta: el "Desde" no pasa del "Hasta" y al revés. |

⬜ **El límite del almanaque es una ayuda, no el control.** Los formularios son
`noValidate` y la fecha se puede tipear a mano en los casilleros, así que el que corta de
verdad sigue siendo la validación del formulario. Toda fecha con límite tiene las dos
cosas.

⬜ **En `CampoFecha.js` los límites se pasan dos veces a propósito**, al `DatePicker` y al
`Calendar`. No está repetido por descuido: el `CalendarRoot` de HeroUI no hereda el
`minValue`/`maxValue` del `DatePicker`, usa los suyos (1900 a 2099) si no se los pasan, y
entonces el almanaque deja elegir cualquier día. Si se saca una de las dos, el límite deja
de cumplirse de un lado.

#### Lo que hubo que hacer para que HeroUI conviva con CoreUI

HeroUI está hecho con **Tailwind v4** y su CSS viene sin compilar, así que se agregó
`frontend/postcss.config.mjs`. Lo único que se compila es `frontend/src/app/heroui.css`;
el resto de SIGMA sigue siendo CoreUI + `globals.css`, **sin Tailwind**.

Dos cuidados, los dos explicados en el comentario de `heroui.css`:

- **El reset de Tailwind queda afuera.** El import normal de HeroUI arrastra el
  "preflight", un reset global que pone `margin:0`, `padding:0` y `border:0` en todo y
  aplana los títulos. Sobre Bootstrap eso desarma **todas** las pantallas, no sólo las
  fechas. Por eso se importan a mano las partes de Tailwind que hacen falta y se deja el
  preflight afuera.
- **Hay que reponerle a HeroUI el reset que espera.** HeroUI no dibuja bordes ni rellenos
  en sus botones: da por hecho que el preflight ya los puso en cero. Sin preflight, los
  botones del almanaque se quedaban con lo de fábrica del navegador (`border: 2px outset`,
  el borde biselado de Windows 95, y `padding: 1px 6px`), y la flechita de mes y la
  pastilla del año se veían con un aro gris cortado y fondo gris. Se repone el reset, pero
  **acotado al campo de fecha y al almanaque**, y sólo con las dos reglas que HeroUI usa.
  Va dentro de `layer(base)`, que es donde iría el preflight: así le gana a lo de fábrica
  del navegador pero **pierde** contra la capa de componentes de HeroUI, que es la que
  después pone el relleno y las esquinas de cada cosa. Fuera de las capas le ganaría
  también a HeroUI y le borraría esos rellenos.
- **Que CoreUI no le pise las esquinas.** CoreUI no está dentro de ninguna `@layer`, y en
  CSS lo que no está en capas le gana a lo que sí está, sin importar la especificidad.
  Por eso su `button{border-radius:0}` le ganaba al `rounded-2xl` de HeroUI y las
  flechitas quedaban cuadradas. Se arregla con una regla `revert-layer` acotada al campo
  de fecha y al almanaque.

⬜ **Regla práctica si algo del almanaque se ve raro:** casi siempre es una de estas dos
cosas, no un problema de HeroUI. Conviene comparar contra
[heroui.com](https://heroui.com) antes de agregar CSS propio: si hace falta forzar un
ancho o un relleno para que algo se vea bien, probablemente falte reponer un pedazo del
reset en lugar de tapar el síntoma.

### Elegir varias opciones a la vez (15/09/2026)

`frontend/src/componentes/formulario/SeleccionMultiple.js` es un desplegable donde cada
opción es una casilla para tildar, con una casilla arriba de todo que marca y desmarca
todas juntas.

⬜ **Hoy no lo usa ninguna pantalla** (comprobado el 23/09/2026). El formulario de técnicos
terminó mostrando las especialidades como una grilla de casillas a la vista, sin
desplegable. Queda para decidir si se borra o si se vuelve a usar.

Se armó a mano porque el `CMultiSelect` de CoreUI **es de la versión paga**: está hecho
con `CDropdown` y `CFormCheck`. El menú no se cierra al tildar (`autoClose="outside"`).

---

## Datos de prueba (temporal)

⬜ **La base de datos todavía no existe** (el modelo se está rehaciendo). Mientras tanto
los módulos de edificios, espacios y áreas trabajan contra `backend/src/datos-mock/`, que
guarda todo en memoria: los datos se pierden al reiniciar el servidor.

Por eso el backend **arranca sin las claves de Supabase**: si faltan, avisa y sigue.

Cuando esté la base hay que deshacer las tres cosas:

1. Reemplazar en `backend/src/servicios/` las funciones del mock por consultas a Supabase.
2. Borrar la carpeta `backend/src/datos-mock/`.
3. En `backend/src/config/env.js`, volver a cortar el arranque si faltan las variables.

---

## Las dos conexiones a Supabase

Es lo más importante de entender y lo más fácil de equivocar:

| Archivo | Clave | Dónde corre | Para qué |
|---|---|---|---|
| `backend/src/config/supabase.js` | `SERVICE_ROLE_KEY` | Servidor | Todo el negocio. Saltea las reglas de seguridad. |
| `frontend/src/lib/supabase.js` | `ANON_KEY` | Navegador | Sólo login y subida de fotos. |

> ⚠️ **La `SERVICE_ROLE_KEY` nunca va al frontend.** Si se filtra, cualquiera puede leer y
> modificar toda la base. Va únicamente en `backend/.env`, que no se sube al repositorio.
> En Next.js, toda variable que empiece con `NEXT_PUBLIC_` queda visible en el navegador.

Para todo lo demás el frontend **no habla directo con Supabase**: llama al backend a través
de `frontend/src/servicios/api.js`, porque ahí viven las reglas de negocio.

---

## Cómo se corre

Una sola vez:

```bash
npm install
```

Copiar las plantillas de variables de entorno y completarlas:

- `backend/.env.example` → `backend/.env`
- `frontend/.env.local.example` → `frontend/.env.local`

| Comando | Qué hace |
|---|---|
| `npm run dev:all` | Levanta backend y frontend juntos. |
| `npm run dev:backend` | Sólo la API, en `http://localhost:3000`. |
| `npm run dev:frontend` | Sólo las pantallas, en `http://localhost:4000`. |
| `npm run build` | Compila el frontend. |
| `npm run lint` | Revisa el estilo del código. |
| `npm run db:push` | Sube los cambios de la BD local (`supabase/migrations/`) a Supabase remoto. |

Para probar que la API está viva: `http://localhost:3000/api/salud`

### Formato de las respuestas de la API

Siempre el mismo, para que el frontend no tenga que adivinar:

```json
{ "ok": true,  "datos": { } }
{ "ok": false, "mensaje": "El ticket no existe." }
```

---

## Cómo se prueba

Las pruebas son **manuales**. Se verifica cada historia contra sus criterios de aceptación,
que están cargados en el issue y funcionan como casos de prueba.

Al cierre de cada sprint se recorren las historias construidas, probando tanto el camino
normal como el comportamiento ante errores (cargar un ticket sin elegir objeto, usar más
material del que hay en depósito). Los defectos se cargan como issues y se resuelven en el
sprint siguiente.

---

## Dos archivos que genera Next.js solo

`frontend/AGENTS.md` y `frontend/CLAUDE.md` los crea Next.js 16 cada vez que se ejecuta
`npm run dev`. No los escribimos nosotros y no sirve borrarlos: se vuelven a crear. Se
dejan versionados y listo.

## Bajas Lógicas vs Físicas e Integridad Referencial

El sistema SIGMA utiliza un modelo híbrido para el borrado de registros, diseñado para proteger la consistencia de los datos y el historial de mantenimiento:

- **Activos (Baja Lógica):** Los activos (inventario físico) *nunca* se borran con `DELETE`. En su lugar, pasan a estado `Retirado` (actualizando `activo_estado` y seteando `activo_fecha_baja`). Esto es vital para no perder el historial de fallas, tickets y mantenimientos que sufrieron durante su ciclo de vida.
- **Catálogos y Entidades Estructurales (Baja Física Restringida):** Entidades como `Edificio`, `Técnico`, `Tipo de Activo` o `Área` se borran físicamente (`DELETE`). Sin embargo, estas operaciones están protegidas por la base de datos mediante `ON DELETE RESTRICT`. Esto significa que es imposible borrar un edificio que contiene activos o un técnico que tiene tareas asignadas. 
- **Entidades Débiles/Relacionales (Baja Física en Cascada):** Solo se usa `ON DELETE CASCADE` donde corresponde semánticamente (ej: al borrar un Edificio vacío, se borran sus Espacios; al borrar un Técnico sin tareas, se borran sus especialidades asociadas).

*(Nota: En futuras iteraciones, evaluar la transición a baja lógica para los `Técnicos` y `Prestadores` si la retención de historial de las tareas de personal que se desvincula se vuelve un cuello de botella para la base de datos).*
