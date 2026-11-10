# AGENT.md — SIGMA: ajustes del Panel de Control

Proyecto: SIGMA (Sistema Integral de Gestión de Mantenimiento de Activos, UTN-FRRe, Seminario Integrador G6).
Alcance: únicamente la página **Panel de Control** (`/`) y lo que dependa de ella (endpoints, servicios, utilidades de exportación).

---

## 0. Reglas de Git (OBLIGATORIAS)

El agente trabaja **solo sobre el árbol de trabajo actual**. El versionado lo hace el usuario.

**Permitido (solo lectura):**
- `git status`
- `git diff` / `git diff --stat`
- `git log` (con `--oneline`, `-n`, etc.)
- `git show`
- `git branch` (únicamente para listar) / `git branch --show-current`
- `git ls-files`, `git blame`

**Prohibido:**
- Crear o cambiar de rama: `git branch <nombre>`, `git checkout -b`, `git switch -c`, `git checkout <rama>`, `git switch`
- `git add` en cualquiera de sus formas (incluido `git add .` y `git add -A`)
- `git commit` en cualquiera de sus formas (incluido `git commit -m "..."` y `--amend`)
- `git push`, `git pull`, `git fetch`, `git merge`, `git rebase`, `git reset`, `git restore`, `git stash`, `git clean`, `git cherry-pick`, `git tag`

Al terminar, el agente informa qué archivos modificó (apoyándose en `git status`) y deja que el usuario revise y haga el commit.

---

## 1. Método de trabajo

1. Leer el código antes de tocarlo: ubicar el componente del Panel, los endpoints que lo alimentan y las consultas a la base de datos.
2. Diagnosticar primero, corregir después. En el punto 2 hay que explicar la causa raíz antes de cambiar nada.
3. Cambios mínimos y localizados. No refactorizar lo que no se pidió.
4. No inventar datos para "hacer que se vea". Si un gráfico está vacío, encontrar por qué.
5. Al final: ejecutar el build/lint/tests del proyecto y reportar el resultado.
6. Todo el texto de interfaz va en español (Argentina), coherente con el resto del sistema.

---

## 2. Bug: el gráfico "Áreas con más incidencias" no muestra nada

La funcionalidad está implementada, pero el cuadro aparece vacío (el `<canvas>` se renderiza sin barras). En la tabla de resolución por área sí aparecen datos (incluso una fila "Sin área"), así que **hay datos en la base**.

Investigar, en este orden:

1. **Respuesta del endpoint**: ¿devuelve datos para el período por defecto (últimos 30 días)? Probar también con "Histórico".
2. **Consulta SQL**: el conteo de fallas por área depende de la cadena ticket → activo → espacio → área. Verificar los JOIN: un `INNER JOIN` contra activos sin espacio/área descarta filas. Revisar si se está filtrando por un estado o tipo de ticket que no existe.
3. **Contrato de datos**: nombres de campos entre backend y frontend (por ejemplo `area`/`nombreArea` vs `label`, `total`/`cantidad` vs `value`). Un desajuste de claves produce un gráfico vacío sin error.
4. **Tipos numéricos**: PostgreSQL devuelve `COUNT(*)` como `bigint`/string; si el frontend espera número y filtra `> 0`, descarta todo.
5. **Datos sin área**: decidir y documentar qué pasa con los tickets cuyo activo no tiene área ("Sin área"). Deben contarse y mostrarse con esa etiqueta, no perderse.
6. **Render**: que el gráfico no se inicialice con altura 0 ni con un array vacío por una carga asíncrona (condición de carrera entre fetch y montaje).
7. **Estado vacío**: si de verdad no hay datos, mostrar un mensaje claro ("Sin incidencias en el período seleccionado") en lugar de un canvas en blanco.

Entregable: causa raíz explicada en 2-3 líneas + corrección.

---

## 3. Selector de período no responsive

El grupo de botones (Últimos 30 días / Trimestre / Semestre / Año / Histórico / Personalizado) está en un `btn-group` de una sola línea que se desborda en pantallas chicas.

- Permitir que los botones pasen a otra línea (`flex-wrap` + `gap`) o, en móvil, reemplazarlos por un `<select>`/dropdown.
- El selector "Personalizado" (fechas desde/hasta) también debe apilarse en vertical en móvil.
- Sin scroll horizontal de página en 360 px de ancho.
- Revisar que el contenedor `d-flex flex-column flex-lg-row` mantenga el espaciado correcto.
- Probar en 360, 768 y 1280 px.

---

## 4. Botón "Exportar" y reemplazo de Excel por informe PDF

### 4.1 Botón
- El texto pasa de "Exportar a Excel" a **"Exportar"**.
- Mantener el ícono y el estilo, pero cambiar el ícono si hace referencia a Excel/planilla.
- Actualizar `aria-label`, `title` y cualquier texto de prueba que mencione Excel.

### 4.2 Eliminar todo lo relacionado con Excel
- Quitar la generación de `.xlsx`: funciones, endpoints, utilidades, tipos y estilos asociados.
- Quitar dependencias que solo se usaban para eso (por ejemplo `xlsx`, `exceljs`, `file-saver`, etc.). Verificar con búsqueda en todo el repo (`grep`) antes de desinstalar cada una; si otra parte del sistema las usa, **no** se quitan y se avisa.
- Limpiar `package.json` y el lockfile de forma coherente (el proyecto es monorepo `backend/` + `frontend/`; revisar ambos y el `package.json` raíz, incluyendo los `overrides` de vulnerabilidades).
- Buscar referencias residuales: "excel", "xlsx", "Exportar a Excel" en código, textos, documentación y README.

### 4.3 Nuevo informe PDF
El PDF debe contener **las mismas tablas que exportaba el Excel**, y por cada una:

1. **Título** de la tabla (sin descripción ni subtítulo).
2. **La tabla** propiamente dicha, con sus datos.
3. **Su gráfico correspondiente**.

Requisitos:
- Respetar el período seleccionado en el Panel (el informe refleja lo que el usuario está viendo).
- Encabezado del informe: nombre SIGMA, título "Informe del Panel de Control", período y fecha/hora de generación (zona horaria UTC-3).
- Saltos de página limpios: un título nunca queda separado de su tabla; tablas largas continúan en la página siguiente repitiendo el encabezado.
- Gráficos legibles en papel (colores con buen contraste, etiquetas, leyendas). Orientación A4.
- Nombre de archivo: `informe-panel-AAAA-MM-DD.pdf`.
- Estado vacío: si una tabla no tiene datos, mostrar el título y "Sin datos en el período".
- Los gráficos del PDF deben usar los mismos datos que el Panel (una sola fuente de verdad, sin recalcular distinto).

Elección de librería: evaluar entre generar en el cliente (por ejemplo `pdfmake` o `jsPDF` + `jspdf-autotable`, aprovechando las imágenes de los `<canvas>` de Chart.js con `toBase64Image()`) o en el backend (por ejemplo `pdfkit` / `pdfmake` + `chartjs-node-canvas`). Preferir lo más simple que funcione en Vercel (sin binarios pesados como Chromium si se puede evitar). Justificar la elección en una línea y agregar solo las dependencias estrictamente necesarias.

---

## 5. Tarjeta "Cobertura Preventiva" — definición y comportamiento

**Qué mide:** qué proporción de los tipos de activo tiene al menos un plan de mantenimiento preventivo vigente (hoy: 3 de 8 = 37,5 %; y 14 activos amparados, 60,9 %). Es un indicador de **brechas**: sirve para saber qué tipos de activo están sin plan.

**Decisión de diseño:**
- La tarjeta **no debe desaparecer** cuando se cubren los 8 tipos. Un 100 % es información valiosa (confirma que no hay brechas) y el Panel no debe cambiar de forma según los datos.
- Lo que sí debe aparecer **solo cuando hay brechas** es el detalle accionable: la lista de tipos de activo **sin plan vigente**.
- Hoy la tarjeta dice cuántos faltan pero no cuáles. Agregar un acceso al detalle (tooltip, popover o enlace a Planes de mantenimiento filtrado) con los tipos descubiertos.
- Cuando la cobertura es 100 %, mostrar un estado positivo (por ejemplo "Todos los tipos cubiertos") y el color de acento acorde.
- Aclarar el significado en el tooltip de la tarjeta: "Tipos de activo con al menos un plan preventivo vigente".
- Definir y documentar qué cuenta como "plan vigente" (activo, no vencido, no cancelado) tal como lo hace hoy el código; no cambiar esa regla sin avisar.

---

## 6. Tickets "finalizado" vs "cerrado"

La interfaz usa "tickets cerrados" (gráfico mensual y tiempo promedio de resolución). El agente debe:

1. Revisar el enum/estados de ticket en el código y la base de datos y **documentar la diferencia real** entre *finalizado* y *cerrado* (quién dispara cada transición y cuándo).
2. Reportar al usuario esa diferencia en 3-4 líneas.
3. Verificar que "Tiempo promedio de resolución" y "Tickets creados y cerrados por mes" usen el estado correcto y de forma consistente. Definir explícitamente qué fecha se usa para el cierre (fecha de finalización de la OT, de cierre del ticket, etc.).
4. Si ambos estados significan lo mismo en la práctica, proponer unificarlos, **sin** hacer la migración: solo proponerla.
5. Mostrar en el texto de la tarjeta/gráfico el término exacto que corresponda al estado usado.

---

## 7. Cambio de texto en tarjeta

- "Materiales Bajo Mínimo" → **"Materiales por debajo del stock mínimo"**.
- Verificar que el título no se rompa feo en la tarjeta (`text-uppercase` + 0,78 rem): si es muy largo, permitir salto de línea sin desalinear las 5 tarjetas.
- Buscar el mismo texto en otros lugares (tests, exportación/PDF, tooltips) y mantener coherencia.
- El badge de la tabla ya dice "materiales por debajo del stock mínimo"; la tarjeta debe quedar alineada con ese lenguaje.

---

## 8. Criterios de aceptación

- [ ] El gráfico "Áreas con más incidencias" muestra datos reales (o un estado vacío explícito) y se explicó la causa raíz.
- [ ] El selector de período se ve y funciona bien en 360 / 768 / 1280 px, sin scroll horizontal.
- [ ] El botón dice "Exportar" y genera un PDF; no queda código ni dependencias de Excel sin uso.
- [ ] El PDF incluye todas las tablas anteriores, cada una con título, tabla y gráfico.
- [ ] La tarjeta de cobertura preventiva siempre se muestra y detalla los tipos sin plan cuando existen.
- [ ] Se documentó la diferencia entre ticket finalizado y cerrado.
- [ ] La tarjeta dice "Materiales por debajo del stock mínimo".
- [ ] Build, lint y tests pasan.
- [ ] No se ejecutó ningún comando Git prohibido; el reporte final lista los archivos cambiados.
