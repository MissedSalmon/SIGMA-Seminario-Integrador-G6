# CLAUDE.md — SIGMA

Guía de contexto para trabajar en este repositorio. Está escrita en lenguaje simple
porque la leen los 7 integrantes del grupo, no sólo Claude.

---

## Qué es este proyecto

**SIGMA** (Sistema Integral de Gestión de Mantenimiento de Activos) es un sistema web
para gestionar el mantenimiento de la infraestructura de la UTN — Facultad Regional
Resistencia (UTN-FRRe).

Es el trabajo de la materia **Seminario Integrador** (Grupo 6, año 2026), última materia
para obtener el título de **Analista Universitario en Sistemas de Información**.

El ciclo que digitaliza es siempre el mismo:

```
Ticket → Validación → Orden de Trabajo (OT) → Tareas → Ejecución → Cierre automático
```

---

## Estado actual (27/08/2026)

- Ya se entregó la **Primera Carpeta** (17/07/2026). Nota: **76/100 — APROBADO**.
- Hay una **devolución con correcciones** que todavía no se aplicaron.
  El punto más pesado: **hay que rehacer el Modelo de Tablas**.
- **Sprint 0 hecho:** estructura del repositorio armada y funcionando
  (Next.js 16 + Express 5 + Supabase, monorepo con npm workspaces).
  Falta sólo la tarea T3 (base de datos), que depende de rehacer el modelo.
- Según el cronograma, el Sprint 1 terminó el 23/08 y el **Sprint 2 está en curso**.

---

## Cómo se corre

```bash
npm install
```

Después copiar `backend/.env.example` → `backend/.env` y
`frontend/.env.local.example` → `frontend/.env.local`, y completar los valores.

```bash
npm run dev:all
```

Levanta las dos partes juntas: frontend en `http://localhost:4000` y API en
`http://localhost:3000`. Más detalle en [arquitectura.md](.claude/contexto/arquitectura.md).

---

## Dónde está cada cosa

| Ruta | Qué es |
|---|---|
| `.claude/contexto/` | **Contexto ordenado por tema. Empezar por acá.** |
| `frontend/` | Aplicación web (Next.js 16 + React 19). |
| `backend/` | API REST (Express 5 + Supabase). |
| `supabase/migrations/` | Scripts SQL de la base de datos gestionados por la CLI. |
| `contexto.md` | Documento histórico del grupo. Es largo y mezcla decisiones viejas y nuevas. |

### Índice de `.claude/contexto/`

| Archivo | Contenido |
|---|---|
| [proyecto.md](.claude/contexto/proyecto.md) | Qué es SIGMA, equipo, problema, alcance, roadmap. |
| [dominio.md](.claude/contexto/dominio.md) | Roles, flujo de trabajo, estados, entidades, glosario. |
| [arquitectura.md](.claude/contexto/arquitectura.md) | Stack, estructura, conexiones, cómo se corre. |
| [trabajo-en-equipo.md](.claude/contexto/trabajo-en-equipo.md) | Git, issues, tablero, forma de trabajo. |

El detalle fino vive fuera de acá: las historias de usuario y sus criterios de aceptación
en los **issues de GitHub**, y el modelo de datos en `supabase/migrations/`.

---

## Reglas para trabajar en este repo

1. **No hacer commit ni push** salvo que se pida explícitamente.
2. **Escribir simple.** Los documentos los leen docentes y compañeros. Frases cortas,
   sin palabras rebuscadas, sin relleno.
3. **Todo en español**, incluido nombres de carpetas, archivos, variables, tablas y
   comentarios de código.
4. **JavaScript con módulos ES** (`import`/`export`), nunca `require`. En el **backend** las importaciones
   de archivos propios llevan la extensión: `'./app.js'`. En el **frontend** (Next.js), el Webpack ya está
   configurado para auto-resolver `.js`, `.jsx`, `.ts`, `.tsx`, etc.
5. **Las claves nunca se suben.** Los archivos `.env` están ignorados por Git. Si hay que
   compartir una clave, se hace por un canal privado.
6. **No cambiar versiones de dependencias** sin avisar al equipo.
7. **El modelo de tablas se está rehaciendo.** No dar por firme ninguna estructura hasta
   que estén las migraciones en `supabase/migrations/`.
8. **Una decisión que se toma, se escribe.** Si el equipo define algo (por ejemplo
   "un técnico tiene un solo tipo de trabajo"), se anota en el archivo de contexto que
   corresponda, con la fecha.
9. **No inventar datos del relevamiento.** Lo que se sabe salió de una sola entrevista
   (Secretario de Infraestructura, Carlos Olivieri). Si algo no está, se marca como
   pendiente de confirmar, no se completa a ojo.

---

## Todavía no existe

- **Las pantallas y los módulos de la API.** El esqueleto está armado, pero las carpetas
  `frontend/src/app/`, `backend/src/rutas/`, `controladores/` y `servicios/` se llenan a
  partir del Sprint 1.

*(Nota: La base de datos ya fue refactorizada e integrada con Supabase CLI en la carpeta `supabase/migrations/`)*
