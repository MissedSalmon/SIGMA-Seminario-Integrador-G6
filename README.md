<div align="center">

# 🔧 SIGMA

### Sistema Integral de Gestión de Mantenimiento de Activos

_“Todo tu mantenimiento, sumado.”_

<br>

![Estado](https://img.shields.io/badge/estado-en_desarrollo-0B6B8C?style=for-the-badge)
![Historias](https://img.shields.io/badge/HU-34-F08A24?style=for-the-badge)
![Sprints](https://img.shields.io/badge/sprints-7-0B6B8C?style=for-the-badge)

![Next.js](https://img.shields.io/badge/Next.js_16-0C2733?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-0C2733?style=flat-square&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express_5-0C2733?style=flat-square&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-0C2733?style=flat-square&logo=supabase&logoColor=3ECF8E)
![UTN--FRRe](https://img.shields.io/badge/UTN--FRRe-Seminario_Integrador-0B6B8C?style=flat-square)

</div>

---

## 🧩 ¿Qué es?

**SIGMA** digitaliza y da trazabilidad al ciclo completo de **mantenimiento de activos e infraestructura** de una facultad. Reemplaza planillas y comunicación informal por un flujo único, medible y ordenado:

```
🎫 Ticket  →  ✅ Validar  →  ⚙️ OT automática  →  🧰 Tareas (técnico / prestador)  →  🔨 Ejecución  →  🔒 Cierre
```

---

## ✨ Características

| | Módulo | Qué hace |
|---|---|---|
| 🎫 | **Tickets** | El usuario autorizado reporta un desperfecto; el admin valida o rechaza. |
| ⚙️ | **Órdenes de trabajo** | Se generan **automáticamente** al validar; con tareas, prioridad, falla y asignación. |
| 🧰 | **Ejecución** | El técnico registra repuestos (baja stock solo) y observaciones. |
| 📦 | **Inventario** | Catálogo, stock, ingresos por remito, importación desde Excel y alertas de mínimo. |
| 🗓️ | **Mant. preventivo** | Planes que **generan OT preventivas automáticamente**. |
| 📊 | **Tablero KPIs** | Tiempos de resolución, consumo de materiales, carga por técnico, historial por activo. |
| 👥 | **3 roles** | Administrador · Técnico · Usuario autorizado. |

> ⚡ **Automatizaciones** para menos burocracia: OT automática al validar, egreso de stock al completar tareas, estado de activo automático, técnico sugerido por especialidad, materiales sugeridos, aviso de duplicados y más.

---

## 👥 Roles

| Rol | Qué hace |
|-----|----------|
| **🛡️ Administrador** | Valida tickets, arma OT, asigna técnicos/prestadores, gestiona activos, inventario y planes preventivos. |
| **🔧 Técnico** | Ejecuta las tareas de la OT, carga materiales y observaciones. |
| **📝 Usuario autorizado** | Registra tickets de su área y sigue su estado. |

---

## 🚀 Cómo correrlo

Requisito: **Node.js 22**.

```bash
npm install
```

Después copiá las plantillas de variables de entorno y completá los valores:

- `backend/.env.example` → `backend/.env`
- `frontend/.env.local.example` → `frontend/.env.local`

Y levantá las dos partes juntas:

```bash
npm run dev:all
```

| | Dirección |
|---|---|
| Frontend | http://localhost:3000 |
| API | http://localhost:4000/api/salud |

**Otros comandos:**

| Comando | Qué hace |
|---|---|
| `npm run dev:frontend` | Sólo las pantallas. |
| `npm run dev:backend` | Sólo la API. |
| `npm run build` | Compila el frontend. |
| `npm run lint` | Revisa el estilo del código. |
| `npm run db:push` | Aplica las migraciones pendientes a Supabase. |

> Antes de usar `db:push` hay que estar autenticado (`npx supabase login`) y tener el
> proyecto vinculado (`npm run db:link`). Ojo: la base es compartida por todo el grupo.

---

## 🧰 Stack

| Capa | Tecnología |
|---|---|
| Frontend | Next.js 16 · React 19 |
| Backend | Node.js 22 · Express 5 |
| Base de datos | Supabase (PostgreSQL) |
| Despliegue | Vercel + Supabase |

Todo en **JavaScript con módulos ES**, monorepo con **npm workspaces**.

---

## 📁 Estructura

```
SIGMA-Seminario-Integrador-G6/
├── frontend/                # 🖥️ Next.js 16 + React 19
│   ├── public/
│   └── src/
│       ├── app/             #    pantallas (App Router)
│       ├── componentes/     #    piezas reutilizables
│       ├── lib/             #    conexión a Supabase (navegador)
│       └── servicios/       #    cliente HTTP hacia el backend
│
├── backend/                 # ⚙️ API REST con Express 5
│   └── src/
│       ├── config/          #    variables de entorno + Supabase
│       ├── rutas/
│       ├── controladores/
│       ├── servicios/
│       └── middlewares/
│
├── supabase/migrations/     # 🗄️ scripts SQL (migraciones gestionadas por Supabase CLI)
│
├── .claude/contexto/        # 📖 contexto del proyecto por tema
└── contexto.md              # 📖 documento histórico del grupo
```

---

## 🗺️ Roadmap & gestión

- **7 sprints** de 2 semanas — del **10/08** al **26/11/2026**.
- **34 historias de usuario** con story points, gestionadas en **GitHub Projects** (issues + milestones por sprint + labels por rol).

📌 **Tablero:** [SIGMA — Roadmap G6](https://github.com/users/matiasgzlez/projects/4)

---

## 📚 Documentación

| Documento | Contenido |
|---|---|
| [`.claude/contexto/`](.claude/contexto/) | Contexto general: proyecto, dominio, arquitectura y forma de trabajo. |
| [`frontend/README.md`](frontend/README.md) | Cómo se arma una pantalla y las **pautas de diseño** que seguimos todos. |
| [`backend/README.md`](backend/README.md) | Cómo se agrega un módulo a la API. |
| [`supabase/migrations/README.md`](supabase/migrations/README.md) | Cómo se cambia la base de datos sin pisarse entre compañeros. |
| [`contexto.md`](contexto.md) | Documento histórico: situación, glosario, modelo de tablas, roadmap de HU, automatizaciones. |

> **Antes de armar una pantalla nueva**, leé las pautas de diseño del
> [README del frontend](frontend/README.md#pautas-de-diseño). Están para que todas las
> pantallas se vean y se usen igual, sin importar quién las hizo.

---

## 👨‍💻 Equipo — Grupo 6

Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro

<div align="center">
<br>

**Seminario Integrador · UTN — Facultad Regional Resistencia · 2026**

`Sigma Teal #0B6B8C` &nbsp;·&nbsp; `Signal Amber #F08A24` &nbsp;·&nbsp; `Deep Ink #0C2733`

</div>
