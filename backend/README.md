# Backend — API de SIGMA

API REST hecha con Express 5 sobre Node.js 22. Se conecta a Supabase (PostgreSQL).

## Cómo correrlo

Desde la **raíz del repositorio**:

```bash
npm install
```

Después, copiar `backend/.env.example` como `backend/.env` y completar los valores.

Para levantar sólo el backend:

```bash
npm run dev:backend
```

Queda en `http://localhost:4000`. Para probar que funciona:
`http://localhost:4000/api/salud`

## Estructura

```
backend/
├── nodemon.json          # qué archivos vigilar en desarrollo
├── .env.example          # plantilla de variables de entorno
└── src/
    ├── index.js          # arranca el servidor
    ├── app.js            # configura Express (CORS, JSON, rutas)
    ├── config/
    │   ├── env.js        # carga y valida las variables de entorno
    │   └── supabase.js   # conexión a la base de datos
    ├── rutas/            # define las direcciones de la API
    ├── controladores/    # reciben el pedido y arman la respuesta
    ├── servicios/        # reglas de negocio y consultas a la base
    └── middlewares/      # errores y ruta no encontrada
```

## Cómo se agrega un módulo nuevo

Cada módulo del sistema (tickets, órdenes de trabajo, activos, inventario) usa
siempre los mismos tres archivos:

| Archivo | Responsabilidad |
|---|---|
| `rutas/tickets.rutas.js` | Qué direcciones existen: `GET /tickets`, `POST /tickets`… |
| `controladores/tickets.controlador.js` | Lee el pedido, llama al servicio, devuelve la respuesta. **No consulta la base.** |
| `servicios/tickets.servicio.js` | Reglas de negocio y consultas a Supabase. **No sabe nada de HTTP.** |

Después se monta en `src/rutas/index.js`:

```js
import rutasTickets from './tickets.rutas.js';
router.use('/tickets', rutasTickets);
```

**Por qué se separa así:** si mañana cambia la base de datos, se toca sólo el
servicio. Si cambia la forma de la respuesta, sólo el controlador.

## Formato de las respuestas

Siempre el mismo, para que el frontend no tenga que adivinar:

```json
// Todo bien
{ "ok": true, "datos": { } }

// Error
{ "ok": false, "mensaje": "El ticket no existe." }
```

## Notas importantes

- **La `SUPABASE_SERVICE_ROLE_KEY` va sólo acá.** Saltea todas las reglas de
  seguridad de la base. Nunca en el frontend ni en el repositorio.
- El proyecto usa **módulos ES** (`import`/`export`), no `require`. Las
  importaciones de archivos propios llevan la extensión: `'./app.js'`.
- Express 5 pasa solo los errores de funciones `async` al manejador de errores,
  así que no hace falta `try/catch` en cada controlador.
