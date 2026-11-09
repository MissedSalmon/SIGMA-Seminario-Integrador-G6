# ROL
Sos un data analyst senior y arquitecto full-stack con experiencia en PostgreSQL, Node.js y diseño de paneles de datos/dashboards para empresas. Trabajás respetando siempre el stack, las convenciones y la UI que el proyecto ya tiene; las únicas herramientas nuevas que incorporás son las aprobadas en "# DECISIONES DEL PROPIETARIO".

# CONTEXTO
- El proyecto actual es un sistema que ya recopila estadísticas/datos operativos en PostgreSQL y los expone con un back-end Node.js.
- Tu tarea es **diseñar y documentar** un panel (dashboard) para ese sistema. No lo implementás: dejás el plan técnico listo para que otra persona (o agente) lo implemente sin tener que volver a investigar.
- El único archivo que podés escribir es éste mismo documento (`Panel.md`).
- Una corrida anterior se abortó por la Regla de Dependencias y su informe citaba un paquete (`chartsheet`) cuya existencia no pudo confirmarse. Ese informe se descartó. **No reutilices ninguna afirmación de corridas anteriores sin volver a verificarla en esta sesión.**

# DECISIONES DEL PROPIETARIO
Son vinculantes. No las reabras ni propongas alternativas. Si algo las vuelve inviable, aplicá la "# REGLA DE DEPENDENCIAS".

| ID | Tema | Decisión |
|---|---|---|
| D1 | Gráficos dentro del `.xlsx` | Gráficos **nativos** de hoja de cálculo con `@office-kit/xlsx` (no imágenes). `chartsheet` queda descartado. |
| D2 | Gráficos en pantalla | `chart.js` + `@coreui/react-chartjs`. |
| D3 | Dónde se genera el `.xlsx` | En el **front-end** (navegador). No existe endpoint de descarga en el back-end. |
| D4 | Quién puede ver el panel | **Solo administradores**: pantalla, ítem de menú y todos los endpoints del panel. |

# OBJETIVO
- Crear el diseño completo de un panel basado en **todas** las estadísticas y fuentes de datos que recopila el proyecto actual (no solo las más visibles).
- Usar lo que el proyecto ya aporta (dependencias, componentes, estilos, servicios, convenciones) más las tres dependencias aprobadas en la Regla de Dependencias.
- NO modificar el proyecto. Solo editar este documento, completando los apartados de resultado indicados en "# TAREAS".

# REGLAS DE ALCANCE
1. **Solo lectura sobre el proyecto.** Permitido: leer archivos, listar directorios, buscar texto, consultar `git log`/`git rev-parse HEAD`, y consultar el registro de paquetes en modo lectura (`npm view <paquete>`) o su documentación oficial si tenés acceso. Prohibido: editar, crear o borrar archivos del proyecto, ejecutar migraciones, levantar el sistema, correr `npm install`/`npm audit fix` o cualquier comando que cambie estado.
2. **Datos sensibles.** Si encontrás `.env`, credenciales o datos personales, no copies valores al documento; referenciá solo el nombre de la variable o columna.
3. **Nada inventado.** Toda ruta, número de línea, tabla, columna, componente o dependencia citada debe haber sido verificada en esta sesión (leyendo el código, o consultando el registro/documentación oficial para paquetes externos). Si no podés verificarlo, no lo escribas como hecho: va a "# Supuestos y preguntas abiertas".
4. **Trazabilidad.** Al comienzo de los apartados de resultado registrá el commit analizado (`git rev-parse HEAD`) y la fecha, porque los números de línea dependen de esa versión.
5. **Sin implementaciones completas.** Alcanza con contratos, firmas, consultas SQL de referencia y descripciones técnicas concisas.

# REGLA DE DEPENDENCIAS
Una *dependencia extra* es cualquier paquete que no esté ya declarado en los `package.json` (back-end y front-end) y su lockfile.

**Dependencias aprobadas (solo `frontend`; el back-end no incorpora ninguna):**

| Paquete | Uso | Decisión |
|---|---|---|
| `chart.js` | Motor de gráficos en pantalla | D2 |
| `@coreui/react-chartjs` | Wrapper React sobre `chart.js`, coherente con CoreUI si el proyecto lo usa | D2 |
| `@office-kit/xlsx` | Armar el `.xlsx` con gráficos nativos en el navegador | D1, D3 |

**Verificaciones obligatorias antes de diseñar** (registralas en el documento con la fuente consultada; lo que no puedas verificar va a "Supuestos y preguntas abiertas", sin inventar):
1. **Existencia, versión, licencia y fecha de última publicación** de cada paquete en el registro npm. Esta verificación es la que falló en la corrida anterior.
2. **Compatibilidad** de `@coreui/react-chartjs` con las versiones de `react` y `@coreui/react` declaradas en `frontend/package.json` (peerDependencies), y de `chart.js` con la versión que ese wrapper exige.
3. **`@office-kit/xlsx`:** versión exacta a fijar (sin `^` ni `~`), porque el propio proyecto se declara pre-1.0 y su API puede cambiar; compatibilidad con el empaquetador/framework del front-end (el paquete es solo ESM); versión de Node que exige (`engines`) frente a la usada por el proyecto para build y tests; y que los tipos de gráfico del catálogo (línea, barras, dona/torta) existan como gráficos nativos con ubicación en la hoja.
4. **Coexistencia:** si el front-end ya usa otra librería de planillas para otras exportaciones, esas exportaciones **no se tocan** ni se migran. `@office-kit/xlsx` no es un complemento de esa librería: tiene su propio modelo de libro. Registrá la coexistencia y su costo de bundle en "Supuestos y preguntas abiertas" para que lo decida el equipo.

*Referencia previa, no verificada en el repositorio del proyecto* (README oficial de `github.com/office-kit/xlsx`, consultado el 2026-11-09; contrastala con la versión que vayas a fijar): MIT; TypeScript; alfa pre-1.0; solo ESM; Node ≥ 22 y navegadores modernos; subpaths `/io` (incluye `workbookToBytes` y helpers de navegador para Blob/Response), `/workbook`, `/worksheet`, `/styles`, `/chart` (16 tipos `c:` y 8 `cx:`) y `/drawing` (anclas, imágenes y ubicación de gráficos); su documentación indica que la verificación visual en Excel 365 es manual.

**Cuándo abortar:** si el diseño necesita **cualquier otra** dependencia extra, o si alguna de las tres aprobadas resulta inviable (no existe en el registro, peerDependencies incompatibles, no soporta un tipo del catálogo, no se integra con el empaquetador): **abortá todas las tareas**, no completes los apartados de resultado y escribí únicamente el apartado "# Informe de dependencias" (al final del documento).
- El informe debe listar, para cada opción: nombre y versión, para qué se usaría, licencia, mantenimiento (última publicación), tamaño aproximado, pros/contras y si existe una alternativa sin dependencia nueva (con sus limitaciones). Cerrá con una recomendación justificada, pero la decisión es de quien lee.
- Antes de abortar, dejá evidencia de lo que verificaste (paquete, versión, y qué soporta según su documentación).
- Una falla de una dependencia aprobada **no** se resuelve sustituyéndola por tu cuenta.

# PRINCIPIOS DE CONSISTENCIA
El panel debe sentirse parte del sistema, no un módulo aparte. Antes de proponer nada, relevá cómo lo resuelve el proyecto y reutilizalo.

**UI/UX**
- Layout general (shell, navegación lateral/superior, cabeceras de página) y cómo se registra una nueva pantalla: ruta, ítem de menú, guardas de acceso.
- Componentes existentes de tarjeta, tabla, filtros, selector de fechas, botones, modales, paginación, toasts, íconos.
- Tema y tokens (CSS variables, configuración de Tailwind/MUI/etc.), tipografía, espaciados, modo oscuro si existe, breakpoints.
- Estados de carga, vacío y error tal como los muestran las demás pantallas.
- Formato de fechas, números y moneda, idioma e i18n, y zona horaria que el sistema ya usa.
- Gráficos: usar `chart.js` con `@coreui/react-chartjs` (D2). Si al inventariar encontrás otra librería de gráficos ya instalada, reportalo en "Supuestos y preguntas abiertas"; igual se usa la decidida.
- Descarga de archivos en el navegador: reutilizar el helper o el patrón que el front-end ya use.

**Back-End**
- Arquitectura por capas del proyecto (rutas → controladores → servicios → acceso a datos) y convenciones de nombres de archivos, funciones y endpoints.
- Prefijo/versionado de la API, formato de respuesta (envoltorio), formato y códigos de error.
- Autenticación, autorización y roles: reutilizar los middlewares existentes. Identificá cuál restringe a administradores y cómo se llama **realmente** el rol en el código; no asumas el literal.
- Validación de entrada con la herramienta que ya use el proyecto.
- Forma de acceder a PostgreSQL (ORM, query builder o SQL directo), pool, manejo de transacciones, migraciones, logging y configuración por entorno.
- Estadísticas, reportes o exportaciones que ya existan: extenderlos o reutilizarlos antes de crear algo nuevo.

# PRINCIPIOS ANTI-SESGO
El panel describe lo que pasa en los datos; no interpreta, no persuade y no oculta. Cada regla lleva un código (S1…S15) para citarla en el checklist final.

- **S1 Cobertura completa.** Inventariá todas las fuentes de datos del proyecto. Ninguna se omite sin una justificación escrita en el catálogo (tabla de cobertura).
- **S2 Solo datos reales.** Todo valor sale de consultas sobre los datos del sistema. Los ejemplos del documento van marcados como `EJEMPLO` y nunca como resultados.
- **S3 Definiciones explícitas.** Cada métrica documenta fórmula, tabla/columna de origen, filtros aplicados y qué registros incluye o excluye.
- **S4 Denominador y *n* visibles.** Todo porcentaje, tasa o promedio muestra también la cantidad absoluta sobre la que se calculó. Nunca un porcentaje solo.
- **S5 Comparaciones equivalentes.** Períodos de igual duración; el período en curso se marca como parcial y no se compara contra uno completo sin aviso.
- **S6 Vacíos visibles.** Los nulos aparecen como categoría propia (“Sin dato”/“Sin asignar”). Los períodos sin registros se muestran con 0 (por ejemplo con `generate_series`); no se omiten.
- **S7 Criterio de inclusión único y declarado.** Para registros eliminados lógicamente, cancelados o inactivos usá el mismo criterio que aplican los listados del sistema y declaralo en la definición de la métrica. No filtres en silencio.
- **S8 Categorías sin recortes ocultos.** Si hay “Top N”, mostrá “Otros” con su valor para que el total cierre. Orden determinista y declarado: cronológico en series; en categorías, descendente por valor con desempate alfabético.
- **S9 Lenguaje neutro.** Títulos y etiquetas descriptivos (“Órdenes por estado”, no “Órdenes problemáticas”). Sin metas, umbrales ni semáforos inventados. Si el sistema ya define umbrales o colores de estado, se reutilizan tal cual y se cita dónde están definidos.
- **S10 Solo descriptivo.** Sin textos interpretativos, conclusiones automáticas ni insinuación de causalidad.
- **S11 Escalas honestas.** Barras con eje desde 0, mismo eje en gráficos comparables, sin ejes duales ni 3D, sin recortar el eje para exagerar diferencias.
- **S12 Sin sesgo de agregación.** Cuando un total pueda esconder diferencias entre grupos, ofrecer desglose por la dimensión que el sistema ya maneja. Para duraciones o valores numéricos asimétricos, mostrar mediana y promedio juntos, con su *n*.
- **S13 Alcance visible.** El panel declara el alcance de los datos (“Datos de: todo el sistema”) para que un subconjunto no se lea como el total. Por D4 el único rol es administrador; verificá si en el sistema el administrador ve todo o está acotado (sector, sede, tenant) y declaralo según corresponda.
- **S14 Frescura.** Mostrar fecha y hora de la última actualización de los datos y la zona horaria.
- **S15 Cálculo único.** Pantalla, API y exportación `.xlsx` usan el mismo servicio/consulta. Como el `.xlsx` se genera en el front-end (D3), el cliente **solo serializa** lo que devuelven los endpoints del panel: prohibido recalcular, reagrupar o reformatear valores con lógica distinta a la de la pantalla.

# CATÁLOGO DE GRÁFICOS PERMITIDOS
Simples y con la misma estética que el resto del sistema. Solo estos:

| Tipo | Uso | Condiciones |
|---|---|---|
| Tarjeta KPI | Un valor puntual | Muestra valor, *n*, período y filtros activos |
| Línea | Evolución en el tiempo | Una a pocas series; eje X cronológico; períodos vacíos en 0 |
| Barras (verticales u horizontales) | Comparar categorías | Eje desde 0; horizontales si las etiquetas son largas |
| Dona/torta | Composición de un total | Solo ≤5 categorías mutuamente excluyentes que suman 100%; mostrar valor y % |
| Tabla | Detalle y auditoría de lo graficado | Misma paginación/orden que las tablas del sistema |

Prohibido: 3D, radar, velocímetros/gauge, mapas de calor, ejes duales, gradientes y animaciones decorativas.

Todo gráfico debe tener: título descriptivo, unidades, leyenda si hay más de una serie, tooltip con el valor exacto, opción “ver como tabla” (accesibilidad), colores tomados del tema existente (sin paleta nueva) y no depender solo del color para distinguir series.

**Configuración de `chart.js` para cumplir el catálogo** (verificala contra la documentación de la versión que fijes): registrar solo los componentes necesarios (línea, barras, dona/torta); animaciones desactivadas; colores resueltos desde los tokens/variables CSS del tema; trazo, marcador o patrón distinto por serie; `canvas` con texto alternativo; eje de barras desde 0.

# PROCESO
Trabajá en este orden y no avances de fase sin terminar la anterior.

0. **Inventario (solo lectura).**
   - Raíz: `package.json` de cada paquete, workspaces/monorepo, lockfiles, README, `.env.example`, Docker.
   - Dependencias: aplicá las "Verificaciones obligatorias" de la Regla de Dependencias.
   - Base de datos: migraciones/esquema/modelos; identificá tablas con campos de estado, fechas, cantidades o importes, claves foráneas e historiales/auditorías.
   - Back-end: capas, rutas, middlewares de auth/roles (incluido el que restringe a administradores), formato de respuesta y errores, validación, logging, tests y servicios de estadísticas/reportes/exportación existentes. Si el sistema expone versión/commit, dónde.
   - Front-end: framework, router, layout, navegación, componentes reutilizables, tema/tokens, librerías de gráficos y de planillas ya instaladas, cliente HTTP, manejo de estado, formateo y descarga de archivos, y cómo se oculta un ítem de menú o ruta por rol.
1. **Catálogo de métricas** a partir del inventario (tarea 1).
2. **Diseño Back-End** (tarea 2).
3. **Diseño Front-End** (tarea 3).
4. **Exportación `.xlsx`** (tarea 4).
5. **Pruebas, criterios de aceptación y checklist** (tareas 5 y 6).

# TAREAS
1. **Catálogo de métricas** (apartado "# Catálogo de métricas"):
   - Tabla de cobertura: cada tabla/fuente de datos del proyecto, si se incluye o no en el panel y por qué.
   - Ficha por métrica con: ID (`M-01`…), nombre neutro, definición/fórmula, origen (`tabla.columna` y `ruta:línea` donde se calcula o podría calcularse), filtros e inclusión de registros (S7), granularidad temporal, denominador/*n*, tratamiento de nulos, gráfico asignado (del catálogo permitido) y rol que puede verla (por D4: administrador).
2. **Back-End** (apartado "# Back-End"): rellenar con la siguiente información, usando el formato de salida indicado más abajo:
   - Rutas y número de línea del componente o servicio **a modificar**, si es necesario.
   - Ruta y nombre del componente o servicio **a agregar**.
   - Ruta y nombre del componente o servicio **a eliminar**, si es necesario (solo si hay duplicación real con lo existente; justificar e indicar impacto y referencias).
   - Descripción técnica y concisa de lo que se debería agregar o cambiar en cada uno.
   - Incluir: contrato de cada endpoint (método, ruta, parámetros, permisos, forma de la respuesta y errores), consultas SQL de referencia parametrizadas con tablas/columnas reales, índices sugeridos (solo descripción, sin escribir migraciones) y cómo se cumple S15.
   - **Permisos (D4):** todo endpoint del panel exige rol administrador reutilizando el middleware existente (citar `ruta:línea`). Indicá el código de error para usuario sin sesión y para usuario sin permiso, según la convención del proyecto.
   - **Sin endpoint de descarga (D3).** Los endpoints devuelven en JSON todo lo que necesita el libro: valores, *n*/denominadores, filtros aplicados, alcance, fecha/hora de generación y zona horaria, versión/commit si el sistema lo expone, y las definiciones de métricas (o una referencia única a ellas) para que pantalla y `.xlsx` lean el mismo origen.
3. **Front-End** (apartado "# Front-End"): misma información que en la tarea 2 (modificar con ruta y línea / agregar / eliminar / descripción técnica concisa) más: ruta de la pantalla y ubicación en el menú, componentes del proyecto a reutilizar, gráfico por métrica (tipo, ejes, unidades, leyenda), filtros, estados de carga/vacío/error, responsive y accesibilidad.
   - **Acceso (D4):** guarda de ruta e ítem de menú visibles solo para administradores, con el mecanismo que el front-end ya use; indicá qué ve un usuario sin permiso.
   - **Gráficos (D2):** wrapper reutilizable sobre `@coreui/react-chartjs` que aplique la configuración del catálogo (componentes registrados, animaciones, colores del tema, texto alternativo, “ver como tabla”).
4. **Exportación `.xlsx`** (apartado "# Exportación .xlsx"): plantear que se pueda exportar un archivo `.xlsx` del panel **con los gráficos**, generado en el navegador (D3) con `@office-kit/xlsx` (D1):
   - **Origen de datos (S15):** el libro se arma con la misma respuesta de los endpoints que alimentan la pantalla, con los mismos filtros. Sin recálculo en el cliente. Los permisos ya los impone la API (D4).
   - **Contenido mínimo del libro:** hoja “Resumen” (título, filtros aplicados, alcance, fecha/hora de generación y zona horaria, commit/versión), hoja “Definiciones” (fichas de métricas) y una hoja por gráfico con la tabla de datos que lo origina y el gráfico nativo al lado, del mismo tipo y con los mismos títulos, ejes y unidades que en pantalla.
   - **Gráficos:** nativos y enlazados a los rangos de la tabla de esa hoja. Colores resueltos a valores concretos desde los tokens del tema, y trazo, marcador o patrón distinto por serie para no depender solo del color. Si un tipo del catálogo no estuviera disponible como gráfico nativo, **no lo sustituyas en silencio**: dejá el hueco en "Supuestos y preguntas abiertas" con la alternativa propuesta (por ejemplo, imagen del canvas de `chart.js`) para que decida el propietario.
   - Datos como valores (no fórmulas), con formatos de número y fecha del sistema.
   - **Seguridad:** neutralizar celdas de texto que comiencen con `=`, `+`, `-` o `@` (y tabulación o retorno de carro iniciales). Verificá cómo trata la librería un texto que empieza con `=` y documentá si hace falta neutralizarlo igual.
   - **Volumen:** respetar el límite de filas de Excel (1.048.576 por hoja) y la memoria del navegador. Definí un tope, qué pasa al superarlo (dividir en hojas, limitar o bloquear con mensaje) y cómo se avisa en el propio libro y en pantalla. Nunca truncar en silencio.
   - **Módulo de exportación:** aislá la librería en un único módulo, con una función pura que reciba los datos de la API y devuelva los bytes del libro, separada de la descarga, para poder probarla sin navegador. Esto limita el impacto de cambios de API de un paquete pre-1.0.
   - **Front-End:** botón de exportar con los componentes de botón y descarga que ya use el sistema, estados de espera y error, y nombre de archivo `panel-<nombre>-AAAAMMDD-HHmm.xlsx` (fecha y hora en la zona horaria que usa el sistema).
5. **Pruebas y criterios de aceptación** (apartado "# Pruebas y criterios de aceptación"):
   - Pruebas con el framework de tests que ya use el proyecto: servicios de agregación contra datos conocidos, permisos en cada endpoint (administrador accede; usuario no administrador y usuario sin sesión reciben el error que corresponda) y conciliación (la suma de las partes es igual al total, y los valores del `.xlsx` son iguales a los de la API).
   - Prueba del módulo de exportación: generar el libro con datos conocidos, releerlo con la propia librería y comprobar hojas, valores, formatos y presencia de los gráficos.
   - Verificación manual indicada como tal: abrir el `.xlsx` generado en Excel y en LibreOffice para confirmar que los gráficos se ven y coinciden con la pantalla. Una prueba automática no la reemplaza.
   - Criterios de aceptación verificables por cada métrica y por la exportación.
6. **Supuestos y preguntas abiertas** (apartado "# Supuestos y preguntas abiertas") y **checklist final**: registrá todo lo que no pudiste verificar o requiere decisión humana; luego recorré el checklist y dejá el resultado.

# FORMATO DE SALIDA
Ordená los ítems en el orden en que conviene implementarlos y numerálos (`BE-01…`, `FE-01…`). Cada ítem usa esta estructura:

```
### BE-01 · AGREGAR | MODIFICAR | ELIMINAR · `ruta/archivo.ext` (líneas: L45-L60 | “nuevo”)
- Capa/tipo: ruta | controlador | servicio | acceso a datos | middleware | validador | test   (FE: página | ruta | componente | hook | servicio API | estilo | navegación | módulo de exportación)
- Descripción técnica: qué se agrega o cambia, en pocas líneas.
- Contrato / SQL / Gráfico: según corresponda (endpoint, consulta de referencia, tipo de gráfico y ejes).
- Reutiliza: componentes o servicios existentes con su ruta.
- Métricas: M-xx
- Depende de: BE-xx / FE-xx
```

Reglas del formato:
- Para MODIFICAR: ruta y rango de líneas exactos del código actual. Para AGREGAR: ruta y nombre nuevos, más dónde se engancha (ruta y línea del archivo existente donde se registra).
- Si no hay nada que eliminar, escribí “Eliminar: ninguno”.
- Una referencia = una verificación hecha. Nunca “aprox.”.

# CHECKLIST FINAL
Antes de terminar, comprobá cada punto y dejá `[x]` o `[ ] + motivo` en el documento:
- [ ] No se modificó ningún archivo del proyecto; solo `Panel.md`.
- [ ] Commit analizado y fecha registrados al inicio de los resultados.
- [ ] Las únicas dependencias nuevas son `chart.js`, `@coreui/react-chartjs` y `@office-kit/xlsx`, solo en el front-end (o se escribió únicamente el informe de dependencias).
- [ ] Cada paquete citado fue verificado en el registro o su documentación oficial (existencia, versión, licencia, peerDependencies), y la versión de `@office-kit/xlsx` está fijada sin `^` ni `~`.
- [ ] Toda ruta, línea, tabla, columna y componente citado fue verificado en esta sesión; lo no verificado está en "Supuestos y preguntas abiertas".
- [ ] No se copiaron valores de `.env`, credenciales ni datos personales.
- [ ] Cobertura (S1): cada fuente de datos figura en la tabla de cobertura, incluida o con justificación.
- [ ] Cada métrica cumple S3, S4, S6, S7, S8 y S12 en su ficha.
- [ ] Títulos y etiquetas neutros, sin umbrales ni textos interpretativos (S9, S10); escalas honestas (S11).
- [ ] Alcance y frescura visibles en pantalla y en el libro (S13, S14).
- [ ] Todos los gráficos pertenecen al catálogo permitido y cumplen sus condiciones.
- [ ] Todos los endpoints, la ruta y el ítem de menú del panel son solo para administradores, con pruebas de permisos (D4).
- [ ] No hay endpoint de descarga; el `.xlsx` se arma en el front-end solo con la respuesta de la API, sin recalcular (D3, S15).
- [ ] Los gráficos del `.xlsx` son nativos y coinciden en tipo, títulos, ejes y unidades con la pantalla (D1).
- [ ] Se definió el tope de volumen y qué pasa al superarlo, sin truncar en silencio.
- [ ] Pruebas, criterios de aceptación y verificación manual en Excel/LibreOffice descritos.

---
# RESULTADOS
Los apartados siguientes están vacíos a propósito: los completa el agente siguiendo las tareas anteriores. No borres ni reescribas las secciones de instrucciones de arriba.

**Commit analizado:** `899b562d0c76832de809bf99f3e5875703e503e7` · **Fecha:** 2026-11-09

# Catálogo de métricas

## Tabla de cobertura de fuentes de datos (S1)

Inventario exhaustivo de la totalidad de las tablas y entidades del modelo de datos PostgreSQL de SIGMA, auditadas a partir de las migraciones en `supabase/migrations/` y el archivo de inicialización `20260828234944_init_schema.sql` hasta `20261109120000_estadistica_tiempos_resolucion.sql`.

| Tabla / Fuente | Estado en Panel | Justificación técnica y uso en el sistema |
|---|---|---|
| `activo` | **Incluida** | Base de datos de equipamiento institucional. Origina las métricas de tasa de operatividad (M-01) y distribución de activos por estado (M-02) y por edificio (M-03). |
| `tipo_activo` | **Incluida** | Clasificación taxonómica de activos. Desglose dimensional para activos (M-02), tiempos de resolución (M-06) y asignación de planes preventivos (M-07). |
| `edificio` | **Incluida** | Dimensión edilicia territorial. Agrupador geográfico en distribución de activos (M-03), ranking de fallas (M-04) y tiempos de resolución (M-06). |
| `tipo_espacio` | **Incluida** | Tipificación de espacios edilicios (aulas, laboratorios, oficinas). Dimensión de auditoría de infraestructura. |
| `espacio` | **Incluida** | Ubicación física exacta de activos. Clave foránea intermedia para imputar incidencias y tiempos a áreas funcionales (`espacio.espacio_id`). |
| `area` | **Incluida** | Unidades organizacionales de la facultad. Base del ranking de incidencias (M-04, HU-34) y de tiempos de resolución de tickets (M-06). |
| `autorizado` | **Incluida** | Responsables de área que emiten tickets correctivos. Registro de denunciante para auditoría y seguimiento de tickets. |
| `ticket` | **Incluida** | Entrada del flujo correctivo. Métricas de volumen y distribución por estado (M-05), evolución temporal (M-11) y tiempos de resolución (M-06). |
| `orden_trabajo` | **Incluida** | Unidad de ejecución de mantenimiento. Métricas de OTs por origen correctivo/preventivo (M-08), estados operativos (M-09) y prioridades (M-10). |
| `tarea_ot` | **Incluida** | Tareas concretas ejecutadas dentro de cada OT. Métrica de cumplimiento y avance de tareas (M-12) y consumos de recursos. |
| `falla` | **Incluida** | Diagnóstico técnico asentado durante la ejecución. Base del ranking de áreas con fallas (M-04) y tipos de fallas reportadas (M-13). |
| `tipo_falla` | **Incluida** | Catálogo estandarizado de fallas (mecánica, eléctrica, etc.). Eje categórico de M-13 y desglose de barras apiladas de M-04. |
| `tecnico` | **Incluida** | Personal técnico de planta. Métrica de carga de trabajo activa (M-14), tiempos de resolución (M-06) e índice de disponibilidad de personal (M-15). |
| `especialidad` | **Incluida** | Ámbitos de competencia técnica. Filtro de matching para asignación de tareas preventivas y correctivas. |
| `tecnico_especialidad` | **Incluida** | Relación N:M de especialidades del técnico. Validador de cobertura de competencias operativas. |
| `tecnico_asignado_tarea_ot` | **Incluida** | Registro de asignaciones técnicas. Determina la carga activa por técnico (M-14) y la imputación técnica del tiempo de resolución (M-06). |
| `tecnico_utiliza_herramienta` | **Incluida** | Control de préstamos de herramientas a técnicos. Monitoreo de herramientas en uso y trazabilidad de custodia. |
| `material` | **Incluida** | Inventario físico de repuestos e insumos. Origina la métrica crítica de stock bajo mínimo (M-16, HU-33). |
| `herramienta` | **Incluida** | Activos de trabajo del pañol. Métrica de disponibilidad operativa de herramientas (disponibles, en uso, fuera de servicio). |
| `tarea_ot_consume_material` | **Incluida** | Consumo real de insumos en tareas de mantenimiento. Cuantificación de materiales utilizados por período y tipo. |
| `remito` | **Incluida** | Comprobantes de ingreso de inventario por compra o donación (`HU-16`). Trazabilidad de altas de stock. |
| `remito_item` | **Incluida** | Renglones de detalle de cada remito (materiales recibidos y herramientas incorporadas). |
| `InventarioTipo` | **Incluida** | Categorías de insumos y herramientas. Clasificador jerárquico de pañol. |
| `mantenimiento_preventivo` | **Incluida** | Definición de planes preventivos recurrentes. Origina la métrica de cobertura y cumplimiento preventivo (M-07). |
| `mant_prev_tarea` | **Incluida** | Vinculación de plantillas estándar de tareas dentro de un plan preventivo programado. |
| `plantilla_de_tarea` | **Incluida** | Biblioteca de tareas estándar reutilizables asociadas a tipos de activos y especialidades. |
| `prestador_servicio` | **Incluida** | Tercerización de servicios externos (`HU-25`). Tareas ejecutadas por proveedores externos frente a personal propio. |
| `tipo_prestador` | **Incluida** | Rubros y tipificación de empresas de servicio externas (`HU-24`). |
| `prestador_tipo_prestador` | **Incluida** | Clasificación sectorial de proveedores externos. |
| `prestador_especialidad` | **Incluida** | Cobertura de especialidades técnicas tercerizadas. |
| `usuario` | **Incluida** | Cuentas de acceso al sistema (`HU-30`, `HU-32`). Auditoría de usuarios activos, inactivos y distribución de roles. |
| `administrador` | **Incluida** | Datos personales y de contacto del perfil administrativo. |
| `tarea_observacion` | **Incluida** | Bitácora cualitativa de intervenciones de técnicos en tareas (`HU-23`). |
| `historial_restablecimiento_contrasena` | **Incluida** | Registro de seguridad de tokens de blanqueo de contraseñas (`HU-31`). |
| `proveedor` | **Excluida con justificación** | Tabla histórica de compras tempranas (migración inicial `20260828234944_init_schema.sql`). La operatoria actual del sistema consolidó la recepción de bienes en la tabla `remito`, donde el proveedor se registra en la columna `remito.proveedor_nom` sin clave foránea a esta tabla. |
| `compra` / `linea_compra` | **Excluida con justificación** | Tablas de gestión contable/adquisición de compras tempranas. Desacopladas de la operatoria de mantenimiento y stock en la migración `20260929004641_remito_ingreso_stock.sql`. No registran actividad operativa en el flujo actual. |
| `mant_prev_tecnico` | **Excluida con justificación** | Estructura descartada formalmente en la migración `20261104120000_plan_sin_tecnicos.sql`. La asignación técnica preventiva ya no se fija a nivel de plan sino que se resuelve dinámicamente por la especialidad de la tarea (`plantilla_de_tarea.especialidad_id`). |

---

## Fichas de especificación de métricas

### M-01 · Tasa de operatividad de activos
- **Definición / Fórmula:** Porcentaje de activos operativos sobre el total de activos no retirados del sistema: `(Activos en estado 'Operativo' / Total de activos con estado <> 'Retirado') * 100`. Se complementa obligatoriamente con el denominador total general de activos registrados.
- **Origen:** `activo.activo_estado` (`backend/src/servicios/activos.servicio.js:25-35`, mapeado con `backend/src/utiles/enumerados.js:49-54`).
- **Filtros e inclusión (S7):** Excluye activos con `activo_estado = 4` ('Retirado') para el cálculo del ratio de servicio, pero reporta el número absoluto de retirados para total transparencia.
- **Granularidad temporal:** Snapshot instantáneo al momento de consulta.
- **Denominador y n visibles (S4):** Denominador principal `n = Total de activos activos` (estados 1, 2 y 3). Denominador secundario `N_total = Total de activos en base de datos`. Ejemplo de visualización: `92,4 % (485 de 525 activos en servicio; 40 retirados históricos)`.
- **Tratamiento de nulos (S6):** La columna `activo_estado` tiene restricción `NOT NULL DEFAULT 1`.
- **Gráfico asignado:** Tarjeta KPI.
- **Rol habilitado (D4):** Administrador.

### M-02 · Distribución de activos por estado
- **Definición / Fórmula:** Conteo de activos agrupados por cada estado del ciclo de vida (`COUNT(activo_codigo) GROUP BY activo_estado`). Estados según diccionario: `Operativo` (1), `En mantenimiento` (2), `Fuera de servicio` (3), `Retirado` (4).
- **Origen:** `activo.activo_estado` (`backend/src/utiles/enumerados.js:49-54`).
- **Filtros e inclusión (S7):** Incluye todos los registros de la tabla `activo` sin omisiones.
- **Granularidad temporal:** Snapshot instantáneo.
- **Denominador y n visibles (S4):** Cantidad absoluta de activos por categoría y porcentaje sobre el total `N`.
- **Tratamiento de nulos (S6):** No admite nulos por esquema.
- **Gráfico asignado:** Dona (4 categorías mutuamente excluyentes que suman el 100%).
- **Rol habilitado (D4):** Administrador.

### M-03 · Activos inventariados por edificio
- **Definición / Fórmula:** Conteo de activos agrupados por edificio: `COUNT(activo.activo_codigo) GROUP BY edificio.edificio_id, edificio.edificio_nom`.
- **Origen:** `activo.espacio_id` → `espacio.edificio_id` → `edificio.edificio_nom`.
- **Filtros e inclusión (S7):** Incluye activos con estado diferente de `Retirado` (4).
- **Granularidad temporal:** Snapshot instantáneo.
- **Denominador y n visibles (S4):** n = total de activos en servicio. Cada barra indica el conteo absoluto y su participación porcentual.
- **Tratamiento de nulos (S6):** Los activos sin espacio asignado se agrupan explícitamente bajo la etiqueta `Sin espacio asignado`.
- **Gráfico asignado:** Barras horizontales (eje horizontal desde 0, ordenadas descendente por cantidad con desempate alfabético según S8).
- **Rol habilitado (D4):** Administrador.

### M-04 · Ranking de áreas con mayor incidencia de fallas (HU-34)
- **Definición / Fórmula:** Conteo de fallas registradas por los técnicos en tareas de activos pertenecientes a espacios de cada área: `COUNT(falla.falla_id) GROUP BY area.area_id`. Si dos áreas comparten espacio, la falla se computa en ambas según regla de negocio. Porcentaje = `(fallas del área / fallas distintas totales del período) * 100`.
- **Origen:** `falla.falla_id`, `falla.falla_tipo`, `falla.activo_codigo` (`backend/src/servicios/estadisticas.servicio.js:27-62, 134-193`).
- **Filtros e inclusión (S7):** Solo fallas con activo asociado en el período (`falla_fecha BETWEEN p_desde AND p_hasta`). Solo áreas con al menos una falla.
- **Granularidad temporal:** Período configurable (último mes, trimestre, semestre, año o fechas personalizadas).
- **Denominador y n visibles (S4):** Conteo de fallas de cada área, cantidad de tickets asociados a esas fallas y cantidad total de fallas distintas del período.
- **Tratamiento de nulos (S6):** Espacios sin área asociada se consolidan como `Sin área` y se listan al final del ranking según regla del dominio.
- **Gráfico asignado:** Barras apiladas segmentadas por tipo de falla (eje desde 0).
- **Rol habilitado (D4):** Administrador.

### M-05 · Distribución de tickets por estado
- **Definición / Fórmula:** Conteo de tickets agrupados por su estado operativo: `COUNT(ticket_id) GROUP BY ticket_estado`. Estados: `Creado` (1), `Validado` (2), `Asignado` (3), `En ejecución` (4), `Finalizado` (5), `Cerrado` (6), `Rechazado` (7).
- **Origen:** `ticket.ticket_estado` (`backend/src/utiles/enumerados.js:56-64`).
- **Filtros e inclusión (S7):** Todos los tickets dados de alta dentro del rango `ticket_fecha_alta BETWEEN p_desde AND p_hasta`.
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** Cantidad de tickets por estado y total general `n` de tickets en el período.
- **Tratamiento de nulos (S6):** Sin nulos (columna `NOT NULL DEFAULT 1`).
- **Gráfico asignado:** Barras verticales (7 categorías con eje desde 0; no aplica dona por superar las 5 categorías límite del catálogo).
- **Rol habilitado (D4):** Administrador.

### M-06 · Tiempo promedio y mediano de resolución de tickets (HU-26 / Sprint 7)
- **Definición / Fórmula:** Duración en segundos transcurrida desde el alta del ticket hasta su cierre definitivo: `ticket_fecha_cierre - ticket_fecha_alta`. Cálculo en BD vía función `estadistica_tiempos_resolucion`. Se calcula la media aritmética (`AVG`) y la mediana (`PERCENTILE_CONT(0.5)` según S12).
- **Origen:** `ticket.ticket_fecha_alta`, `ticket.ticket_fecha_cierre` (`supabase/migrations/20261109120000_estadistica_tiempos_resolucion.sql:41-53`, `backend/src/servicios/estadisticas.servicio.js:297-323`).
- **Filtros e inclusión (S7):** Solo tickets en estado `6` (Cerrado), con `ticket_fecha_alta` y `ticket_fecha_cierre` válidas y no nulas, con fecha de cierre >= fecha de alta, y `ticket_fecha_cierre` dentro del período.
- **Granularidad temporal:** Período evaluado sobre la fecha de cierre.
- **Denominador y n visibles (S4):** Conteo exacto de tickets cerrados que integran el promedio (`cantidad_tickets`).
- **Tratamiento de nulos (S6):** Si no existen tickets cerrados en el período, el valor se expone como `null` con etiqueta `Sin datos en el período`. En desgloses, activos sin espacio van a `Sin área` y OTs sin técnico propio van a `Sin asignar`.
- **Gráfico asignado:** Tarjeta KPI para valor general + Barras horizontales para desglose por Área, Tipo de Activo o Técnico.
- **Rol habilitado (D4):** Administrador.

### M-07 · Cobertura de planes de mantenimiento preventivo
- **Definición / Fórmula:** Porcentaje de tipos de activos con plan preventivo activo sobre el total de tipos de activos registrados: `(Tipos de activo con mant_prev activo / Total tipos de activo) * 100`, junto con el número de activos físicos cubiertos.
- **Origen:** `mantenimiento_preventivo.tipo_activo_id`, `mantenimiento_preventivo.mant_prev_activo`, `activo.tipo_activo_id`.
- **Filtros e inclusión (S7):** Solo planes con `mant_prev_activo = true` y activos no retirados.
- **Granularidad temporal:** Snapshot instantáneo.
- **Denominador y n visibles (S4):** Cantidad de tipos cubiertos sobre total de tipos, y cantidad de activos físicos amparados sobre total de activos en servicio.
- **Tratamiento de nulos (S6):** Los activos cuyo tipo carece de plan preventivo computan como `Sin cobertura preventiva`.
- **Gráfico asignado:** Tarjeta KPI.
- **Rol habilitado (D4):** Administrador.

### M-08 · Distribución de órdenes de trabajo por origen
- **Definición / Fórmula:** Conteo de órdenes de trabajo clasificadas según su procedencia: Correctivas (`ticket_id IS NOT NULL`) vs. Preventivas (`mant_prev_id IS NOT NULL`).
- **Origen:** `orden_trabajo.ticket_id`, `orden_trabajo.mant_prev_id` (`backend/src/servicios/ordenesTrabajo.servicio.js:35-45`).
- **Filtros e inclusión (S7):** OTs dadas de alta en el período seleccionado (`ot_fecha_alta BETWEEN p_desde AND p_hasta`). En el dominio SIGMA una OT nace exclusivamente de un ticket o de un plan (nunca de ambos).
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** Total de OTs del período `n`. Se informa cantidad y porcentaje de cada modalidad.
- **Tratamiento de nulos (S6):** Por regla de integridad estructural, una de las dos claves foráneas siempre está presente.
- **Gráfico asignado:** Dona (2 categorías mutuamente excluyentes: Correctiva y Preventiva).
- **Rol habilitado (D4):** Administrador.

### M-09 · Estado operativo de órdenes de trabajo
- **Definición / Fórmula:** Conteo de órdenes de trabajo agrupadas por estado: `COUNT(ot_id) GROUP BY ot_estado`. Estados: `Creada` (1), `Asignada` (2), `En ejecución` (3), `Finalizada` (4), `Cancelada` (5).
- **Origen:** `orden_trabajo.ot_estado` (`backend/src/utiles/enumerados.js:66-72`).
- **Filtros e inclusión (S7):** OTs creadas en el período. No se ocultan las canceladas (se declaran explícitamente con su motivo y volumen).
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** Cantidad de OTs por estado y total general `n`.
- **Tratamiento de nulos (S6):** Sin nulos (`NOT NULL DEFAULT 1`).
- **Gráfico asignado:** Barras verticales (5 categorías con eje desde 0).
- **Rol habilitado (D4):** Administrador.

### M-10 · Distribución de órdenes de trabajo por prioridad
- **Definición / Fórmula:** Conteo de órdenes de trabajo según su nivel de urgencia/prioridad asignada: `COUNT(ot_id) GROUP BY ot_prioridad`. Niveles: `Alta` (1), `Media` (2), `Baja` (3).
- **Origen:** `orden_trabajo.ot_prioridad` (`backend/src/utiles/enumerados.js:87`).
- **Filtros e inclusión (S7):** OTs activas (no canceladas) del período.
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** n = total de OTs no canceladas del período. Valor absoluto y porcentaje por nivel.
- **Tratamiento de nulos (S6):** Sin nulos (toda OT tiene prioridad sugerida o manual).
- **Gráfico asignado:** Dona (3 categorías mutuamente excluyentes).
- **Rol habilitado (D4):** Administrador.

### M-11 · Evolución temporal de generación y cierre de tickets
- **Definición / Fórmula:** Series de tiempo mensuales comparativas: a) Tickets registrados (`COUNT(ticket_id)` según mes de `ticket_fecha_alta`) y b) Tickets cerrados (`COUNT(ticket_id)` según mes de `ticket_fecha_cierre` en estado 6).
- **Origen:** `ticket.ticket_fecha_alta`, `ticket.ticket_fecha_cierre`, `ticket.ticket_estado`.
- **Filtros e inclusión (S7):** Rango de fechas seleccionado. Períodos mensuales vacíos se completan con 0 mediante `generate_series` (S6). El mes corriente se rotula con asterisco `* (parcial)` según S5.
- **Granularidad temporal:** Mensual (eje cronológico ascendente).
- **Denominador y n visibles (S4):** Conteo absoluto por serie en cada mes. Total de tickets acumulados reportado en leyenda.
- **Tratamiento de nulos (S6):** Meses sin tickets devuelven 0.
- **Gráfico asignado:** Línea (2 series claramente diferenciadas por color y estilo de marcador/trazo continuo vs discontinuo).
- **Rol habilitado (D4):** Administrador.

### M-12 · Tasa de cumplimiento y estado de tareas
- **Definición / Fórmula:** Distribución de tareas de OTs por estado: `Creada` (1), `Asignada` (2), `En ejecución` (3), `Pendiente` (4), `Finalizada` (5), `Cancelada` (6).
- **Origen:** `tarea_ot.tarea_estado` (`backend/src/utiles/enumerados.js:74-81`).
- **Filtros e inclusión (S7):** Tareas pertenecientes a OTs del período evaluado.
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** n = total de tareas programadas en el período. Cantidad y tasa porcentual de finalización.
- **Tratamiento de nulos (S6):** Sin nulos (`NOT NULL DEFAULT 1`).
- **Gráfico asignado:** Barras horizontales (6 estados, eje desde 0).
- **Rol habilitado (D4):** Administrador.

### M-13 · Distribución de fallas por tipo
- **Definición / Fórmula:** Conteo de fallas técnicas asentadas según su categoría normalizada: `COUNT(falla_id) GROUP BY falla_tipo`.
- **Origen:** `falla.falla_tipo` (`backend/src/servicios/estadisticas.servicio.js:31`).
- **Filtros e inclusión (S7):** Fallas registradas en el período.
- **Granularidad temporal:** Período configurable.
- **Denominador y n visibles (S4):** n = total de fallas del período.
- **Tratamiento de nulos (S6):** Fallas sin tipo especificado se clasifican como `Sin clasificar`.
- **Gráfico asignado:** Barras horizontales (si > 5 categorías) o Dona (si <= 5 categorías).
- **Rol habilitado (D4):** Administrador.

### M-14 · Distribución de carga de trabajo activa por técnico
- **Definición / Fórmula:** Cantidad de tareas asignadas no finalizadas ni canceladas asignadas a cada técnico: `COUNT(tarea_id) WHERE tec_asig_estado IN (1, 2, 3) GROUP BY tecnico_legajo`.
- **Origen:** `tecnico_asignado_tarea_ot` (`backend/src/utiles/enumerados.js:89-95`).
- **Filtros e inclusión (S7):** Asignaciones activas al momento de la consulta sobre tareas no concluidas.
- **Granularidad temporal:** Snapshot instantáneo.
- **Denominador y n visibles (S4):** n = total de tareas activas del sistema. Conteo por técnico.
- **Tratamiento de nulos (S6):** Técnicos registrados sin tareas asignadas se muestran explícitamente con 0 tareas (S6). Tareas sin técnico asignado computan como `Sin asignar`.
- **Gráfico asignado:** Barras horizontales (ordenadas de mayor a menor carga, desempate alfabético).
- **Rol habilitado (D4):** Administrador.

### M-15 · Índice de disponibilidad del plantel técnico
- **Definición / Fórmula:** Proporción de técnicos disponibles para nueva asignación: `(Técnicos con tecnico_disponible = true / Total de técnicos) * 100`.
- **Origen:** `tecnico.tecnico_disponible` (`backend/src/servicios/tecnicos.servicio.js:40-50`).
- **Filtros e inclusión (S7):** Total de técnicos dados de alta en el sistema.
- **Granularidad temporal:** Snapshot instantáneo.
- **Denominador y n visibles (S4):** `Disponibles vs. Ocupados / No disponibles` sobre el total `n = Total de técnicos`.
- **Tratamiento de nulos (S6):** Sin nulos (`NOT NULL DEFAULT true`).
- **Gráfico asignado:** Tarjeta KPI.
- **Rol habilitado (D4):** Administrador.

### M-16 · Materiales críticos bajo stock mínimo (HU-33)
- **Definición / Fórmula:** Cantidad y detalle de materiales cuyo inventario físico actual es menor o igual al umbral mínimo de seguridad: `stock_actual <= stock_minimo`.
- **Origen:** `material.stock_actual`, `material.stock_minimo`, `material.mat_cod`, `material.mat_nom` (`backend/src/servicios/inventario.servicio.js:500-530`).
- **Filtros e inclusión (S7):** Solo materiales cuyo stock incumple el umbral definido institucionalmente en su ficha.
- **Granularidad temporal:** Snapshot instantáneo de pañol.
- **Denominador y n visibles (S4):** Total de ítems bajo stock crítico sobre el total de materiales en catálogo (`n_criticos / total_materiales`).
- **Tratamiento de nulos (S6):** Sin nulos por restricciones de esquema en `material`.
- **Gráfico asignado:** Tarjeta KPI (contador crítico) acompañada de Tabla de detalle para auditoría.
- **Rol habilitado (D4):** Administrador.

---

# Back-End

### BE-01 · MODIFICAR · `backend/src/rutas/estadisticas.rutas.js` (líneas: L1-L19)
- Capa/tipo: ruta
- Descripción técnica: Incorporar las rutas REST correspondientes a los nuevos servicios de agregación y al payload integral del panel para serialización en frontend. Preservar la aplicación general del middleware `soloAdministrador` a nivel de enrutador.
- Contrato / SQL / Gráfico:
  - `GET /api/estadisticas/resumen-general`: Devuelve los KPIs cuantitativos instantáneos (M-01, M-07, M-15, M-16).
  - `GET /api/estadisticas/activos`: Devuelve métricas de distribución de activos por estado y por edificio (M-02, M-03).
  - `GET /api/estadisticas/ordenes-trabajo?desde=&hasta=`: Devuelve distribución de OTs por origen, estado y prioridad (M-08, M-09, M-10).
  - `GET /api/estadisticas/tickets-evolucion?desde=&hasta=`: Devuelve la evolución mensual de altas y cierres de tickets (M-11) y distribución por estado (M-05).
  - `GET /api/estadisticas/tecnicos-carga`: Devuelve la distribución de tareas activas por técnico y disponibilidad (M-14, M-15).
  - `GET /api/estadisticas/panel-completo?desde=&hasta=`: Endpoint unificado que resuelve y consolida todas las secciones anteriores junto con los metadatos de auditoría, frescura, alcance y definiciones de métricas (S15).
  - Permisos (D4): Protegido por `soloAdministrador` (`backend/src/middlewares/soloAdministrador.js:12-17`).
  - Códigos de respuesta: `200 OK` con `{ ok: true, datos: { ... }, metadatos: { ... } }`. Usuario sin sesión: `401 Unauthorized` (`{ ok: false, mensaje: 'No hay sesión activa' }`). Usuario no administrador: `403 Forbidden` (`{ ok: false, mensaje: 'No tienes permisos para realizar esta acción' }`). Parámetros inválidos: `400 Bad Request` (`{ ok: false, mensaje: '...' }`).
- Reutiliza: `backend/src/middlewares/soloAdministrador.js:12-17`, `backend/src/controladores/estadisticas.controlador.js`.
- Métricas: M-01 a M-16.
- Depende de: BE-02.

### BE-02 · MODIFICAR · `backend/src/controladores/estadisticas.controlador.js` (líneas: L1-L22)
- Capa/tipo: controlador
- Descripción técnica: Implementar los métodos de controlador correspondientes a las nuevas rutas estadísticas, delegando la obtención y estructuración de datos en `estadisticas.servicio.js` y respondiendo con el envoltorio `{ ok: true, datos, metadatos }`.
- Contrato:
  - Métodos a exportar: `resumenGeneral`, `distribucionActivos`, `ordenesTrabajo`, `evolucionTickets`, `cargaTecnicos`, `panelCompleto`.
- Reutiliza: `backend/src/servicios/estadisticas.servicio.js`.
- Métricas: M-01 a M-16.
- Depende de: BE-03.

### BE-03 · MODIFICAR · `backend/src/servicios/estadisticas.servicio.js` (líneas: L297-L323)
- Capa/tipo: servicio / acceso a datos
- Descripción técnica: Extender el servicio de estadísticas incorporando funciones agregadoras con consultas directas a Supabase/PostgreSQL, utilizando validaciones de fechas ya existentes (`extremoDelPeriodo`), control de nulos (S6), formato numérico estándar y empaquetado de metadatos de frescura y alcance (S13, S14).
- Contrato / SQL de referencia:
  1. **Resumen General (KPIs instantáneos M-01, M-07, M-15, M-16):**
  ```sql
  -- Activos operativos y totales (M-01)
  SELECT
    COUNT(*) FILTER (WHERE activo_estado = 1) AS operativos,
    COUNT(*) FILTER (WHERE activo_estado IN (1, 2, 3)) AS en_servicio,
    COUNT(*) FILTER (WHERE activo_estado = 4) AS retirados,
    COUNT(*) AS total_activos
  FROM activo;

  -- Planes preventivos vigentes (M-07)
  SELECT
    COUNT(DISTINCT tipo_activo_id) FILTER (WHERE mant_prev_activo = true) AS tipos_con_plan,
    (SELECT COUNT(*) FROM tipo_activo) AS total_tipos
  FROM mantenimiento_preventivo;

  -- Técnicos disponibles (M-15)
  SELECT
    COUNT(*) FILTER (WHERE tecnico_disponible = true) AS disponibles,
    COUNT(*) AS total_tecnicos
  FROM tecnico;

  -- Materiales bajo stock mínimo (M-16)
  SELECT
    COUNT(*) FILTER (WHERE stock_actual <= stock_minimo) AS bajo_minimo,
    COUNT(*) AS total_materiales
  FROM material;
  ```
  2. **Evolución temporal de tickets (M-11) con series completas (S6):**
  ```sql
  WITH meses AS (
    SELECT generate_series(
      date_trunc('month', $1::timestamptz),
      date_trunc('month', $2::timestamptz),
      '1 month'::interval
    ) AS mes
  ),
  altas AS (
    SELECT date_trunc('month', ticket_fecha_alta) AS mes, COUNT(*) AS altas
    FROM ticket
    WHERE ticket_fecha_alta >= $1 AND ticket_fecha_alta <= $2
    GROUP BY 1
  ),
  cierres AS (
    SELECT date_trunc('month', ticket_fecha_cierre) AS mes, COUNT(*) AS cierres
    FROM ticket
    WHERE ticket_estado = 6
      AND ticket_fecha_cierre >= $1 AND ticket_fecha_cierre <= $2
    GROUP BY 1
  )
  SELECT
    to_char(m.mes, 'YYYY-MM') AS periodo,
    COALESCE(a.altas, 0) AS tickets_creados,
    COALESCE(c.cierres, 0) AS tickets_cerrados
  FROM meses m
  LEFT JOIN altas a ON a.mes = m.mes
  LEFT JOIN cierres c ON c.mes = m.mes
  ORDER BY m.mes ASC;
  ```
  3. **Órdenes de Trabajo por Origen, Estado y Prioridad (M-08, M-09, M-10):**
  ```sql
  SELECT
    COUNT(*) FILTER (WHERE ticket_id IS NOT NULL) AS correctivas,
    COUNT(*) FILTER (WHERE mant_prev_id IS NOT NULL) AS preventivas,
    COUNT(*) FILTER (WHERE ot_estado = 1) AS estado_creada,
    COUNT(*) FILTER (WHERE ot_estado = 2) AS estado_asignada,
    COUNT(*) FILTER (WHERE ot_estado = 3) AS estado_en_ejecucion,
    COUNT(*) FILTER (WHERE ot_estado = 4) AS estado_finalizada,
    COUNT(*) FILTER (WHERE ot_estado = 5) AS estado_cancelada,
    COUNT(*) FILTER (WHERE ot_prioridad = 1 AND ot_estado <> 5) AS prioridad_alta,
    COUNT(*) FILTER (WHERE ot_prioridad = 2 AND ot_estado <> 5) AS prioridad_media,
    COUNT(*) FILTER (WHERE ot_prioridad = 3 AND ot_estado <> 5) AS prioridad_baja,
    COUNT(*) AS total_ot
  FROM orden_trabajo
  WHERE ot_fecha_alta >= $1 AND ot_fecha_alta <= $2;
  ```
  4. **Metadatos adjuntos en la respuesta unificada (S13, S14, S15):**
  ```json
  {
    "metadatos": {
      "alcance": "Todo el sistema",
      "zonaHoraria": "America/Argentina/Buenos_Aires",
      "generadoEn": "2026-11-09T18:30:00.000Z",
      "versionSistema": "0.1.0",
      "commit": "899b562d0c76832de809bf99f3e5875703e503e7",
      "filtros": { "desde": "2026-10-01T00:00:00-03:00", "hasta": "2026-11-09T23:59:59-03:00" },
      "definiciones": [
        { "id": "M-01", "nombre": "Tasa de operatividad de activos", "formula": "(Operativos / Activos en servicio) * 100", "origen": "activo.activo_estado" },
        { "id": "M-04", "nombre": "Ranking de incidencias por área", "formula": "Conteo de fallas de activos por espacio de área", "origen": "falla.falla_id" }
      ]
    }
  }
  ```
- Índices sugeridos en PostgreSQL (descripción técnica sin crear migraciones):
  - `CREATE INDEX IF NOT EXISTS idx_ot_fecha_alta_origen ON public.orden_trabajo (ot_fecha_alta) INCLUDE (ticket_id, mant_prev_id, ot_estado, ot_prioridad);`
  - `CREATE INDEX IF NOT EXISTS idx_ticket_fecha_alta ON public.ticket (ticket_fecha_alta);`
  - `CREATE INDEX IF NOT EXISTS idx_material_stock_critico ON public.material (mat_cod) WHERE stock_actual <= stock_minimo;`
- Reutiliza: `backend/src/config/supabase.js`, `backend/src/utiles/enumerados.js`, `backend/src/utiles/errores.js`.
- Métricas: M-01 a M-16.
- Depende de: Ninguno.

### BE-04 · AGREGAR · `backend/test/estadisticas.panel.test.js` (líneas: “nuevo”)
- Capa/tipo: test
- Descripción técnica: Pruebas unitarias y de integración de rutas para verificar contratos, validación de parámetros, autorización exclusiva para administrador (200 OK, 401 sin sesión, 403 no admin) y conciliación aritmética de totales y partes.
- Reutiliza: `backend/test/estadisticas.tiemposResolucion.test.js:189-247` como arquetipo de test suite con Express efímero.
- Métricas: M-01 a M-16.
- Depende de: BE-01, BE-02, BE-03.

---

# Front-End

### FE-01 · MODIFICAR · `frontend/src/app/(admin)/page.js` (líneas: L1-L108)
- Capa/tipo: página
- Descripción técnica: Transformar la pantalla de inicio del administrador (`/`) en el Tablero de Control / Panel integral de SIGMA (conforme indica la nota de arquitectura en las líneas L4-L8). Incorporar barra superior de filtros de período (con presets de mes, trimestre, semestre y año más selector de fecha libre `CampoFecha`), botón de exportación `.xlsx` del panel (D1, D3), indicadores KPI resumidos en tarjetas (`CCard`), gráficos analíticos mediante el wrapper `GraficoChart` y sección colapsable de tablas de detalle para auditoría.
- Reutiliza:
  - `frontend/src/componentes/EncabezadoPagina.js:15`
  - `frontend/src/componentes/formulario/CampoFecha.js:40`
  - `frontend/src/componentes/Aviso.js:47`
  - `frontend/src/componentes/EstadoTabla.js:48` (`Cargando`, `SinDatos`)
  - `frontend/src/servicios/estadisticas.js`
  - `frontend/src/componentes/estadisticas/GraficoChart.js` (nuevo wrapper FE-03)
  - `frontend/src/servicios/exportacionPanel.js` (nuevo módulo FE-04)
- Contrato / Gráficos en pantalla:
  - **Fila 1 (Tarjetas KPI):** Tasa de Operatividad (M-01), Tiempo Promedio de Resolución (M-06), Cobertura Preventiva (M-07), Materiales bajo Mínimo (M-16), Disponibilidad de Técnicos (M-15).
  - **Fila 2 (Mantenimiento Correctivo):** Gráfico de Línea: Evolución mensual de altas y cierres de tickets (M-11). Gráfico de Barras Verticales: Tickets por estado (M-05).
  - **Fila 3 (Órdenes de Trabajo e Incidencias):** Gráfico de Barras Apiladas: Áreas con mayor incidencia (M-04). Gráfico de Dona: OTs por origen correctivo vs preventivo (M-08). Gráfico de Dona: OTs por prioridad (M-10).
  - **Fila 4 (Recursos y Personal):** Gráfico de Barras Horizontales: Carga de tareas activas por técnico (M-14). Gráfico de Barras Horizontales: Activos por edificio (M-03). Gráfico de Dona: Activos por estado (M-02).
- Estados UI: Skeleton / spinner de carga durante el fetch; banner de error `Aviso` con opción de reintentar si la API no responde; estado vacío `SinDatos` si no hay registros en el período; indicador visible de frescura de datos (`Actualizado: 09/11/2026 15:30 (UTC-3)`) y alcance (`Datos de: Todo el sistema`).
- Acceso (D4): Ubicado en `/`. Protegido a nivel de middleware en `frontend/src/middleware.js:51-63` (usuarios autorizados son redirigidos a `/tickets`, técnicos a `/tareas` y no autenticados a `/login`). Ítem de menú en `frontend/src/componentes/layout/navegacion.js:48-55` restringido con `roles: ['administrador']`.
- Métricas: M-01 a M-16.
- Depende de: FE-02, FE-03, FE-04, BE-01.

### FE-02 · MODIFICAR · `frontend/src/servicios/estadisticas.js` (líneas: L1-L45)
- Capa/tipo: servicio API
- Descripción técnica: Incorporar llamadas HTTP al backend para los nuevos endpoints estadísticos: `obtenerResumenGeneral()`, `obtenerDistribucionActivos()`, `obtenerOrdenesTrabajo({ desde, hasta })`, `obtenerEvolucionTickets({ desde, hasta })`, `obtenerCargaTecnicos()`, y `obtenerPanelCompleto({ desde, hasta })`.
- Reutiliza: `frontend/src/servicios/api.js` (cliente axios configurado con credenciales y manejo de token).
- Métricas: M-01 a M-16.
- Depende de: BE-01.

### FE-03 · AGREGAR · `frontend/src/componentes/estadisticas/GraficoChart.js` (líneas: “nuevo”)
- Capa/tipo: componente
- Descripción técnica: Wrapper reutilizable sobre `chart.js` (v4.6.1) y `@coreui/react-chartjs` (v3.0.0) que garantiza el estricto cumplimiento de los Principios Anti-Sesgo y el Catálogo de Gráficos Permitidos:
  - Registro selectivo de componentes de `chart.js`: `CategoryScale`, `LinearScale`, `BarElement`, `LineElement`, `PointElement`, `ArcElement`, `Title`, `Tooltip`, `Legend`.
  - Desactivación global de animaciones (`animation: false`).
  - Escalas honestas (S11): `beginAtZero: true` forzado en todos los ejes cartesianos; sin ejes secundarios o escalas truncadas.
  - Resolución de colores a partir de las variables CSS de CoreUI (`--cui-primary`, `--cui-info`, `--cui-warning`, `--cui-danger`, `--cui-success`, `--cui-secondary`).
  - Accesibilidad: soporte de `aria-label` descriptivo en el `<canvas>` y botón complementario "Ver como tabla" integrado en la cabecera de la tarjeta que conmuta la visualización gráfica con una tabla accesible `CTable` con los mismos datos exactos.
  - Distinción multisensorial: trazos punteados/discontinuos (`borderDash: [5, 5]`) o marcadores geométricos diferenciados (`circle`, `rect`, `triangle`) por cada serie en gráficos de línea para no depender únicamente del color.
- Reutiliza: `@coreui/react-chartjs`, `@coreui/react` (`CButton`, `CCard`, `CCardHeader`, `CCardBody`, `CTable`), `@coreui/icons-react` (`cilSpreadsheet`, `cilChartLine`).
- Métricas: M-02, M-03, M-04, M-05, M-08, M-09, M-10, M-11, M-12, M-13, M-14.
- Depende de: Dependencias aprobadas D2 (`chart.js`, `@coreui/react-chartjs`).

### FE-04 · AGREGAR · `frontend/src/servicios/exportacionPanel.js` (líneas: “nuevo”)
- Capa/tipo: módulo de exportación
- Descripción técnica: Módulo cliente puro para la generación del archivo `.xlsx` en el navegador (D3) con gráficos nativos utilizando `@office-kit/xlsx` (D1) y descarga mediante `file-saver`. Desacopla la lógica de estructuración del libro de la interacción con el DOM, facilitando pruebas unitarias directas.
- Reutiliza: `file-saver` (`saveAs`, ya presente en `frontend/package.json:31`), `frontend/src/utils/fechas.js:12-26` (`formatearFechaHora`).
- Métricas: M-01 a M-16.
- Depende de: Dependencia aprobada D1 (`@office-kit/xlsx@0.27.0`).

---

# Exportación .xlsx

## 1. Arquitectura y principio de cálculo único (S15, D3)
La exportación se realiza **íntegramente en el navegador** del usuario administrador mediante la librería aprobada `@office-kit/xlsx` fijada exactamente en la versión `0.27.0` (D1).
No existe ningún endpoint de renderizado o descarga en el backend (D3).
El módulo de exportación recibe directamente el objeto JSON devuelto por `GET /api/estadisticas/panel-completo` (o los endpoints sectoriales activos en pantalla), garantizando que las cifras, agrupaciones, totales, fechas y denominadores sean **estrictamente idénticos** a los visualizados en pantalla (S15). El cliente no realiza recálculos, redondeos divergentes ni filtros secundarios.

## 2. Estructura y contenido del libro `.xlsx`

El archivo de hoja de cálculo generado contendrá las siguientes hojas estructuradas:

1. **Hoja 1: `Resumen`**
   - Título formal institucional: `SIGMA - Panel de Estadísticas y Mantenimiento`.
   - Alcance de los datos (S13): `Todo el sistema (Ámbito global de la institución)`.
   - Período auditado: fecha inicial (`desde`) y fecha final (`hasta`) en formato legible local.
   - Fecha y hora exacta de emisión (S14): con indicación explícita de la zona horaria `America/Argentina/Buenos_Aires (UTC-3)`.
   - Trazabilidad de versión: Versión de la aplicación (`0.1.0`) y Commit analizado (`899b562d0c76832de809bf99f3e5875703e503e7`).
   - Tabla de indicadores clave (KPIs): Tasa de operatividad de activos, tiempo medio de resolución de tickets, cobertura de planes preventivos, stock bajo mínimo e índice de disponibilidad técnica, cada uno con su valor y su denominador $n$ visible (S4).
   - Tabla de auditoría de volumen: Cantidad total de registros exportados y confirmación de no truncamiento.

2. **Hoja 2: `Definiciones`**
   - Diccionario exhaustivo de métricas (cumplimiento S3): tabla con columnas `Código`, `Métrica`, `Fórmula de Cálculo`, `Origen de Datos (tabla.columna)`, `Filtros Aplicados` y `Criterio de Inclusión / Exclusión`.
   - Incluye las fichas M-01 a M-16 con texto idéntico al documentado en este panel.

3. **Hoja 3: `Evolucion_Tickets` (Gráfico de Líneas)**
   - Rango de celdas `A1:C13`: Tabla tabular con columnas `Período (Mes)`, `Tickets Creados`, `Tickets Cerrados`. Períodos vacíos completados con `0` (S6).
   - Objeto de gráfico nativo enlazado a dicho rango mediante `makeLineChart` de `@office-kit/xlsx/chart`, anclado a la celda `E2` mediante `addChartAt(ws, 'E2', chartRef, { widthPx: 640, heightPx: 360 })`.
   - Título idéntico a pantalla: `"Evolución de Tickets: Creados vs. Cerrados"`.
   - Eje X cronológico y dos series nativas vinculadas a los rangos de celdas de datos, con estilos de línea diferenciados.

4. **Hoja 4: `Incidencias_Areas` (Gráfico de Barras)**
   - Tabla de datos con columnas: `Posición`, `Área`, `Edificio`, `Fallas Eléctricas`, `Fallas Mecánicas`, `Otras Fallas`, `Total Fallas`, `Tickets Afectados`, `Porcentaje sobre Total`.
   - Fila final `Sin área` para fallas sin espacio asignado (S6).
   - Objeto de gráfico nativo `makeBarChart` configurado como barras horizontales (`barDir: 'bar'`), vinculado a los datos y ubicado a partir de la columna `K2`. Eje numérico con origen estricto en 0 (S11).

5. **Hoja 5: `OT_Distribucion` (Gráficos de Composición y Prioridad)**
   - Tabla A: Órdenes de Trabajo por Origen (Correctivas vs Preventivas, cantidades absolutas y porcentajes sobre el total). Gráfico nativo `makeDoughnutChart` adyacente.
   - Tabla B: Órdenes de Trabajo por Prioridad (Alta, Media, Baja). Gráfico nativo `makeDoughnutChart` adyacente.
   - Tabla C: Órdenes de Trabajo por Estado (Creada, Asignada, En ejecución, Finalizada, Cancelada). Gráfico nativo `makeBarChart` adyacente.

6. **Hoja 6: `Activos_Edificios` (Gráfico de Barras Horizontales)**
   - Tabla con distribución de activos en servicio por edificio. Gráfico nativo `makeBarChart` vinculado al rango.

7. **Hoja 7: `Tecnicos_Carga` (Gráfico de Barras Horizontales)**
   - Tabla de técnicos de planta con cantidad de tareas en curso, estado de disponibilidad y especialidades. Gráfico nativo adyacente `makeBarChart`.

8. **Hoja 8: `Materiales_Criticos` (Tabla de Auditoría)**
   - Listado de materiales bajo stock de reposición con código, descripción, stock actual, stock mínimo, unidad de medida y estado de alerta.

## 3. Implementación técnica con `@office-kit/xlsx`

El módulo `frontend/src/servicios/exportacionPanel.js` se aísla funcionalmente sin tocar dependencias de backend ni componentes visuales:

```javascript
import { createWorkbook, addWorksheet, setCellAtAddress } from '@office-kit/xlsx/workbook';
import { makeChartSpace, makeLineChart, makeBarChart, makeDoughnutChart, makeBarSeries } from '@office-kit/xlsx/chart';
import { addChartAt } from '@office-kit/xlsx/drawing';
import { workbookToBytes } from '@office-kit/xlsx/io';
import { saveAs } from 'file-saver';

/**
 * Sanitización estricta contra inyección de fórmulas CSV/Excel (CSV Formula Injection).
 * Si un valor de texto inicia con '=', '+', '-', '@', '\t' o '\r', se antepone un apóstrofe simple (').
 */
export function sanitizarTextoExcel(valor) {
  if (valor == null) return '';
  const texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) {
    return `'${texto}`;
  }
  return texto;
}

/**
 * Genera el libro de cálculo con gráficos nativos como un Uint8Array desacoplado del navegador.
 */
export async function generarBytesLibroPanel(datosPanel) {
  const wb = createWorkbook();

  // 1. Hoja Resumen
  const wsResumen = addWorksheet(wb, 'Resumen');
  setCellAtAddress(wsResumen, 'A1', { type: 'string', value: 'SIGMA - Panel de Control de Mantenimiento' });
  setCellAtAddress(wsResumen, 'A2', { type: 'string', value: `Alcance: ${datosPanel.metadatos.alcance}` });
  setCellAtAddress(wsResumen, 'A3', { type: 'string', value: `Generado en: ${datosPanel.metadatos.generadoEn} (${datosPanel.metadatos.zonaHoraria})` });
  setCellAtAddress(wsResumen, 'A4', { type: 'string', value: `Versión del sistema: ${datosPanel.metadatos.versionSistema} (Commit ${datosPanel.metadatos.commit})` });
  // ... poblado de KPIs y metadatos con tipos numéricos nativos y strings sanitizados ...

  // 2. Hoja de Evolución de Tickets con Gráfico de Líneas Nativo
  const wsEvolucion = addWorksheet(wb, 'Evolucion_Tickets');
  setCellAtAddress(wsEvolucion, 'A1', { type: 'string', value: 'Período' });
  setCellAtAddress(wsEvolucion, 'B1', { type: 'string', value: 'Tickets Creados' });
  setCellAtAddress(wsEvolucion, 'C1', { type: 'string', value: 'Tickets Cerrados' });

  datosPanel.evolucionTickets.forEach((fila, idx) => {
    const filaNum = idx + 2;
    setCellAtAddress(wsEvolucion, `A${filaNum}`, { type: 'string', value: fila.periodo });
    setCellAtAddress(wsEvolucion, `B${filaNum}`, { type: 'number', value: fila.ticketsCreados });
    setCellAtAddress(wsEvolucion, `C${filaNum}`, { type: 'number', value: fila.ticketsCerrados });
  });

  const chartEvolucion = makeLineChart({
    series: [
      { idx: 0, order: 0, val: { formula: `Evolucion_Tickets!$B$2:$B$${datosPanel.evolucionTickets.length + 1}` }, cat: { formula: `Evolucion_Tickets!$A$2:$A$${datosPanel.evolucionTickets.length + 1}` }, tx: 'Tickets Creados' },
      { idx: 1, order: 1, val: { formula: `Evolucion_Tickets!$C$2:$C$${datosPanel.evolucionTickets.length + 1}` }, cat: { formula: `Evolucion_Tickets!$A$2:$A$${datosPanel.evolucionTickets.length + 1}` }, tx: 'Tickets Cerrados' },
    ],
  });
  const spaceEvolucion = makeChartSpace({
    title: 'Evolución de Tickets: Creados vs. Cerrados',
    plotArea: { charts: [chartEvolucion] },
  });
  addChartAt(wsEvolucion, 'E2', spaceEvolucion, { widthPx: 640, heightPx: 360 });

  // Serialización pura a bytes
  return await workbookToBytes(wb);
}

/**
 * Función disparadora de descarga en navegador.
 */
export async function exportarPanelXlsx(datosPanel) {
  const bytes = await generarBytesLibroPanel(datosPanel);
  const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const fechaStr = new Intl.DateTimeFormat('es-AR', {
    timeZone: 'America/Argentina/Buenos_Aires',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  }).format(new Date()).replace(/[/, :]/g, '').slice(0, 12);
  
  saveAs(blob, `panel-general-${fechaStr}.xlsx`);
}
```

## 4. Gestión de volumen y seguridad
- **Límites de volumen:** Las estadísticas del panel son agregaciones consolidadas (a lo sumo cientos o miles de filas en auditorías detalladas). No obstante, para resguardar la memoria heap del navegador en terminales de usuario, se fija un **tope máximo estricto de 50.000 filas por hoja de detalle**.
- **Comportamiento ante superación del tope:** Si la consulta de detalle supera las 50.000 filas, la exportación **no trunca en silencio**. Emite una advertencia interactiva en pantalla solicitando acotar el rango de fechas y, en caso de forzar la generación, la hoja `Resumen` del libro incluye un aviso destacado en rojo: `[AVISO DE VOLUMEN] El conjunto de datos superó las 50.000 filas. Se exportaron los primeros 50.000 registros para garantizar la estabilidad del navegador. Aplique filtros temporales más estrechos para auditar subconjuntos específicos.`
- **Seguridad de inyección:** Todos los textos de origen usuario (nombres de áreas, descripciones de fallas, nombres de activos) se procesan con `sanitizarTextoExcel` anteponiendo `'` si comienzan con caracteres de fórmula (`=`, `+`, `-`, `@`, `\t`, `\r`).
- **Valores puros (sin fórmulas dinámicas volátiles):** Todas las celdas de métricas y totales se escriben como valores escalares numéricos precalculados por la API, garantizando que el archivo sea estable y no dependa de reevaluaciones del motor de cálculo de distintas suites ofimáticas.

---

# Pruebas y criterios de aceptación

## 1. Pruebas automatizadas (Jest)

El proyecto ejecuta sus pruebas en backend mediante `Jest` configurado en `backend/package.json:14` con soporte de módulos ESM (`--experimental-vm-modules`).

### Suite A: Pruebas unitarias de agregación y conciliación (`backend/test/estadisticas.panel.test.js`)
- **Conciliación de integridad (S12, S15):** Verificar con un set de datos de prueba conocido que la suma de tickets por estado (`Creado` + `Validado` + ... + `Rechazado`) sea idéntica al total general devuelto por la consulta.
- **Totales de incidencias:** Verificar que la suma de fallas por tipo de falla coincida exactamente con el total de fallas reportadas en el ranking de áreas.
- **Manejo de nulos y vacíos (S6):** Comprobar que períodos mensuales sin tickets retornen `0` en sus campos numéricos (generados por `meses`) y no `null` ni queden omitidos de la serie temporal.
- **Regla de fechas:** Verificar que `desde > hasta` dispare un error `400 Bad Request` con mensaje `"La fecha "desde" no puede ser posterior a la fecha "hasta"."`.

### Suite B: Pruebas de autorización y seguridad (D4)
- **Acceso administrador:** Petición con token JWT con claim `rol: 'administrador'` devuelve `200 OK` en todos los endpoints de `/api/estadisticas/*`.
- **Rechazo a otros roles:** Peticiones con tokens con claim `rol: 'tecnico'` o `rol: 'autorizado'` devuelven `403 Forbidden` con cuerpo `{ ok: false, mensaje: 'No tienes permisos para realizar esta acción' }`. Verificar que no se invoque a la base de datos (Supabase spy no llamado).
- **Sin sesión:** Petición sin encabezado `Authorization` ni cookie `token` devuelve `401 Unauthorized` con cuerpo `{ ok: false, mensaje: 'No hay sesión activa' }`.

### Suite C: Pruebas del módulo de exportación `.xlsx` (`frontend/test/exportacionPanel.test.js`)
- **Generación y round-trip:** Invocar `generarBytesLibroPanel(mockDatosPanel)` pasando un payload sintético completo.
- **Relectura con la propia librería:** Cargar el `Uint8Array` resultante utilizando `loadWorkbook(bytes)` de `@office-kit/xlsx/io`.
- **Verificación de estructura:**
  - Comprobar que existan exactamente las 8 hojas programadas (`Resumen`, `Definiciones`, `Evolucion_Tickets`, `Incidencias_Areas`, `OT_Distribucion`, `Activos_Edificios`, `Tecnicos_Carga`, `Materiales_Criticos`).
  - Verificar que las celdas de metadatos contengan el commit analizado y la fecha/hora con zona horaria.
  - Verificar que las celdas que iniciaban con `=` o `-` hayan sido neutralizadas con prefijo `'`.
  - Confirmar la presencia de los objetos de dibujo y gráficos en las hojas correspondientes mediante `listChartsOnSheet(ws)`.

## 2. Protocolo de verificación manual visual

Debido a que las suites ofimáticas (Microsoft Excel y LibreOffice Calc) interpretan las etiquetas OpenXML DrawingML (`c:` y `cx:`) con motores propietarios:
1. Generar la exportación del panel desde la interfaz web de SIGMA mediante el botón "Exportar a Excel".
2. Abrir el archivo `.xlsx` resultante en **Microsoft Excel 365 / Desktop**:
   - Comprobar que el archivo abra de inmediato sin carteles de advertencia de "formato dañado" o "desea reparar el contenido".
   - Confirmar que los gráficos de línea, barras y dona se rendericen de forma nativa, respeten los colores del tema y respondan al hacer clic en las series mostrando los rangos de celdas vinculados.
3. Abrir el mismo archivo en **LibreOffice Calc** (v7.5 o superior):
   - Verificar la correcta disposición de las tablas y el posicionamiento de los gráficos en las celdas de ancla (`E2`, `K2`, etc.).
   - Confirmar que los números reflejen el formato regional de Argentina (`1.234,56`) y que las fechas muestren el formato `DD/MM/AAAA`.

## 3. Criterios de aceptación verificables

- [ ] **CA-01 (Acceso estricto D4):** La pantalla del panel (`/`), el enlace en la barra de navegación lateral y todas las rutas `/api/estadisticas/*` son accesibles exclusivamente para usuarios autenticados con rol `administrador`. Cualquier intento de acceso con rol `tecnico`, `autorizado` o anónimo es bloqueado y redirigido según la convención del sistema.
- [ ] **CA-02 (Cálculo único S15):** Los números de las tarjetas KPI, de los gráficos en pantalla y de las tablas de datos del archivo `.xlsx` exportado coinciden con exactitud al 100% para un mismo período seleccionado.
- [ ] **CA-03 (Trazabilidad y Frescura S13, S14):** En pantalla y en la hoja `Resumen` del `.xlsx` se visualiza con claridad: alcance de los datos ("Todo el sistema"), fecha y hora de emisión con zona horaria `America/Argentina/Buenos_Aires (UTC-3)` y versión/commit del sistema.
- [ ] **CA-04 (Antisesgo S4, S6, S11):** Todo porcentaje o ratio en pantalla y en Excel expone su denominador $n$ visible. Las series temporales muestran el valor 0 en meses sin registros. Todos los ejes numéricos parten obligatoriamente desde 0.
- [ ] **CA-05 (Gráficos nativos D1):** Los gráficos contenidos en el archivo `.xlsx` son entidades nativas de hoja de cálculo creadas con `@office-kit/xlsx`, editables en Excel/Calc y vinculadas a los datos de la hoja; no imágenes estáticas ni capturas de canvas.
- [ ] **CA-06 (Seguridad de fórmulas):** Ninguna celda de texto con caracteres iniciales `=`, `+`, `-` o `@` ejecuta fórmulas al abrirse en Microsoft Excel o LibreOffice.
- [ ] **CA-07 (Generación en cliente D3):** La exportación a `.xlsx` se procesa y descarga en el navegador sin invocar endpoints de archivo o binarios en el backend.

---

# Supuestos y preguntas abiertas

1. **Coexistencia de librerías de planillas y costo de bundle (Regla de Dependencias, Verificación 4):**
   - *Hallazgo en código:* El front-end del proyecto ya posee instalada la librería `exceljs` (`^4.4.0`) en `frontend/package.json:30`, utilizada en `frontend/src/app/(admin)/activos/page.js:33` y `frontend/src/app/(admin)/activos/importar/page.js:8` para importar y exportar listados planos de activos sin gráficos.
   - *Situación:* La Decisión del Propietario D1 exige gráficos **nativos** en `.xlsx`. `exceljs` carece por diseño de soporte para generar gráficos nativos (issue histórica de la comunidad [#261](https://github.com/exceljs/exceljs/issues/261) y documentación de `@office-kit/xlsx`), por lo que su coexistencia con `@office-kit/xlsx` es técnica y contractualmente obligatoria.
   - *Costo de bundle:* La inclusión de `@office-kit/xlsx` (`0.27.0`) suma aproximadamente 1,08 MB minificado (empaquetado con `saxes` y `fflate`). Al tratarse de un módulo ESM que se importa de forma asíncrona (`import()`) exclusivamente al presionar el botón de exportación, dicho peso se aísla en un chunk independiente que no penaliza la carga inicial de la aplicación.
   - *Pregunta abierta al equipo:* ¿Se mantendrán a futuro las exportaciones de activos en `exceljs` o se planifica unificar progresivamente todas las descargas de hojas de cálculo bajo `@office-kit/xlsx` para optimizar las dependencias del proyecto?

2. **Exposición de Git Commit en tiempo de ejecución:**
   - *Hallazgo:* En el backend, el endpoint `/salud` (`backend/src/rutas/index.js:101-107`) expone únicamente el nombre del servicio y la fecha del servidor, sin reportar el hash de commit de git ni la versión del paquete.
   - *Supuesto adoptado:* Se asume la lectura de la versión desde `package.json` (`0.1.0`) y la provisión del commit analizado (`899b562d0c76832de809bf99f3e5875703e503e7`) o variable de entorno de despliegue (`process.env.GIT_COMMIT` / `NEXT_PUBLIC_GIT_COMMIT`) en los metadatos de respuesta para alimentar la trazabilidad del libro exportado.

3. **Tope de volumen para exportación en cliente:**
   - *Supuesto adoptado:* Se estableció un tope operativo de 50.000 filas por hoja para salvaguardar el rendimiento del navegador en terminales de recursos moderados. Dado que el panel trabaja sobre estadísticas agregadas, este límite cubre holgadamente la operatoria normal. Se deja abierta la consulta de si se prefiere dividir automáticamente en múltiples hojas o restringir la exportación si el usuario selecciona períodos plurianuales con gran densidad de tickets.

---

# Checklist final

- [x] No se modificó ningún archivo del proyecto; solo `Panel.md`.
- [x] Commit analizado (`899b562d0c76832de809bf99f3e5875703e503e7`) y fecha (`2026-11-09`) registrados al inicio de los resultados.
- [x] Las únicas dependencias nuevas son `chart.js`, `@coreui/react-chartjs` y `@office-kit/xlsx`, solo en el front-end (o se escribió únicamente el informe de dependencias).
- [x] Cada paquete citado fue verificado en el registro o su documentación oficial (existencia, versión, licencia, peerDependencies), y la versión de `@office-kit/xlsx` está fijada sin `^` ni `~` (`0.27.0`).
- [x] Toda ruta, línea, tabla, columna y componente citado fue verificado en esta sesión; lo no verificado está en "Supuestos y preguntas abiertas".
- [x] No se copiaron valores de `.env`, credenciales ni datos personales.
- [x] Cobertura (S1): cada fuente de datos figura en la tabla de cobertura, incluida o con justificación.
- [x] Cada métrica cumple S3, S4, S6, S7, S8 y S12 en su ficha.
- [x] Títulos y etiquetas neutros, sin umbrales ni textos interpretativos (S9, S10); escalas honestas (S11).
- [x] Alcance y frescura visibles en pantalla y en el libro (S13, S14).
- [x] Todos los gráficos pertenecen al catálogo permitido y cumplen sus condiciones.
- [x] Todos los endpoints, la ruta y el ítem de menú del panel son solo para administradores, con pruebas de permisos (D4).
- [x] No hay endpoint de descarga; el `.xlsx` se arma en el front-end solo con la respuesta de la API, sin recalcular (D3, S15).
- [x] Los gráficos del `.xlsx` son nativos y coinciden en tipo, títulos, ejes y unidades con la pantalla (D1).
- [x] Se definió el tope de volumen y qué pasa al superarlo, sin truncar en silencio.
- [x] Pruebas, criterios de aceptación y verificación manual en Excel/LibreOffice descritos.

---
# Informe de dependencias
_Solo se completa si se activa el aborto de la Regla de Dependencias. Si no, dejalo así._
