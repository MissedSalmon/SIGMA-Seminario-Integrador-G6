# Carpeta `.claude`

Acá vive el **contexto general del proyecto SIGMA**.

Sirve para dos cosas:

1. Que cualquier integrante del grupo entienda rápido de qué se trata el proyecto, sin
   leer los 65 KB de `contexto.md`.
2. Que Claude Code tenga el contexto cargado al trabajar en este repositorio.

## Qué hay adentro

```
.claude/
├── README.md            # este archivo
└── contexto/
    ├── proyecto.md          # qué es SIGMA, equipo, problema, alcance, roadmap
    ├── dominio.md           # roles, flujo, estados, entidades, glosario
    ├── arquitectura.md      # stack, estructura, conexiones, cómo se corre
    └── trabajo-en-equipo.md # git, issues, tablero, cómo escribir
```

El archivo raíz [`CLAUDE.md`](../CLAUDE.md) es el índice general y lo primero que se lee.

## Qué NO va acá

Esto es la mirada general del sistema. El detalle vive en otro lado:

| Detalle | Dónde está |
|---|---|
| Historias de usuario y criterios de aceptación | Issues de GitHub |
| Modelo de tablas y diccionario de datos | `supabase/migrations/` |
| Cómo se llegó a cada decisión | `contexto.md` (documento histórico) |

## Cómo mantenerlo

- Cuando el equipo **toma una decisión que cambia el sistema**, se anota acá con la fecha.
- Si algo es detalle de una historia puntual, va al issue, no acá.
