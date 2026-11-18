---
name: SIGMA
description: Sistema Integral de Gestión de Mantenimiento de Activos — UTN-FRRe
colors:
  petroleo: "#0b6b8c"
  petroleo-hover: "#0a5e7c"
  petroleo-activo: "#09536d"
  petroleo-enfasis: "#074257"
  petroleo-suave: "#e6f0f4"
  petroleo-borde-suave: "#a3c7d4"
  tinta: "#0c2733"
  senal: "#f08a24"
  fondo: "#f4f6f8"
  superficie: "#ffffff"
  borde: "#e2e6eb"
  texto-secundario: "#64748b"
  texto-terciario: "#94a3b8"
  exito: "#1b9e5a"
  exito-suave: "#d8f3e3"
  peligro: "#e55353"
  peligro-suave: "#fbdcdc"
  peligro-enfasis: "#b02a37"
  aviso-suave: "#fff3cd"
  aviso-enfasis: "#997404"
typography:
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
  title-section:
    fontFamily: "Inter, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    letterSpacing: "-0.006em"
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.95rem"
    fontWeight: 600
  label-caps:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.8rem"
    fontWeight: 700
    letterSpacing: "0.05em"
  kpi-value:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(1.6rem, 1.1vw + 0.9rem, 2.35rem)"
    fontWeight: 700
    lineHeight: 1.15
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  pill: "999px"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.petroleo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 1rem"
  button-primary-hover:
    backgroundColor: "{colors.petroleo-hover}"
  button-primary-active:
    backgroundColor: "{colors.petroleo-activo}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.petroleo}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 1rem"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.texto-secundario}"
    rounded: "{rounded.pill}"
    size: "2.25rem"
  input:
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
  card:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.md}"
  tag-estado:
    rounded: "{rounded.pill}"
    padding: "0.3rem 0.7rem"
    typography: "{typography.label}"
  sidebar:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.superficie}"
  sidebar-link-active:
    backgroundColor: "{colors.petroleo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.sm}"
---

# Design System: SIGMA

## Overview

**Creative North Star: "La planilla del pañol"**

SIGMA se siente como el registro de un depósito bien llevado: cada cosa en su lugar, todo
se encuentra a la primera y nada está de adorno. Es una herramienta de trabajo para la
Secretaría de Infraestructura. El orden y la claridad valen más que la sorpresa.

La base es la plantilla de administración **CoreUI** (Bootstrap), vestida con los colores
de SIGMA en `src/app/globals.css`. Los campos de formulario usan **HeroUI** (fecha, duración,
cantidad y lista), retocados para que se vean como el resto. Hay un menú lateral oscuro en
Tinta, una barra superior blanca con la ruta de migas, y el contenido en tarjetas blancas
sobre un fondo gris muy claro. La densidad es media: los listados entran en una pantalla
de PC sin apretarse, y en el celular todo se apila.

El tono es **claro y sobrio**: bordes suaves, sombras mínimas, y color sólo donde hay una
acción o un estado que tiene una referencia escrita.

**Key Characteristics:**
- Menú lateral oscuro (Tinta) y contenido claro sobre fondo gris.
- Un solo color de acción (Petróleo). El naranja Señal marca la opción activa del menú y
  nada más.
- Tarjetas blancas con borde fino y sombra casi invisible.
- Letra Inter a 17px de base (16px en el celular).
- Los estados se muestran con una etiqueta en forma de píldora: punto de color y el texto
  del estado.

## Colors

La paleta es fría y contenida: azules petróleo y tinta sobre grises claros. Los colores
de estado vienen de CoreUI.

### Primary
- **Azul Petróleo** (`petroleo`): el color de la acción. Botón principal, enlaces, anillo de
  foco de los campos, opción activa del menú (al 55 %) y las migas que llevan a otra pantalla.
  Tiene tres tonos para la interacción: `petroleo-hover`, `petroleo-activo` y
  `petroleo-enfasis` (texto sobre fondo suave). `petroleo-suave` es el fondo de la fila
  al pasar el mouse y del ícono de estado vacío.

### Secondary
- **Naranja Señal** (`senal`): la rayita a la izquierda de la opción activa del menú.
  También es la barra «En ejecución» del gráfico de carga de técnicos, que tiene su
  referencia al lado.

### Neutral
- **Tinta Profunda** (`tinta`): el texto principal, los títulos y el fondo del menú lateral.
- **Fondo** (`fondo`): el gris muy claro de la página y de los campos deshabilitados.
- **Superficie** (`superficie`): tarjetas, barra superior, ventanas y avisos.
- **Borde** (`borde`): bordes de tarjetas y campos, divisores y la línea de la paginación.
- **Texto secundario** (`texto-secundario`): encabezados de tabla, contadores, «Filtrar
  por:», pie de página y textos de apoyo. `texto-terciario` para lo menos importante de
  las tarjetas del panel.

### Estados
Vienen de CoreUI y se usan sólo con texto al lado:
- **Éxito** (`exito`, `exito-suave`): estado «Finalizada», aviso de que algo se guardó y
  campo bien cargado.
- **Peligro** (`peligro`, `peligro-suave`, `peligro-enfasis`): errores, «Cancelada», el
  asterisco de campo obligatorio y el stock bajo el mínimo.
- **Aviso** (`aviso-suave`, `aviso-enfasis`): estado «Creada».

### Named Rules
**La regla del color con referencia.** Ningún texto ni fila lleva color si en la misma
pantalla no hay escrito qué significa ese color. Una etiqueta de estado ya lo dice con
su texto. Una fila teñida lleva su referencia debajo de la tabla (ver «stock bajo el
mínimo» en Materiales). Si alguien pide un color nuevo, primero se pregunta qué significa.

**La regla de la única voz.** Petróleo es el único color de acción. No se agrega otro
color de botón para destacar algo: lo importante se ordena primero, no se pinta distinto.

## Typography

**Body Font:** Inter (cargada con `next/font`, variable `--sigma-fuente`), con la pila del
sistema como respaldo.

**Character:** una sola familia en todo el sistema. La jerarquía sale del peso y del
tamaño, no de mezclar fuentes.

### Hierarchy
- **Headline** (700, 1.65rem): el título de cada pantalla (`.sigma-titulo`).
- **Title** (600, 1.25rem): la ruta de migas de la barra superior.
- **Title de sección** (700, 1.05rem, con línea fina abajo): separa los bloques de un
  formulario largo (`.sigma-seccion-titulo`).
- **Body** (400, 1rem): texto de tablas, formularios y avisos. La base es 17px en PC y
  16px en celulares (menos de 576px).
- **Label** (600, 0.95rem): la etiqueta arriba de cada campo.
- **Label en mayúsculas** (700, 0.8rem, espaciado 0.05em): encabezados de tabla y títulos
  de las tarjetas del panel.
- **Valor de KPI** (700, entre 1.6rem y 2.35rem según el ancho): la cifra grande de las
  tarjetas del panel.

### Named Rules
**La regla de la base 17.** Todo se mide en `rem` sobre la base de 17px. Para agrandar o
achicar, se cambia la base, no cada pantalla por separado.

## Layout

- **Estructura:** menú lateral fijo a la izquierda en pantallas de 992px o más. En pantallas
  más chicas el menú se esconde y se abre con el botón de la barra superior. A la derecha
  van la barra superior blanca (con las migas y la campana), el contenido y el pie.
- **Contenido:** cada pantalla empieza con su título y, si corresponde, el botón
  «Agregar» a la derecha. Abajo va una tarjeta con la barra de filtros, la tabla y la
  paginación.
- **Barra de filtros:** en una sola línea. A la izquierda el buscador con lupa (entre 18 y
  22rem), después «Filtrar por:» y los desplegables. Si no entran, bajan al renglón de
  abajo; nunca se apilan antes de tiempo.
- **Formularios:** los campos no van en una grilla de columnas iguales. Van uno al lado del
  otro con el ancho de su contenido (en `ch`) y saltan de renglón solos
  (separación 1rem vertical, 1.25rem horizontal). Sólo las descripciones largas ocupan el
  renglón entero.
- **Panel:** las tarjetas de KPI son 1 columna en el celular, 2 desde 576px, 3 entre 768 y
  1023px y 5 desde 1024px.
- **Ritmo:** los espacios salen de una escala corta (0.5, 0.75, 1, 1.25 y 1.5rem).
- **Celular:** en menos de 576px los botones de acción del panel se reparten el ancho y las
  tablas se desplazan de costado dentro de su tarjeta, no la página entera.

## Elevation & Depth

El sistema es casi plano. La profundidad la dan el contraste entre el fondo gris y las
tarjetas blancas, y los bordes finos. Las sombras son mínimas y aparecen sólo en lo que
flota.

### Shadow Vocabulary
- **Apoyo** (`0 1px 2px rgba(15, 23, 42, 0.06)`): tarjetas. Apenas separa la tarjeta del fondo.
- **Flotante** (`0 8px 24px rgba(15, 23, 42, 0.08)`): ventanas (modales) y avisos emergentes
  (toasts), lo único que queda por encima de la pantalla.
- **Línea de barra** (`0 1px 0` en color Borde): la barra superior, que se separa con una
  raya y no con sombra.

### Named Rules
**La regla de plano por defecto.** Lo que está apoyado en la página va plano o con la
sombra de Apoyo. La sombra Flotante es sólo para lo que tapa la pantalla. El botón
principal no lleva sombra.

## Shapes

Esquinas suavemente redondeadas en todo: 0.5rem en botones, campos, avisos y opciones del
menú; 0.75rem en tarjetas, ventanas y el menú de la campana; píldora completa (999px) en
etiquetas de estado, botones de ícono de las filas, el número de la campana y las líneas
del esqueleto de carga. No hay esquinas rectas ni formas recortadas.

## Components

### Buttons
Sobrios y legibles, siempre con el verbo escrito.
- **Shape:** esquinas suaves (0.5rem), letra en 600, 1rem de relleno a los costados.
- **Primary:** fondo Petróleo y texto blanco, sin sombra. Es «Agregar», «Guardar» y las
  acciones puntuales (Validar, Dar de baja…).
- **Hover / Active:** se oscurece a `petroleo-hover` y después a `petroleo-activo`. El foco
  usa el anillo de CoreUI en Petróleo.
- **Outline:** borde y texto Petróleo, se rellena al pasar el mouse. Es el «Cancelar» y las
  acciones secundarias.
- **Ghost / de fila:** botones redondos de 2.25rem con sólo el ícono, en gris. Al pasar el
  mouse, editar se pinta Petróleo y eliminar en rojo.
- **Orden:** la acción principal primero y «Cancelar» a la derecha, siempre con
  `<BotonesAccion>`.

### Status tags
- **Style:** píldora (0.3rem × 0.7rem, 0.825rem en 700) con fondo suave y texto en el tono
  fuerte del mismo estado, un punto `●` y el nombre del estado.
- **Estados de la OT:** Creada (aviso), Asignada (primario), En ejecución (info), Finalizada
  (éxito), Cancelada (peligro). El color acompaña; lo que se lee es el texto.

### Cards / Containers
- **Corner Style:** 0.75rem.
- **Background:** Superficie sobre Fondo.
- **Shadow Strategy:** sombra de Apoyo.
- **Border:** 1px en Borde, igual en todas. Las tarjetas de KPI del panel no llevan borde
  de color: un color ahí no tenía referencia (decisión del 18/11/2026).
- **Internal Padding:** el de CoreUI; las tarjetas de KPI usan entre 0.75 y 1.15rem según
  el ancho.

### Inputs / Fields
- **Style:** fondo blanco, borde de 1px en Borde, esquinas de 0.5rem. El ancho sale del
  contenido esperado (DNI, fecha o descripción), nunca 100 % porque sí.
- **Focus:** borde Petróleo y anillo de 0.25rem en Petróleo al 18 %.
- **Validación:** un tilde verde o una cruz roja de 16px adentro de la caja, a la derecha,
  y la raya de color a la izquierda. Debajo de la caja va sólo el error, nunca una ayuda.
- **Disabled:** fondo gris de página y opacidad de 0.75.
- **Componentes:** `<Campo>` con `tipoHtml="date"` (DatePicker), `tipo="duracion"`
  (TimeField), `tipo="numero"` (NumberField con − y +) y `tipo="lista"` (ComboBox). Para
  varias opciones se usa `<SeleccionMultiple>`.

### Navigation
- **Menú lateral:** fondo Tinta. Opciones en 0.92rem y 500, blancas al 72 %, con esquinas de
  0.5rem y compactas para que entren todas. Los grupos llevan títulos en mayúsculas chicas.
  Al pasar el mouse se aclara el fondo; la opción activa va en Petróleo al 55 %, en 600 y
  con la rayita Naranja Señal a la izquierda. El texto nunca se corta: baja de renglón.
- **Ruta de migas:** en la barra superior (Breadcrumbs de HeroUI), 1.25rem en 600. Los tramos
  anteriores en Petróleo y la pantalla actual en gris, sin enlace.
- **Celular:** el menú se oculta y se abre desde la barra superior.

### Tablas
- Encabezados en mayúsculas chicas y gris secundario. Celdas con 0.75rem arriba y abajo,
  centradas en vertical. La fila se pinta de Petróleo suave al pasar el mouse.
- Arriba va la barra de filtros. Abajo, el contador y la paginación, separados por una
  línea en Borde.
- Mientras carga se ve un esqueleto de líneas grises que brillan. Sin datos, un ícono
  redondo en Petróleo suave y un mensaje.

### Gráficos del panel
Los dibuja `GraficoChart` (Chart.js) con la letra Inter y los ejes en gris secundario.
- **Una sola serie** (activos por edificio, tareas por técnico, fallas por área): barras en
  Petróleo con las puntas redondeadas. El color no significa nada; lo que se lee es el largo.
- **Porciones que son un estado o una prioridad:** el mismo color que la etiqueta de ese
  estado en las tablas (Operativo verde, Fuera de servicio rojo, prioridad Alta roja, etc.),
  siempre con la referencia abajo.
- **Porciones sin significado propio** (correctivas y preventivas): Petróleo y Petróleo claro.
- Cada gráfico tiene un botón con ícono para verlo como tabla.

### Toasts
Arriba a la derecha, de hasta 22rem. Tarjeta blanca con la sombra Flotante y un ícono
redondo: verde para éxito, rojo para error y Petróleo para un aviso (campana). Entran
bajando 6px en 0.18s.

## Do's and Don'ts

### Do:
- **Do** usar Petróleo para toda acción y enlace, con sus tonos de hover y activo.
- **Do** acompañar todo color con su texto o con una referencia escrita en la misma pantalla.
- **Do** usar los componentes de formulario de SIGMA (`<Campo>`, `<SeleccionMultiple>`,
  `<BotonesAccion>`) en vez de armar campos o botones a mano.
- **Do** darle a cada campo el ancho de lo que va adentro.
- **Do** redefinir variables `--cui-*` en `globals.css` antes de escribir CSS nuevo.
- **Do** probar cada pantalla en celular: el técnico la usa ahí.

### Don't:
- **Don't** pintar texto, filas o números de color sin una referencia de qué significa.
- **Don't** usar el Naranja Señal para botones, avisos ni para destacar texto.
- **Don't** usar `<select>`, `CFormSelect`, `react-select` ni `<input type="date">`.
- **Don't** poner texto de ayuda debajo de un campo: ahí va sólo el error.
- **Don't** agregar sombras grandes a tarjetas apoyadas en la página.
- **Don't** importar el preflight de Tailwind: desarma la base de CoreUI.
