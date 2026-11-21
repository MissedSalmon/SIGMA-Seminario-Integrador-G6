---
version: 1
slug: "src-app-admin-page-js"
primary_target: "src/app/(admin)/page.js"
related_targets: []
---

# Panel de control (/)

Alcance: pantalla de inicio del administrador, modo Operate. Es la primera superficie del nuevo mundo «Talonario»; el sistema compartido (letra, sellos de estado, talones, casilleros) se extiende después al resto de las pantallas.

Audiencia y tarea: el administrador de la Secretaría de Infraestructura, en PC, mira qué órdenes de trabajo están abiertas y cómo está el mantenimiento. Restricciones: el azul petróleo se mantiene; nada que se vea poco serio ni que agregue pasos; todo color con referencia (regla 6 del CLAUDE.md); reglas de UI del CLAUDE.md intactas.

## Direction contract

THESIS: Cada OT y cada ticket es un comprobante numerado: el número manda, los datos van en casilleros y el estado es un sello. Rechaza el panel de siempre (fila de tarjetas de KPI arriba, gráficos abajo) que no dice qué trabajo hay pendiente.

OWN-WORLD: Fondo gris azulado frío (#f5f7f8), superficies blancas con línea de formulario (#c3d4da), menú en Tinta (#0c2733), Petróleo (#0b6b8c) sólo para el número del talón, acciones y foco. Public Sans con cifras tabulares. Esquinas chicas (6–8px). Talón: número grande en Petróleo con rótulo «OT N°» separado del cuerpo por una línea de troquel punteada. Casilleros: datos en celdas con rótulo chico arriba. Sello: estado en mayúsculas espaciadas dentro de un recuadro de línea, en el color de su etapa (falta empezar, en curso, terminado, cerrado, cancelado; elegido por el usuario el 18/11/2026), nunca en Petróleo, siempre con su referencia escrita al lado. Opción activa del menú en Petróleo sólido.

STORY: Al entrar, el administrador ve primero las OT abiertas como talones numerados, sabe cuál atender y entra con un clic; después lee los indicadores y las tablas.

FIRST VIEWPORT: Menú lateral en Tinta a la izquierda. Arriba, título «Panel de control» y acciones Actualizar / Exportar PDF a la derecha. Primera franja: «Órdenes de trabajo abiertas», hasta 3 talones en fila (número, descripción, casilleros Activo y Prioridad, sello de estado) con «Ver todas» y, debajo, la referencia escrita de los colores de los sellos. Son 3 y no 4 porque con 4 los casilleros cortaban el código del activo (adaptación del 18/11/2026). Debajo, los indicadores de situación actual y los gráficos ya existentes.

FORM: Talonario de órdenes de trabajo, candidato 1 de la lista propia (elegido como pick sobre el asignado «Libro de órdenes de servicio»). seed:6925c32a9a8641ec

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
