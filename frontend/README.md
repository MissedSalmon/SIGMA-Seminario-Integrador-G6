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
    ├── componentes/      # piezas reutilizables (tablas, formularios, botones)
    ├── lib/
    │   └── supabase.js   # conexión a Supabase desde el navegador
    └── servicios/
        └── api.js        # cliente para hablar con el backend
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

## Notas importantes

**Variables de entorno.** En Next.js, toda variable que empiece con `NEXT_PUBLIC_`
queda visible en el navegador. Ahí sólo van claves públicas. La `SERVICE_ROLE_KEY`
de Supabase va únicamente en `backend/.env`.

**`AGENTS.md` y `CLAUDE.md`.** No los escribimos nosotros: los crea Next.js 16 solo,
cada vez que se ejecuta `npm run dev`. Avisan que esta versión de Next.js cambió
respecto de las anteriores. No hay que borrarlos, porque se vuelven a crear: se dejan
versionados y listo.
