# AGENT.md — Mejoras del panel principal de SIGMA

## Objetivo

Mejorar la jerarquía visual, la distribución y la legibilidad del **Panel de Control** de SIGMA, y simplificar la navegación lateral. El resultado debe ser un dashboard claro, consistente y adaptable a escritorio, tablet y móvil, sin alterar las reglas de negocio ni los datos que muestra el sistema.

Tomar como referencia el panel representado en `SIGMA.html`. Ese archivo es una captura HTML renderizada de la aplicación: utilizarlo para reconocer la interfaz y localizar los componentes equivalentes en el código fuente. **No editar `SIGMA.html` como si fuera el componente de la aplicación ni modificar archivos generados/build.** Buscar e intervenir las páginas, componentes, estilos y configuración de navegación reales del proyecto.

---

## 1. Criterios generales de diseño

- Mantener la identidad visual actual de SIGMA: paleta institucional, tipografía, iconografía y lenguaje visual del sistema. Refinar su aplicación, no reemplazarla por una estética ajena al proyecto.
- Establecer una jerarquía consistente: título de página, título de sección, título de panel, descripción breve y contenido gráfico.
- Utilizar alineaciones, separaciones y alturas coherentes entre tarjetas que pertenezcan a una misma fila.
- Evitar que todos los elementos tengan el mismo peso visual. Los indicadores principales deben leerse primero; después, los gráficos que explican la operación; finalmente, las tablas de auditoría y detalle.
- Priorizar el espacio útil para los gráficos. No reducirlos para acomodar títulos largos, textos redundantes o controles decorativos.
- Usar un diseño responsive real. No resolver el escritorio a costa de generar gráficos comprimidos o desplazamiento horizontal en pantallas pequeñas.
- Conservar las funcionalidades actuales: filtros de período, actualización, exportación a Excel, vista alternativa en tabla, notificaciones, navegación, permisos y cierre de sesión.

## 2. Encabezado del panel y filtro temporal

El encabezado debe presentar, en una misma línea cuando haya espacio:

- **Panel de Control** como título principal de la página.
- Fecha y hora de última actualización como información secundaria.
- Acciones **Actualizar** y **Exportar a Excel**, con jerarquía visual secundaria respecto del título.

En pantallas pequeñas, permitir que estos elementos se distribuyan en varias líneas sin superponerse ni reducir el área de interacción de los botones.

Mantener el selector de período (`Últimos 30 días`, `Trimestre`, `Semestre`, `Año`, `Histórico` y `Personalizado`) en una franja compacta y claramente identificable. Debe quedar visualmente asociado al dashboard y no competir con los indicadores KPI.

Todos los gráficos y métricas que dependan del período seleccionado deben utilizar el mismo rango temporal. No aplicar el filtro a indicadores de estado actual —por ejemplo, stock vigente o disponibilidad actual— si la lógica de negocio no los calcula por período. En esos casos, aclarar en el texto que se trata de un valor actual o acumulado.

## 3. Indicadores KPI

El panel contiene cinco indicadores principales:

1. **Operatividad de Activos**.
2. **Tiempo Promedio Resolución**.
3. **Cobertura Preventiva**.
4. **Disponibilidad Técnica**.
5. **Materiales Bajo Mínimo**.

### Distribución propuesta

- Presentar los cinco indicadores en una grilla uniforme, con tarjetas de igual jerarquía, ancho y altura visual.
- En monitores amplios, procurar una única fila de cinco tarjetas. En tamaños intermedios, distribuirlas en dos o tres columnas según el espacio disponible. En móvil, apilarlas o usar una columna, evitando tarjetas demasiado angostas.
- Evitar la distribución irregular que deja una primera fila con tres tarjetas y otra con dos cuando existe espacio suficiente para una grilla equilibrada.
- Mantener el valor principal como elemento de mayor tamaño; debajo, ubicar la unidad, cantidad de referencia o denominador y una aclaración contextual breve.
- Alinear los valores principales entre tarjetas y reservar un espacio consistente para sus descripciones.
- Usar color semántico con moderación: indicar alertas o estados relevantes, no colorear todos los indicadores de manera arbitraria.

No cambiar fórmulas, valores, denominadores, umbrales ni fuentes de datos. Los valores visibles en el HTML son datos de una captura y no deben convertirse en constantes del código.

## 4. Distribución de gráficos

Actualmente hay ocho paneles gráficos. La distribución debe responder a su relación temática y a la cantidad de información que necesita mostrar cada visualización. Usar una grilla de 12 columnas en escritorio, con separación uniforme entre paneles.

### Sección A — Mantenimiento y tickets

**Primera fila: actividad y estado de tickets**

- **Evolución mensual de tickets: Creados vs. Cerrados**: asignar aproximadamente 8 de las 12 columnas. Es el gráfico temporal principal y necesita espacio horizontal para mostrar meses, series y leyenda con claridad.
- **Distribución de tickets por estado**: asignar aproximadamente 4 de las 12 columnas. Mantenerlo como visualización de resumen, con leyenda legible y valores identificables.

**Segunda fila: incidencias y órdenes de trabajo**

- **Ranking de áreas con mayor incidencia de fallas**: asignar 6 columnas. Priorizar la lectura de nombres de áreas y la comparación entre cantidades.
- **Órdenes de trabajo por origen**: asignar 3 columnas.
- **Órdenes de trabajo por prioridad**: asignar 3 columnas.

Los dos últimos paneles pueden ser más compactos únicamente si sus etiquetas, leyendas y valores siguen siendo legibles. Si el contenido real no cabe, aumentar su ancho y reacomodar la fila en lugar de comprimir el gráfico.

### Sección B — Personal e inventario de activos

**Primera fila: carga de trabajo**

- **Carga de trabajo activa por técnico**: utilizar el ancho completo (12 columnas). El listado de técnicos y sus cantidades necesita espacio para identificar cada categoría sin abreviar nombres en exceso. Si la visualización es de barras, priorizar una orientación horizontal cuando facilite la lectura.

**Segunda fila: inventario de activos**

- **Activos inventariados por edificio**: asignar aproximadamente 8 columnas.
- **Distribución de activos por estado**: asignar aproximadamente 4 columnas.

Esta distribución da más espacio al desglose por edificio y mantiene un ancho suficiente para el resumen por estado. En resoluciones menores, apilar ambos paneles.

### Reglas para las tarjetas de gráficos

- Cada panel debe tener un encabezado consistente: título breve, descripción de una línea y acción **Tabla** alineada en el extremo derecho.
- La acción **Tabla** debe conservar su función de accesibilidad y permitir consultar los mismos datos que presenta el gráfico.
- Evitar alturas rígidas que recorten leyendas o etiquetas. Utilizar alturas mínimas razonables y permitir que el contenido se adapte al tipo de gráfico.
- Mantener alineadas las tarjetas de una misma fila, pero no forzar una altura que deje gráficos excesivamente pequeños o grandes espacios vacíos.
- Reservar espacio suficiente para ejes, etiquetas, leyendas y tooltips. Si una leyenda no entra, permitir que se distribuya en varias líneas o ubicarla de forma más conveniente.
- No truncar nombres de áreas, edificios, técnicos, prioridades ni estados sin una alternativa accesible para consultar el nombre completo.
- Evitar repetir el mismo concepto en el título y en la descripción.

## 5. Títulos, descripciones y textos de los gráficos

Los textos deben explicar qué se está midiendo y, cuando corresponda, el alcance temporal o el criterio de inclusión. Usar títulos en lenguaje directo, sin frases innecesariamente extensas. Mantener una sola descripción breve por gráfico.

Tomar estas propuestas como referencia de redacción; adaptar el texto final a la consulta y a los datos reales:

| Panel actual | Título recomendado | Descripción recomendada |
|---|---|---|
| Evolución mensual de tickets: Creados vs. Cerrados | **Tickets creados y cerrados por mes** | Comparación mensual de tickets registrados y finalizados. |
| Distribución de tickets por estado | **Tickets según su estado** | Distribución de los tickets registrados en el período seleccionado. |
| Ranking de áreas con mayor incidencia de fallas | **Áreas con más incidencias** | Cantidad de fallas registradas en activos de cada área. |
| Órdenes de trabajo por origen | **Órdenes de trabajo por tipo** | Comparación entre órdenes correctivas y preventivas. |
| Órdenes de trabajo por prioridad | **Órdenes por prioridad** | Órdenes no canceladas incluidas en el período seleccionado. |
| Carga de trabajo activa por técnico | **Tareas pendientes por técnico** | Tareas asignadas que todavía no fueron finalizadas. |
| Activos inventariados por edificio | **Activos en servicio por edificio** | Cantidad de activos en servicio; no incluye los retirados. |
| Distribución de activos por estado | **Activos según su estado** | Distribución según el estado del ciclo de vida del equipamiento. |

### Reglas de contenido y legibilidad

- Usar una descripción orientativa, no una segunda explicación extensa del título.
- Especificar unidades y magnitudes cuando no sean obvias: cantidad de tickets, tareas, activos, días u horas.
- En gráficos temporales, identificar claramente la escala del eje horizontal y la unidad del eje vertical.
- Mantener nombres de categorías y leyendas consistentes con los utilizados en los módulos de gestión.
- Ordenar rankings y prioridades con un criterio explícito y estable. No alterar la semántica de los estados o prioridades.
- Mostrar ceros cuando tengan significado para la continuidad de una serie temporal; distinguirlos de datos faltantes o no disponibles.
- Utilizar formatos numéricos y temporales homogéneos en todos los paneles.
- No presentar porcentajes sin aclarar el universo o denominador cuando no resulte evidente.
- No inventar datos, categorías, períodos, indicadores ni conclusiones. Si falta información para un texto, conservar una descripción neutral.

### Orientación visual por tipo de información

Cuando el tipo de gráfico existente lo permita y sin cambiar la semántica de los datos:

- Evolución mensual: línea o barras agrupadas para comparar creados y cerrados a lo largo del tiempo.
- Distribuciones por estado: dona o barras, siempre con categorías, cantidades y porcentajes legibles.
- Ranking de áreas: barras horizontales ordenadas de mayor a menor.
- Órdenes por origen: comparación directa de correctivas y preventivas.
- Órdenes por prioridad: categorías ordenadas según la escala de prioridad definida por el sistema, no alfabéticamente.
- Carga por técnico: barras horizontales ordenadas por cantidad de tareas pendientes.
- Activos por edificio: barras horizontales o verticales según la cantidad y longitud de las etiquetas.
- Activos por estado: dona o barras, conservando todas las categorías relevantes.

El HTML de referencia muestra los elementos `canvas` y sus etiquetas accesibles, pero no expone de forma verificable toda la configuración interna de Chart.js. Antes de cambiar un tipo de visualización, revisar su implementación real y los datos que recibe.

## 6. Auditoría y tablas de detalle

Mantener **Auditoría y Tablas de Detalle** después de los gráficos, como nivel secundario de consulta. No debe competir visualmente con los KPI ni con los gráficos principales.

La sección contiene:

- **Materiales Críticos bajo Stock Mínimo**.
- **Tiempos Promedio de Resolución por Área**.

Mejoras solicitadas:

- Conservar el control para mostrar u ocultar los detalles y hacer que su estado y etiqueta sean claros.
- En escritorio, presentar las dos tablas en columnas equilibradas; en móvil, apilarlas y mantener desplazamiento horizontal solo dentro de cada tabla cuando sea imprescindible.
- Alinear cantidades y tiempos a la derecha, y mantener encabezados claros y visibles.
- Resaltar faltantes o alertas de stock mediante color semántico sin depender exclusivamente del color.
- No reducir el tamaño de fuente hasta volver difícil la lectura.
- Preservar todos los registros, columnas, enlaces y criterios actuales.

## 7. Navegación lateral: eliminar los menús desplegables

### Problema actual

El menú lateral combina títulos de sección (`nav-title`) con grupos desplegables (`nav-group`). Actualmente hay tres grupos desplegables:

- **Espacios**, que contiene `Tipos de espacio` y `Listado de espacios`.
- **Prestadores de servicio**, que contiene `Tipos de prestador` y `Listado de prestadores`.
- **Usuarios**, que contiene `Técnicos` y `Usuarios autorizados`.

Esta combinación genera niveles de navegación innecesarios y obliga a realizar una interacción adicional para llegar a opciones que deberían estar visibles.

### Cambio obligatorio

**Eliminar los tres menús desplegables y conservar los títulos de sección que dividen la navegación.** No reemplazarlos por otros desplegables, acordeones ni submenús.

- Eliminar los elementos interactivos que funcionan como disparadores de grupo (`nav-group-toggle`) y los contenedores anidados de subopciones (`nav-group-items`).
- Convertir cada opción que actualmente está dentro de esos submenús en un enlace normal de primer nivel (`nav-item` / `nav-link`).
- Ubicar esos enlaces debajo del título de sección correspondiente.
- Mantener los títulos actuales que separan las áreas de navegación: **Mantenimiento**, **Estructura edilicia**, **Gestión de Activos**, **Gestión de inventario** y **Personal**.
- Mantener **Panel** como acceso directo inicial, separado de los títulos de sección.
- Los textos **Espacios**, **Prestadores de servicio** y **Usuarios** son actualmente disparadores de desplegables, no títulos `nav-title`: quitarlos como controles de expansión. No conservar flechas, estados `aria-expanded` ni contenedores colapsables.

### Organización final esperada

Mantener el orden funcional actual y distribuir los enlaces de esta manera:

- **Panel**
- **Mantenimiento**
  - Tickets
  - Órdenes de trabajo
  - Planes de mantenimiento
  - Plantillas de tareas
- **Estructura edilicia**
  - Edificios
  - Tipos de espacio
  - Listado de espacios
  - Áreas
- **Gestión de Activos**
  - Tipos de activos
  - Activos
- **Gestión de inventario**
  - Tipos de materiales y herramientas
  - Materiales
  - Herramientas
  - Ingresos
- **Personal**
  - Especialidades
  - Carga de trabajo
  - Tipos de prestador
  - Listado de prestadores
  - Técnicos
  - Solicitantes

Los ítems de la lista son enlaces directos, no subniveles visuales. Los títulos en negrita representan los divisores de sección y no deben ser enlaces.

### Renombrar opción

Cambiar el texto visible del enlace lateral **Usuarios autorizados** por **Solicitantes**.

- Mantener la ruta actual (`/autorizados`) y el comportamiento de navegación, salvo que exista una instrucción técnica independiente que justifique migrarla.
- No renombrar tablas, entidades, permisos, roles, endpoints, identificadores internos ni lógica de autorización por este cambio de etiqueta.
- Actualizar el texto visible en el menú y cualquier etiqueta duplicada que forme parte del mismo elemento de navegación, sin modificar el alcance funcional de la pantalla.

### Estilo y comportamiento del menú simplificado

- Todos los enlaces deben tener el mismo nivel de indentación y alineación dentro de su sección.
- Conservar los íconos actuales cuando sigan representando correctamente cada destino.
- Mantener un estado activo claramente visible para la ruta actual.
- Dar a los títulos `nav-title` una apariencia secundaria, diferenciada de los enlaces, pero con contraste suficiente.
- Mantener separaciones verticales moderadas entre secciones; no usar tarjetas o cajas para cada grupo.
- El menú debe seguir siendo desplazable si la cantidad de enlaces supera la altura disponible.
- Conservar el comportamiento responsive de apertura/cierre del panel lateral en móvil. Esto no es un menú desplegable de categorías y no debe eliminarse.
- Asegurar navegación por teclado, foco visible y nombres accesibles en los enlaces.

## 8. Restricciones de implementación

- No modificar cálculos de KPI, consultas, filtros, datos de ejemplo, contratos de API, permisos ni reglas de negocio como parte de este rediseño visual.
- No eliminar paneles, acciones o tablas existentes.
- No reemplazar datos reales por valores estáticos ni usar los valores visibles en `SIGMA.html` como datos hardcodeados.
- No cambiar rutas para resolver únicamente un cambio de etiqueta.
- Reutilizar los componentes, utilidades, sistema de estilos e iconos que ya utilice el proyecto. Evitar agregar dependencias si no son necesarias.
- Mantener la acción de exportación a Excel y la alternativa de visualización en tabla para cada gráfico.
- Evitar duplicar lógica de filtros o definir estados independientes para paneles que deben responder al mismo período.
- Si se requiere reorganizar componentes, favorecer componentes reutilizables para encabezados de sección y tarjetas de gráficos, sin crear abstracciones innecesarias.

## 9. Verificación y criterios de aceptación

La tarea se considera terminada cuando se cumpla todo lo siguiente:

### Panel principal

- [ ] El encabezado permite identificar rápidamente el panel, la actualización más reciente y las acciones disponibles.
- [ ] Los cinco KPI aparecen en una grilla equilibrada y responsive.
- [ ] Los ocho gráficos están organizados en las secciones y proporciones propuestas, o en una variante equivalente que preserve la jerarquía y legibilidad.
- [ ] Ningún gráfico tiene leyendas, títulos, etiquetas o ejes recortados.
- [ ] Los títulos y descripciones son breves, consistentes y explican correctamente el contenido.
- [ ] Los filtros continúan afectando a los indicadores y gráficos que corresponda, sin cambiar sus cálculos.
- [ ] La acción **Tabla** de cada gráfico sigue mostrando los datos equivalentes.
- [ ] Las tablas de auditoría siguen disponibles y se adaptan a pantallas pequeñas.

### Navegación lateral

- [ ] No quedan grupos desplegables para Espacios, Prestadores de servicio ni Usuarios.
- [ ] No quedan `nav-group-toggle`, submenús `nav-group-items`, flechas de expansión ni atributos `aria-expanded` asociados a esos grupos.
- [ ] Se conservan los cinco títulos `nav-title` de sección existentes.
- [ ] Todas las opciones que antes estaban dentro de los desplegables aparecen como enlaces directos bajo su sección correspondiente.
- [ ] El enlace se muestra como **Solicitantes** y continúa navegando a `/autorizados`.
- [ ] El estado activo se actualiza correctamente al navegar por cada ruta.
- [ ] El panel lateral continúa funcionando en escritorio y móvil.

### Pruebas visuales y funcionales

Verificar como mínimo en anchos aproximados de 1440 px, 1024 px, 768 px y 390 px:

- Ausencia de desbordamiento horizontal de la página.
- Tarjetas alineadas y con separación uniforme.
- Etiquetas, leyendas y textos legibles.
- Navegación lateral utilizable y desplazable.
- Botones, filtros, exportación, actualización y controles de tabla operativos.
- Enlaces directos con destinos correctos y sin cambios accidentales de permisos.

Al finalizar, informar qué componentes/archivos del proyecto fueron modificados y qué verificaciones se realizaron. Si alguna distribución propuesta no resulta viable por el tipo real de gráfico o por el espacio disponible, documentar el ajuste y justificarlo por legibilidad, no por conveniencia de implementación.
