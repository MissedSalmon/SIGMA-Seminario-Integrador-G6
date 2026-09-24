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

- **El resto de las pantallas y de los módulos de la API.** Hechos: **HU-1 edificios,
  HU-2 espacios y HU-3 áreas** (ABM completo, 28/08/2026), con la interfaz armada sobre
  la plantilla de administración de CoreUI. Los tres andan contra **datos de prueba en
  memoria** (`backend/src/datos-mock/`), no contra la base aún.
- **HU-14 (crear la OT) está hecha (21/09/2026):** la OT se genera sola al validar el
  ticket y se planifica en `/ordenes-trabajo`, cargándole las tareas con su prioridad y su
  responsable. Los **prestadores de servicio** son sólo lectura hasta que se haga la HU-33.
- **El proyecto en Supabase** y la conexión con **Vercel** en producción.

*(Nota: La base de datos ya fue refactorizada e integrada con Supabase CLI en la carpeta `supabase/migrations/`)*

---

## Restricciones de UI y Diseño

Al trabajar en la interfaz gráfica, se deben seguir estrictamente estas reglas:
1. **Botones de Alta:** Los botones con la funcionalidad de dar de alta un registro tienen que llamarse estrictamente "Agregar".
2. **Filtros (Barra de Filtros Horizontales):**
   - **Estructura:** Campo de búsqueda global (input con ícono de lupa) a la izquierda, seguido de la etiqueta "Filtrar por:" y selectores desplegables (dropdowns) para las facetas (AND lógico).
   - **Nombres de etiquetas:** NINGÚN filtro en su nombre (etiqueta) debe contener el prefijo "Tipo de ". Debe usarse directamente el sustantivo descriptivo (ej. "Activo", "Espacio", "Material", etc.).
   - **Comportamiento:** Filtrado reactivo combinado en la misma línea superior, maximizando el espacio vertical, tal como el diseño utilizado en la pantalla "Listado de activos".
3. **Formularios y Casillas de Texto:** Las casillas de texto deben tener el tamaño acorde a la información que va dentro (ej. fechas, textos cortos, descripciones largas). Se debe evitar el `width: 100%` innecesario o anchos excesivos en campos de longitud fija o conocida (como DNI, CUIL, o Fecha). Usar `maxWidth` o el componente `<Campo>` con `anchoMinimo` / `anchoMaximo` para que se adecuen al tamaño esperado de su contenido. Se debe respetar el diseño convencional de cada formulario.
4. **Menús Laterales:** El tamaño del texto de los menúes no debe ser cortado por la barra lateral.
5. **Responsividad:** Todas las pantallas (nuevas y existentes) deben ser responsivas y multiplataforma (adaptables a todos los tipos de pantallas y resoluciones).
6. **Uso de Colores:** Los textos no deben tener un formato de colores si no tienen una explicación de qué significa cada color. Si se solicita que el texto de la UI tenga colores, siempre se debe preguntar/solicitar el significado de cada uno para tener las referencias necesarias. (¡Restricción más importante!)
7. **Fechas:** Todo campo de fecha se carga con `<Campo tipoHtml="date">`, que dibuja el `DatePicker` de HeroUI (ver `frontend/src/componentes/formulario/CampoFecha.js`). **No usar `<input type="date">`.** El valor sigue siendo texto `"2026-09-14"`. Cada fecha tiene que llevar sus límites en `min` / `max` según lo que se esté cargando (una fecha de alta no puede ser futura, un vencimiento no puede ser pasado, un rango no se puede dar vuelta), y esos límites van **siempre acompañados** de la validación en el formulario: el almanaque es una ayuda, no el control. Una **duración** (cuánto lleva algo, no cuándo pasa) va con `<Campo tipo="duracion">`, que dibuja el `TimeField` de HeroUI en hh:mm (ver `frontend/src/componentes/formulario/CampoDuracion.js`); el valor es texto `"01:30"` y el tope es 23:59. El detalle está en [arquitectura.md](.claude/contexto/arquitectura.md).
8. **Sin descripciones en los campos:** debajo de la caja de un campo va **sólo el error**, nunca una línea explicando para qué sirve. La etiqueta ya lo dice. Los componentes de formulario no tienen prop para eso.
9. **Elegir una opción:** todo selector se hace con `<Campo tipo="lista">` (o `tipo="buscador"`), que dibuja el `ComboBox` de HeroUI (ver `frontend/src/componentes/formulario/CampoLista.js`). **No usar `<select>`, `CFormSelect` ni `react-select`.** La lista se filtra escribiendo. El valor sigue siendo texto (`"5"` o `""`). Para que el campo se pueda vaciar hay que pasarle `textoVacio` con el texto de esa opción.
10. **Ruta de migas:** el "Inicio › ..." de arriba lo dibuja el `Breadcrumbs` de HeroUI desde `frontend/src/componentes/layout/Encabezado.js`, una sola vez para todas las pantallas. **Cada pantalla nueva se agrega al mapa `NOMBRES` de ese archivo**, con el mismo texto que su título; si no, la miga muestra el tramo de la dirección en crudo.
