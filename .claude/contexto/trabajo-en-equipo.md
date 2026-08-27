# Trabajo en equipo

## Herramientas

| Herramienta | Para qué |
|---|---|
| **GitHub — repositorio** | Código fuente y documentación. Control de versiones con Git. |
| **GitHub Projects** | Gestión del proyecto: issues, milestones y tablero Kanban. |
| **Discord** | Reuniones del equipo: planificación, revisión y retrospectiva de cada sprint. También para trabajar de a dos en historias complejas. |
| **WhatsApp** | Comunicación diaria e informal: avisos rápidos, coordinar horarios, consultas puntuales. |
| **Google Drive** | Escribir la documentación de la carpeta entre varios, con edición simultánea. |

---

## Git

- Cada integrante trabaja en **su propia rama**.
- El trabajo se integra a `main` con **pull request**, para que otro lo revise antes.
- Rama principal: `main`. Remoto: `origin`.

> ⚠️ **En este repositorio no se hace commit ni push automático.** Sólo cuando alguien lo
> pide explícitamente.

---

## Issues

Cada historia de usuario es un issue. **El número de historia coincide con el número de
issue.**

**Título:** `HU-N · <acción concreta> [N SP]` — por ejemplo `HU-14 · Crear OT [8 SP]`

**Cuerpo:**

```
Como <rol>, quiero <acción>, para <beneficio>.

**Story points (borrador):** N
**Sprint:** Sprint N

### Criterios de aceptación
- [ ] ...
```

**Labels:**

- `HU` (o `tipo:setup` para las tareas técnicas)
- `rol:admin` | `rol:tecnico` | `rol:autorizado` | `rol:usuario` | `rol:desarrollador`
- `tipo:ABM` | `tipo:flujo` | `tipo:inventario` | `tipo:auth` | `tipo:KPI` | `tipo:setup`

**Milestone:** el sprint que corresponde.

Los story points usan Fibonacci (1, 2, 3, 5, 8, 13) y son borrador.

---

## Tablero

Tablero: **SIGMA — Roadmap G6** (proyecto nº 4).
Columnas: Pendiente — En progreso — Terminado.

⚠️ **Ojo con esto:** el tablero **no agrupa por milestone**. Agrupa por un **campo propio
del proyecto llamado `Sprint`**. Son dos cosas distintas que se mantienen a mano y ya se
desincronizaron una vez.

Cuando agregás un issue al tablero:

1. Asignale el **milestone** del sprint.
2. Cargale **también** el campo `Sprint` del tablero.

**Si el tablero y el milestone se contradicen, manda el tablero** y se corrige el milestone.

---

## Cómo escribir la documentación

Estos documentos los leen docentes y compañeros. Reglas:

1. **Vocabulario simple y directo.** Frase corta. Sin palabras rebuscadas.
2. **Sin relleno.** Si una oración no aporta un dato, va afuera.
3. **Todo en español**, incluido nombres de tablas y campos.
4. **Un tema por archivo.** Si un archivo mezcla cosas, se parte.
5. **Fecha en las decisiones.** "Decisión del 14/07/2026: el cierre es automático."
6. **Marcar el estado** con ⬜ pendiente, 🟡 a medias, ✅ terminado. Así se ve de un vistazo.
7. **No inventar datos.** Si algo no se relevó, se escribe "pendiente de confirmar".

---

## Documentos del proyecto

| Archivo | Qué es |
|---|---|
| `CLAUDE.md` | Puerta de entrada al contexto. |
| `.claude/contexto/*.md` | Contexto general por tema. |
| `contexto.md` | Documento histórico largo, con el detalle de las discusiones y decisiones. |
| `README.md` | Presentación del repositorio, para quien lo ve de afuera. |
