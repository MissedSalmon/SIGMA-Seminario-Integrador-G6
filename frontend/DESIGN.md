---
name: SIGMA
description: Sistema Integral de Gestión de Mantenimiento de Activos de la UTN-FRRe, dibujado como un talonario de órdenes de trabajo.
colors:
  petroleo: "#0b6b8c"
  petroleo-hover: "#0a5e7c"
  petroleo-activo: "#09536d"
  petroleo-suave: "#e6f0f4"
  petroleo-borde-suave: "#a3c7d4"
  petroleo-enfasis: "#074257"
  tinta: "#0c2733"
  fondo: "#f5f7f8"
  superficie: "#ffffff"
  borde: "#e2e6eb"
  linea: "#c3d4da"
  linea-casillero: "#dfe8eb"
  texto-secundario: "#5b6f78"
  etiqueta-neutra: "#eef3f5"
  etapa-pendiente: "#8a6100"
  etapa-en-curso: "#2b55b0"
  etapa-terminado: "#1a7a47"
  etapa-cerrado: "#5c636a"
  etapa-cancelado: "#b02a37"
typography:
  headline:
    fontFamily: "Public Sans, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1.65rem"
    fontWeight: 700
    letterSpacing: "-0.01em"
  numero-talon:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1.85rem"
    fontWeight: 800
    lineHeight: 1.05
    fontFeature: "tnum"
  title:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "1.05rem"
    fontWeight: 700
  body:
    fontFamily: "Public Sans, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    fontFeature: "tnum"
  rotulo:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "0.7rem"
    fontWeight: 700
    letterSpacing: "0.08em"
  sello:
    fontFamily: "Public Sans, sans-serif"
    fontSize: "0.72rem"
    fontWeight: 700
    lineHeight: 1.35
    letterSpacing: "0.07em"
rounded:
  sello: "4px"
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
spacing:
  casillero: "0.3rem 0.55rem"
  talones-gap: "0.875rem"
  comprobante-cuerpo: "0.7rem 0.85rem 0.8rem"
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
    backgroundColor: "{colors.superficie}"
    textColor: "{colors.petroleo}"
    rounded: "{rounded.sm}"
    padding: "0.375rem 1rem"
  comprobante:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.md}"
  talon-numero:
    textColor: "{colors.petroleo}"
    typography: "{typography.numero-talon}"
  sello:
    typography: "{typography.sello}"
    rounded: "{rounded.sello}"
    padding: "0.12rem 0.45rem"
  casillero:
    textColor: "{colors.tinta}"
    padding: "{spacing.casillero}"
  etiqueta-categoria:
    backgroundColor: "{colors.etiqueta-neutra}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sello}"
    padding: "0.2rem 0.55rem"
  menu:
    backgroundColor: "{colors.tinta}"
  menu-opcion-activa:
    backgroundColor: "{colors.petroleo}"
    textColor: "{colors.superficie}"
    rounded: "{rounded.sm}"
  tarjeta:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.md}"
  campo:
    backgroundColor: "{colors.superficie}"
    rounded: "{rounded.sm}"
---

# Design System: SIGMA

## Overview

**Creative North Star: "El Talonario de órdenes de trabajo"**

SIGMA se dibuja como un talonario de órdenes de trabajo. Cada OT y cada ticket es un comprobante numerado. El número manda: va grande, en Petróleo, con un rótulo chico arriba («OT N°»). Los datos van en casilleros, como en un formulario preimpreso: un rótulo chico en mayúsculas y el valor abajo. El estado es un sello: una palabra en mayúsculas dentro de un recuadro de línea.

Es una herramienta de trabajo para la Secretaría de Infraestructura. La pantalla es densa y ordenada. Fondo gris azulado frío, superficies blancas con línea de formulario, menú en Tinta. El color se usa poco y siempre con un significado escrito en la misma pantalla.

El mundo se apoya en la plantilla de CoreUI. Los colores de CoreUI se pisan desde `globals.css` con las variables `--sigma-*`; no se escriben colores sueltos en los componentes.

**Key Characteristics:**
- El número de cada registro es su identidad: talón en Petróleo.
- Datos en casilleros con rótulo chico arriba.
- Estado como sello de línea, en el color de su etapa, con la referencia escrita al lado.
- Categorías en gris neutro, sin color.
- Public Sans con cifras tabulares en todo el sistema.
- Esquinas chicas, de formulario impreso.

## Colors

Una paleta fría y sobria: un solo color de acción (Petróleo), neutros azulados y cinco colores de etapa reservados para los sellos.

### Primary
- **Petróleo** (`petroleo`): el color de las acciones (botón principal, enlaces), del foco, del número de cada registro (talón y título de la ficha) y de la opción activa del menú. Nada más. Sus variantes `petroleo-hover` y `petroleo-activo` sólo aparecen en el hover y el clic de los botones; `petroleo-suave` es el fondo del hover de las filas de tabla.

### Neutral
- **Tinta** (`tinta`): el texto principal y el fondo del menú lateral y de la pantalla de ingreso.
- **Fondo de formulario** (`fondo`): el gris azulado frío de la página. Las superficies blancas se separan de él.
- **Superficie** (`superficie`): tarjetas, comprobantes, campos y ventanas.
- **Línea de formulario** (`linea`): el borde de comprobantes y tarjetas, y la línea de troquel punteada del talón.
- **Línea de casillero** (`linea-casillero`): la grilla fina entre casilleros.
- **Borde** (`borde`): divisores generales, bordes de campos y separadores de sección.
- **Texto secundario** (`texto-secundario`): rótulos de casilleros y talones, encabezados de tabla, la referencia de colores.
- **Etiqueta neutra** (`etiqueta-neutra`): el fondo de las etiquetas de categoría.

### Colores de etapa (sólo sellos)
Los eligió el usuario el 18/11/2026. Van por etapa, no por estado. Todos tienen contraste de al menos 4.5:1 sobre blanco. En el CSS son los cinco tonos `--sigma-tono-aviso`, `--sigma-tono-curso`, `--sigma-tono-bien`, `--sigma-tono-neutro` y `--sigma-tono-peligro` (globals.css); `etapas.js` sólo dice qué etapa usa cada tono.
- **Falta empezar** (`etapa-pendiente`): ticket Creado, OT Creada.
- **En curso** (`etapa-en-curso`): Validado, Asignado/Asignada, En ejecución.
- **Terminado** (`etapa-terminado`): Finalizado/Finalizada.
- **Cerrado** (`etapa-cerrado`): ticket Cerrado.
- **Cancelado o rechazado** (`etapa-cancelado`): ticket Rechazado, OT Cancelada.

Los demás sellos usan los mismos cinco tonos (18/11/2026): estado del activo (Operativo verde, En mantenimiento azul, Fuera de servicio rojo, Retirado gris), prioridad (Alta roja, Media ámbar, Baja gris), plan y usuario (Activo verde, de baja o inactivo gris), préstamo (En uso azul, Devuelta gris) y disponibilidad (Disponible verde, No disponible rojo). También las barras de carga de técnicos (pendientes ámbar, en ejecución azul, completadas verde) y los números en rojo de stock bajo el mínimo.

### Named Rules
**The Referencia Escrita Rule.** Un color en un texto o en un sello sólo se usa si la misma pantalla dice qué significa. Toda pantalla con sellos de tickets u OT muestra la «Referencia:» de etapas. Es la regla más importante del proyecto.

**The Petróleo Es Acción Rule.** Petróleo es para acciones, enlaces, foco, números de registro y la opción activa del menú. Ningún sello de estado va en Petróleo.

**The Categoría Neutra Rule.** Una categoría (tipo de espacio, tipo de activo) no es un estado: va en la etiqueta gris neutra, sin color.

## Typography

**Display Font:** Public Sans (con -apple-system, Segoe UI, Roboto, Helvetica, Arial)
**Body Font:** Public Sans
**Label/Mono Font:** Public Sans, mayúsculas espaciadas para rótulos y sellos

**Character:** una grotesca de trabajo, como la de los formularios preimpresos. Una sola familia; la jerarquía sale del peso, del tamaño y de las mayúsculas espaciadas. Todo el cuerpo usa cifras tabulares para que los números de las columnas queden alineados.

La letra base es de 17px en pantallas anchas y 16px en celulares (menos de 576px). Todo mide en rem, así que crece junto.

### Hierarchy
- **Headline** (700, 1.65rem): el título de cada pantalla («Panel de control», «Ticket #34»). En una ficha, el número del registro va dentro del título en Petróleo y peso 800.
- **Número de talón** (800, 1.85rem en el comprobante, 1.15rem en tablas, line-height 1.05): el número del registro.
- **Title** (700, 1.05rem): títulos de sección dentro de una tarjeta, con una línea de borde abajo.
- **Body** (400, 1rem): texto de tablas, valores de casilleros y formularios.
- **Rótulo** (700, 0.7rem, 0.08em a 0.1em, mayúsculas): el nombre de un casillero o de un talón, en texto secundario. También los encabezados de tabla (700, 0.8rem, 0.05em, mayúsculas).
- **Sello** (700, 0.72rem, 0.07em, mayúsculas): el estado.

### Named Rules
**The Cifra Tabular Rule.** Los números siempre van con cifras tabulares (`font-variant-numeric: tabular-nums`). No se desactiva en ningún componente.

## Layout

Menú lateral fijo en Tinta a la izquierda y contenido sobre el fondo gris. Cada pantalla abre con su título y, a la derecha, sus acciones. Las fichas usan dos columnas de tarjetas (datos a la izquierda, relacionados a la derecha) que se apilan en celular.

Los comprobantes del panel van en una grilla que se acomoda sola (columnas de 19rem como mínimo, 0.875rem entre ellos). Los casilleros dentro de un comprobante se reparten en celdas de 4.5rem como mínimo.

Cortes de pantalla de CoreUI: 576px (celular), 768px, 992px (el menú pasa a fijo) y 1024px. Todas las pantallas tienen que funcionar en celular.

## Elevation & Depth

El sistema es casi plano. La profundidad la dan las líneas de formulario, no las sombras. Hay dos sombras suaves y una para la tarjeta de ingreso.

### Shadow Vocabulary
- **Apoyo** (`box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06)`): tarjetas en reposo y comprobante con el mouse encima.
- **Flotante** (`box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08)`): ventanas, avisos (toast) y listas desplegables.
- **Ingreso** (`box-shadow: 0 24px 60px rgba(4, 18, 24, 0.45)`): sólo la tarjeta de ingreso sobre el fondo Tinta.

### Named Rules
**The Línea Antes Que Sombra Rule.** Un contenedor se marca con su línea de formulario. La sombra sólo apoya; nunca reemplaza al borde.

## Shapes

Esquinas chicas, de formulario impreso. Sellos, etiquetas y grilla de casilleros con 4px. Botones y campos con 0.375rem. Tarjetas, comprobantes y ventanas con 0.5rem. Sólo la tarjeta de ingreso usa 0.75rem.

La forma propia del mundo es la **línea de troquel**: un borde punteado de 2px en color línea, que separa el talón del cuerpo del comprobante. En la pantalla de ingreso aparece debajo de la marca.

Los botones de acción de fila de las tablas son círculos de 2.25rem.

## Components

### Buttons
Firmes y sobrios.
- **Shape:** esquinas chicas (0.375rem), peso 600, 1rem de relleno a los costados.
- **Primary:** fondo Petróleo, texto blanco, sin sombra.
- **Hover / Focus:** el fondo baja a `petroleo-hover`; al apretar, a `petroleo-activo`. El foco usa el anillo de CoreUI en Petróleo.
- **Outline:** borde y texto Petróleo sobre blanco; con el mouse encima se llena de Petróleo. Para acciones secundarias como «Actualizar».
- **Fantasma:** las acciones de fila (editar) van en texto secundario y se llenan de Petróleo con el mouse encima.
- **Textos:** el alta se llama «Agregar». Formularios y ventanas cierran con «Guardar» y después «Cancelar», armados con `<BotonesAccion>`.

### Sello (estado)
- **Style:** mayúsculas espaciadas dentro de un recuadro de línea de 1.5px, en el color de la etapa, sin fondo, esquinas de 4px.
- **Color:** una clase `sigma-sello--{tono}` (aviso, curso, bien, neutro, peligro) que lee el token `--sigma-tono-*`; el borde usa `currentColor`. Ningún componente escribe un color suelto.
- **Referencia:** al lado va `<ReferenciaEtapas>`, con una muestra que repite la forma del sello (recuadro de línea) y el texto de la etapa.

### Etiqueta de categoría
- **Style:** fondo gris neutro, texto Tinta, peso 600, 0.85rem, esquinas de 4px. Sin color por tipo.

### Talón y comprobante
- **Talón:** rótulo chico en texto secundario («OT N°») arriba del número en Petróleo, peso 800. En tablas va en tamaño chico y sin rótulo; con enlace lleva a la ficha.
- **Comprobante:** tarjeta blanca con línea de formulario y esquinas de 0.5rem. A la izquierda el talón (4.6rem de ancho), separado por la línea de troquel. A la derecha el cuerpo: descripción en una línea (peso 600, se corta con puntos suspensivos), los casilleros y el sello.
- **Hover / Focus:** el borde pasa a Petróleo con la sombra de apoyo (0.15s). El foco de teclado es un contorno de 2px en Petróleo, separado 2px.

### Casilleros y datos
- **Casilleros:** una grilla con borde fino; cada celda tiene su rótulo en mayúsculas y el valor abajo, cortado con puntos suspensivos si no entra.
- **Dato de ficha:** `<Dato>` pone el mismo rótulo de casillero arriba del valor. Si no hay valor muestra un guion.

### Panel: pendientes, indicadores y vale
- **Para atender:** debajo de los talones, una fila de casilleros con la cantidad de cada pendiente (materiales bajo el mínimo, tipos de activo sin plan, tareas sin terminar) y un enlace en Petróleo a la pantalla donde se resuelve (19/11/2026).
- **Indicadores:** una sola fila de casilleros dentro de una línea de formulario, separados por una línea fina; cada uno dice qué mide debajo del valor, a la vista. Cifras con coma decimal (`es-AR`).
- **Vale de reposición:** la tabla de materiales bajo el mínimo va sin colores, con una línea de troquel debajo del encabezado; lo que importa se lee en la columna «Faltan».

### Cards / Containers
- **Corner Style:** 0.5rem.
- **Background:** blanco.
- **Shadow Strategy:** sombra de apoyo.
- **Border:** línea de formulario.

### Inputs / Fields
- **Style:** borde gris, fondo blanco, esquinas de 0.375rem. Se arman con `<Campo>` y su ancho sigue al contenido (`anchoMinimo` / `anchoMaximo`).
- **Focus:** borde Petróleo con anillo Petróleo al 18%.
- **Validación:** el borde de la caja toma el tono del estado (verde bien, rojo error) con una sombra de 1px del mismo tono, así se ve de 2px sin mover el diseño; el tilde o la cruz dentro de la caja lo repiten. Con foco se suma el anillo Petróleo al 18%. Antes era una raya de 3px al costado izquierdo (cambiado el 18/11/2026).
- **Error / Disabled:** debajo del campo va sólo el error. Deshabilitado: fondo gris de página y opacidad 0.75.
- **Selectores, fechas, duraciones y cantidades:** los componentes de HeroUI dentro de `<Campo>` (lista, fecha, duración, número) y `<SeleccionMultiple>`.

### Navigation
- **Menú lateral:** fondo Tinta, opciones en blanco al 72%, peso 500, 0.92rem, compactas para que entren todas. Títulos de grupo en mayúsculas espaciadas. Con el mouse encima, un velo blanco al 6%.
- **Opción activa:** Petróleo sólido con texto blanco, peso 600.
- **Celular:** el menú se abre encima de la pantalla; cada opción y los botones de abrir y cerrar miden al menos 44px.
- **Accesibilidad:** el menú es la región de navegación «Menú principal» y el contenido va en `<main>`.
- **Migas:** «Inicio › ...» arriba, dibujadas una sola vez desde el encabezado.

### Gráficos
Public Sans en los ejes, en texto secundario. Una serie sola va en Petróleo: ahí el color no dice nada. Las porciones de estado usan el mismo tono que su sello. El lienzo de Chart.js no lee variables CSS, así que `GraficoChart.js` repite los valores de los tonos: si cambia uno en globals.css, se cambia también ahí.

### Pantalla de ingreso
Fondo Tinta con una cuadrícula de formulario muy tenue y columnas de comprobantes que suben despacio (decoración, oculta para lectores de pantalla). La tarjeta llega subiendo (0.6s, `cubic-bezier(0.16, 1, 0.3, 1)`), después se dibuja la línea de troquel (0.45s). El aviso de error se despliega en 0.2s. Si el sistema pide menos movimiento, el fondo queda quieto y todo aparece con un fundido.

## Do's and Don'ts

### Do:
- **Do** poner la referencia escrita de cada color en la misma pantalla. Con sellos de tickets u OT, usar `<ReferenciaEtapas>`.
- **Do** mostrar el estado como sello: mayúsculas espaciadas en un recuadro de línea de 1.5px, en el color de su etapa.
- **Do** mostrar el número de cada registro como talón en Petróleo, peso 800, con cifras tabulares.
- **Do** mostrar los datos de una ficha con `<Dato>`: rótulo chico en mayúsculas arriba, valor abajo.
- **Do** marcar cada contenedor con la línea de formulario y esquinas chicas (4px a 0.5rem).
- **Do** sacar los colores de las variables `--sigma-*` (estados: `--sigma-tono-*`), nunca escribirlos sueltos.
- **Do** llamar «Agregar» al botón de alta y cerrar con «Guardar» y «Cancelar», en ese orden.

### Don't:
- **Don't** pintar un sello de estado en Petróleo; Petróleo es de las acciones, los enlaces, el foco, los números y la opción activa del menú.
- **Don't** usar un color en texto o sello sin su referencia escrita en la pantalla.
- **Don't** dar color a una categoría; va en la etiqueta neutra.
- **Don't** usar sellos con fondo lleno ni pastillas redondeadas para los estados.
- **Don't** reemplazar la línea de formulario por una sombra fuerte.
- **Don't** usar `<select>`, `CFormSelect`, `react-select` ni `<input type="date">`; usar `<Campo>` y `<SeleccionMultiple>`.
- **Don't** poner una línea de ayuda debajo de un campo; abajo va sólo el error.
- **Don't** apagar las cifras tabulares ni cambiar Public Sans por otra letra.
