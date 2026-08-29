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
