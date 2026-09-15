# CONTEXTO — SIGMA (Seminario Integrador · Grupo 6)

> Fuente única de verdad del proyecto. Se actualiza a medida que avanzamos.
> Última actualización: 2026-07-16

---

## 0. Meta

- **Materia:** Seminario Integrador — UTN-FRRe
- **Grupo:** G6 — Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel · Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, Maria Paz · Ozuna Veron, Augusto Lautaro
- **Repositorio:** https://github.com/matiasgzlez/SIGMA-Seminario-Integrador-G6
- **Próxima entrega (carpeta):** **19/07/2026**

### Checklist de la entrega del 19/07

| # | Sección | Estado | Fuente disponible |
|---|---------|--------|-------------------|
| 1 | Fuentes de recolección de requerimientos | ✅ redactado (§1.1) | Entrevista Secretario de Infraestructura |
| 2 | Declaración del problema + restricciones (situación actual) | 🟢 redactado (§2) — validar | — |
| 3 | Objetivos del nuevo sistema | ⬜ pendiente | — |
| 4 | Misión, Visión y Alcance | 🟢 redactado (§3) — validar | — |
| 5 | Producto y potenciales clientes | 🟡 parcial (inferido) | — |
| 6 | Diagrama de Contexto (modelado del ambiente) | ⬜ pendiente | — |
| 7 | Glosario de Términos | ✅ v3 validado con el equipo (§7) | PDF Glosario (desactualizado) |
| 8 | Modelo de Tablas | 🟠 **a corregir** | PDF SQL + ER (ver §11) |
| 9 | Diccionario de Datos | 🟠 **a corregir** | PDF Diccionario |
| 10 | Mapa de Historias | ✅ 35 HU sincronizadas + criterios de aceptación completos (§13.2) | Story map por sprint |
| 11 | Road Map (Plan de release) | 🟢 sincronizado con GitHub (§13.2); Sprint 0 + 7 sprints | Cronograma 7 sprints + Sprint 0 |
| 12 | Herramientas de trabajo en equipo | ⬜ pendiente | — |
| 13 | Arquitectura de Hardware y Software | ⬜ pendiente | — |

Leyenda: ✅ listo · 🟡 parcial · 🟠 tenemos pero requiere corrección · ⬜ pendiente

### Artefactos del proyecto
- `contexto.md` — fuente de verdad (este archivo).
- `docs/entrega-17-07/hu-antes-despues.pdf` — comparativa de HU antes/después de la corrección.
- `prototipo/index.html` — prototipo navegable (localhost: `cd prototipo && npm run dev` → :3000; Vercel-ready). En curso: CRUD real con localStorage.
- `prototipo/roadmap.html` — story map / tablero de sprints editable.
- **GitHub:** 41 issues = **35 HU** (#1–#34 + #39) + **4 tareas de setup** T1–T4 (#35–#38, Sprint 0) + **2 cerrados por duplicados** (#40, #41) · 8 milestones (Sprint 0–7) + labels. Ver §13.2.
- **Project board:** `SIGMA — Roadmap G6` (nº 4) — 40/40 issues cargados ✅. Vistas: *Tablero por SPRINT* y *Vista Trello*. ⚠️ Agrupa por el **campo `Sprint`** del proyecto, NO por el milestone: al agregar un issue hay que cargarle ese campo a mano.

---

## 1. De qué se trata SIGMA (resumen)

Sistema web de **gestión de mantenimiento de activos e infraestructura** de una facultad. Digitaliza y da trazabilidad al ciclo completo:

**Falla detectada → Ticket/Solicitud → Validación → Orden de Trabajo → Tareas ejecutadas por técnicos → Cierre automático (OT finalizada → ticket cerrado).**

Además gestiona:
- **Mantenimiento preventivo** planificado (planes + plantillas de tareas por tipo de activo).
- **Inventario de depósito** (materiales consumibles y herramientas) con stock, compras, proveedores y remitos.
- **Prestadores de servicio externos** cuando el trabajo excede la capacidad del equipo propio.
- **Tablero de KPIs** para el área de infraestructura.

### Roles del sistema (3, cobertura total sin solapamiento)
| Rol | Qué hace |
|-----|----------|
| **Administrador** | Máximos permisos. Valida tickets, genera OT, asigna técnicos, gestiona activos/espacios/inventario/planes preventivos. |
| **Técnico** | Ejecuta las OT/tareas. Tiene especialidad y disponibilidad. Consume materiales y usa herramientas. |
| **Usuario Autorizado** | Responsable de un área, habilitado para **registrar tickets** y **consultar su estado**. |

---

## 1.1 Fuentes de recolección de requerimientos

La recolección de requerimientos se realizó mediante una **entrevista con el Secretario de Infraestructura de la UTN-FRRe, Carlos Olivieri**. Se abordaron los procesos actuales del área, las problemáticas existentes, las necesidades funcionales y los objetivos esperados para el nuevo sistema.

La información obtenida permitió comprender el funcionamiento de la gestión de mantenimiento de la facultad, identificar las principales problemáticas del proceso actual y definir los requerimientos para desarrollar una solución que optimice la gestión de reclamos, la planificación de tareas, el control del inventario y el seguimiento de las actividades de mantenimiento.

> Dato relevante: hoy las solicitudes se gestionan de manera informal por **WhatsApp, llamadas telefónicas y comunicaciones verbales**, por lo que la información histórica de reclamos y tareas es limitada.

---

## 2. Declaración concisa del problema y restricciones

### 2.1 Declaración del problema

La gestión del mantenimiento de la infraestructura física de la facultad se realiza hoy de manera **manual, informal y dispersa**: los desperfectos se comunican por vías no formales (WhatsApp, llamadas telefónicas y comunicaciones verbales) y el seguimiento se lleva, cuando se lleva, en planillas de cálculo o en papel. No existe un registro único ni un canal formal de entrada.

Como consecuencia:

- **No hay canal formal ni centralizado** para reportar desperfectos o necesidades de mantenimiento.
- **No hay seguimiento del estado de las solicitudes:** quien reporta un problema no puede consultar en qué situación se encuentra.
- **Se duplican los reclamos**, al no existir un registro único por activo o ubicación.
- **No se dispone de un inventario** de materiales, herramientas ni equipos, lo que impide controlar el stock y planificar compras.
- **No se aplica mantenimiento preventivo de forma sistemática**; se trabaja casi exclusivamente por reacción ante la falla.
- **No se registra la asignación de tareas** ni la productividad del personal técnico.
- **No existen indicadores de gestión** que permitan tomar decisiones basadas en datos.

**Enunciado síntesis:** *la ausencia de un sistema único que formalice, registre y mida el ciclo de mantenimiento provoca pérdida de trazabilidad de las solicitudes, uso ineficiente de los recursos técnicos y del depósito, y una toma de decisiones del área de infraestructura basada en percepciones antes que en datos.*

### 2.2 Restricciones para su solución

| Tipo | Restricción |
|------|-------------|
| **Temporal** | El desarrollo se enmarca en el calendario académico del Seminario Integrador: 7 sprints de 2 semanas (10/08/2026 → 26/11/2026). No hay margen para extender el cronograma. |
| **De recursos** | El equipo son 7 estudiantes con dedicación parcial, que cumplen simultáneamente los roles de analista, desarrollador y tester. No hay presupuesto asignado ni posibilidad de contratar servicios pagos. |
| **De alcance** | El entregable es un **prototipo funcional**, no un sistema en producción. Quedan fuera la administración financiera, el circuito completo de compras, la app móvil nativa y la integración con sistemas externos de la facultad. |
| **Tecnológica** | Solución **web**, accesible desde navegador y con diseño responsive; debe poder ejecutarse sobre la infraestructura disponible en la facultad, sin requerir hardware específico ni instalación en los equipos de los usuarios. |
| **Organizacional** | Un único ente destinatario (la facultad). El relevamiento depende de la disponibilidad de las autoridades y del personal del área de infraestructura, que tienen sus propias tareas operativas. |
| **De datos** | No se migran datos históricos reales: el sistema arranca con carga inicial de activos, espacios e inventario (se prevé importación desde Excel para agilizarla). |
| **De usuarios** | El personal técnico tiene alfabetización digital heterogénea: la interfaz debe ser simple y con pocos pasos, o el sistema será abandonado y se volverá al canal informal. |
| **Legal / normativa** | El sistema maneja datos personales del personal (nombre, DNI, CUIL, contacto), por lo que debe contemplar acceso restringido por rol. |

---

## 3. Misión, Visión y Alcance

### 3.1 Misión

SIGMA nace para dar respuesta a una necesidad concreta de las instituciones educativas: ordenar y centralizar la gestión del mantenimiento de su infraestructura física, hoy resuelta con herramientas informales como planillas, llamados telefónicos y mensajes.

Nuestra misión es **proveer a las autoridades, al personal técnico y a los responsables de área una herramienta web que formalice el ciclo completo de mantenimiento**, desde que se detecta un desperfecto hasta que la intervención queda cerrada y registrada. El sistema busca que cada solicitud tenga un canal formal de registro, un estado consultable y un responsable asignado; que el consumo de materiales quede documentado y el stock del depósito bajo control; y que el área de infraestructura cuente con información confiable para planificar el mantenimiento preventivo y tomar decisiones basadas en datos y no en percepciones.

En síntesis: **transformar un proceso informal, disperso y sin trazabilidad en un proceso digital, único y medible.**

### 3.2 Visión

Para autoridades, personal técnico y responsables de áreas de instituciones educativas que necesitan gestionar de forma centralizada el mantenimiento de su infraestructura física, **SIGMA es un sistema web modular** que permite registrar reclamos, planificar tareas preventivas y correctivas, controlar el inventario y analizar el desempeño operativo.

A diferencia de las herramientas informales que se utilizan actualmente —planillas de cálculo, llamadas telefónicas y mensajería— nuestro producto **centraliza el ciclo completo de mantenimiento en una única plataforma**, brindando trazabilidad de cada solicitud, control de stock del depósito e indicadores de gestión que sustentan la toma de decisiones.

Aspiramos a que SIGMA se consolide como la herramienta de referencia del área de infraestructura, y a que su diseño modular permita, en etapas posteriores, replicar la solución en otras unidades académicas con necesidades equivalentes.

### 3.3 Alcance del proyecto

Comprende el análisis, diseño y desarrollo de un **prototipo funcional** del sistema SIGMA, en el marco de la materia Seminario Integrador.

**Incluye:**
- Relevamiento de requerimientos mediante entrevistas a autoridades y usuarios finales.
- Análisis y especificación del sistema.
- Diseño de la arquitectura y de la base de datos.
- Desarrollo de los módulos definidos en el alcance del producto.
- Testing del prototipo.

**No incluye:**
- Migración de datos reales históricos.
- Capacitación a usuarios finales.

### 3.4 Alcance del producto

El sistema abarca la gestión completa del ciclo de mantenimiento de la infraestructura física de la institución: desde la recepción de un reclamo mediante un ticket o la planificación de una tarea preventiva, hasta su ejecución, el registro de los materiales utilizados y el cierre de la orden de trabajo y del ticket asociado.

Cubre la totalidad de los espacios físicos y el anexo, segmentados en aulas, laboratorios, oficinas, pasillos y áreas comunes, así como el control del inventario de materiales y herramientas y la planificación operativa del personal técnico.

**Incluye:**
- Registro y catalogación de activos y espacios.
- Gestión de tickets de mantenimiento con flujo de estados.
- Generación y seguimiento de órdenes de trabajo (OT).
- Planificación de mantenimiento preventivo y correctivo.
- Control de inventario de materiales y herramientas.
- Asignación de técnicos según especialidad y disponibilidad.
- Registro de prestadores de servicio externos para tareas que exceden la capacidad del equipo propio.
- Historial de intervenciones por activo.
- Dashboard con indicadores de gestión (KPIs).

**No incluye (versión inicial):**
- Notificaciones automáticas por correo electrónico (los avisos son dentro del sistema).
- Administración financiera (presupuestos, facturación, contabilidad, pagos).
- Gestión completa del proceso de compras (selección de proveedores, emisión de órdenes de compra).
- Aplicación móvil nativa.
- Integración con sistemas externos de la facultad.

Cabe aclarar que, si bien el sistema **registra el ingreso de materiales al depósito mediante remito**, no gestiona el proceso completo de compras: el remito se utiliza como comprobante de ingreso que actualiza el stock, no como parte de un circuito de adquisiciones.

> ⚠️ **Decisión (2026-07-14): NO hay conformidad del solicitante.** El cierre es automático: cuando se completan todas las tareas, la **OT se finaliza** y el **ticket se cierra** automáticamente. No se pide validación del usuario autorizado. Impacto: el término *Conformidad* del glosario (§7) y el campo `tickets.conformidad` del modelo (§11) **se eliminan**.

---

## 4–6. Objetivos / Producto-Clientes / Diagrama de Contexto

⬜ **Pendiente.** (Producto: sistema web interno de la facultad; clientes potenciales: otras facultades/UUAA con necesidad de gestión de mantenimiento de infraestructura.)

---

## 7. Glosario de Términos (v3 — validado con el equipo, 2026-07-14)

> Versión final acordada por el equipo. Reemplaza al PDF de Glosario entregado.
> **Eliminados:** *Conformidad* (el cierre es automático), *Responsable de área* (absorbido por *Usuario Autorizado*), *Personas* (entidad eliminada del modelo), *Diagnóstico*.

| Concepto | Descripción |
|----------|-------------|
| **Activo** | Elemento físico instalado en la facultad que requiere mantenimiento, control o seguimiento, incluyendo edificios, aulas, mobiliarios, laboratorios y áreas comunes. **Estados:** *Operativo* (óptimas condiciones y funcionando); *En mantenimiento* (inactivo por mantenimiento en curso); *Fuera de servicio* (inactivo y en espera de mantenimiento); *Retirado* (retiro permanente por no ser posible su reparación). |
| **Administrador** | Rol con máximos permisos del sistema. Valida o rechaza tickets, gestiona las órdenes de trabajo, asigna técnicos, administra activos, espacios, áreas, inventarios y planes de mantenimiento preventivo. |
| **Área** | Unidad organizacional de la facultad que cuenta con un responsable (el usuario autorizado) con autoridad para registrar tickets. |
| **Cancelación de OT** | Finalización de una OT. Requiere registrar un motivo: ticket inválido o duplicado, activo dado de baja, reparación innecesaria o tercerización del trabajo. |
| **Compras** | Registro de las adquisiciones de materiales y herramientas realizadas por la facultad para abastecer el inventario de depósito. Se compone de una o más líneas de compra y se asocia a un proveedor. |
| **Director de Infraestructura** | Autoridad del área que depende del secretario de infraestructura. Es responsable de la planificación operativa diaria, la asignación de técnicos a las OT y la coordinación del equipo de mantenimiento. |
| **Disponibilidad** | Condición del técnico que indica si puede asumir nuevas tareas. Junto con la especialidad, determina a quién se le puede asignar una tarea de la OT. |
| **Edificio** | Infraestructura estable donde se llevan a cabo las actividades de la facultad. Contiene espacios. |
| **Egreso** | Registro de salida de un material, herramienta o activo que disminuye el stock de inventario. Se genera automáticamente al consumir un material en una tarea o al entregar una herramienta a un técnico. |
| **Especialidad** | Área de conocimiento técnico de un técnico (eléctrica, civil, refrigeración, etc.). Condiciona la asignación de tareas. |
| **Espacio** | Lugar donde se encuentra el activo a reparar. |
| **Estado** | Etapa del ciclo de vida en la que se encuentra una entidad del sistema: ticket, OT, tarea, activo o herramienta. |
| **Evidencia** | Imágenes incorporadas a un ticket o a una OT que respaldan el estado de un activo o incidente reportado. |
| **Falla** | Clasificación del problema que afecta a un activo (eléctrica, mecánica, estructural, sanitaria, etc.). Se identifica y se asocia a la tarea de la OT, lo que permite analizar la incidencia de fallas por área y por tipo de activo. |
| **Herramienta** | Instrumento de trabajo que perdura en el tiempo y que utilizan los técnicos para ejecutar una tarea. No se consume con el uso y se devuelve al depósito. **Estados:** *Disponible* → *En uso* → *En reparación*. |
| **Ingreso** | Registro de entrada de un material, herramienta o activo que aumenta el stock del inventario. Se realiza mediante un remito de compra. |
| **Inventario de Activo** | Registro de todos los activos instalados y en funcionamiento, representado por números de inventario, lugar físico, estado e historial de intervenciones. |
| **Inventario de Depósito** | Registro de la cantidad disponible de materiales y herramientas. |
| **Ítem de inventario** | Entidad general que representa cualquier elemento del depósito. Se especializa en materiales (consumibles) y herramientas, con cobertura total y sin solapamiento. |
| **Línea de compra** | Detalle de cada ítem dentro de una compra: producto adquirido, cantidad y monto. |
| **Mantenimiento Correctivo** | Intervención que se realiza para reparar un desperfecto ya ocurrido. Se origina a partir de un ticket. |
| **Mantenimiento Preventivo** | Intervención planificada que se realiza antes de que ocurra una falla, con el objetivo de preservar el estado de los activos. Se origina en un plan de mantenimiento preventivo. |
| **Material** | Insumo consumible que se utiliza en una tarea de mantenimiento y no se recupera. Al registrarse su uso, se descuenta del stock del depósito. |
| **Orden de Trabajo (OT)** | Autorización de trabajo generada automáticamente al validar un ticket, o bien a partir de un plan de mantenimiento preventivo. **Estados:** *Creada* → *Asignada* → *En ejecución* → *Finalizada* / *Cancelada*. |
| **Plan de Mantenimiento** | Programa que define qué activos serán intervenidos, con qué frecuencia, qué tipo de tarea se realizará y los responsables. Genera órdenes de trabajo preventivas de forma automática. |
| **Plantilla de Tareas** | Modelo predefinido de tarea asociado a un tipo de activo o a un plan preventivo. Permite precargar las tareas estándar al crear una OT y estandarizar el trabajo. |
| **Prestadores de Servicio** | Empresa o profesional externo contratado para realizar trabajos de mantenimiento que no pueden ser cubiertos por el personal técnico propio, ya sea por falta de capacidad operativa o por requerir una especialización particular. |
| **Prioridad** | Nivel de importancia que el área de infraestructura asigna a una OT al crearla. |
| **Proveedores** | Persona o empresa a la que la facultad le compra materiales y herramientas. |
| **Remito** | Documento para confirmar el ingreso de materiales al depósito. Contiene proveedor, productos ingresados, cantidades y fecha de recepción. |
| **Stock** | Cantidad disponible de un material en el depósito. |
| **Stock mínimo** | Cantidad mínima establecida de un material que debe mantenerse en el depósito para asegurar la continuidad de operaciones. Al alcanzarse, el sistema emite una alerta. |
| **Tarea (dentro de OT)** | Actividad concreta que se realiza dentro de una OT. La OT se finaliza cuando todas sus tareas están completas. **Estados:** *Pendiente* → *En ejecución* → *Completada*. |
| **Técnico** | Personal de la facultad encargado de ejecutar las tareas de las OT. Tienen una especialidad y una disponibilidad que condicionan su asignación. |
| **Ticket** | Registro formal dentro del sistema que documenta una necesidad de mantenimiento detectada en un espacio particular de la facultad. Es la entrada del sistema. **Estados:** *Creado* → *Validado* → *Asignado* → *Finalizado* → *Cerrado* / *Rechazado*. |
| **Tipo de Activo** | Categoría que agrupa a los activos según su naturaleza (aires acondicionados, mobiliario, luminarias, etc.). Permite asociarles planes de mantenimiento preventivo y plantillas de tareas. |
| **Tipo de Prestación** | Clasificación del servicio que ofrece un prestador externo. Permite categorizar y buscar prestadores según el tipo de trabajo requerido (por ejemplo, refrigeración). |
| **Trazabilidad** | Capacidad de seguir el historial completo de un ticket, una OT, un activo o una acción de usuario. |
| **Usuario** | Persona que interactúa con el sistema, con un rol asignado que determina sus permisos. |
| **Usuario Autorizado** | Responsable de un área, habilitado para registrar tickets sobre los activos de su ámbito y consultar su estado. Es el rol solicitante del sistema. |

### 7.1 Observaciones abiertas sobre el glosario (❓ revisar antes de entregar)

Estas quedaron sin resolver en la versión validada; ninguna es bloqueante pero conviene decidirlas:

1. **Estados del Ticket:** falta *En ejecución* entre *Asignado* y *Finalizado*. El diccionario de datos (§10) sí lo tiene en el ENUM → hay inconsistencia entre glosario y modelo.
2. **Ingreso / Egreso:** dicen "material, herramienta o activo". Los **activos no son parte del inventario de depósito** (van en el inventario de activos), así que la palabra *activo* sobra en ambas definiciones.
3. **Cancelación de OT:** "Finalización de una OT" no distingue cancelar de finalizar. Debería decir "finalización **anticipada**, antes de su término normal".
4. **KPI / Tablero:** no están definidos, pero son todo el Sprint 7 (indicadores de gestión, tablero del área). La profe puede pedirlos.
5. **Plan de Mantenimiento:** conviene llamarlo *Plan de Mantenimiento Preventivo*, para no confundirlo con el correctivo.

---

## 8. Modelo de Dominio (Entidad-Relación) — conceptual

El ER (imagen `docs/fuentes/`) modela: `Facultad` tiene `Edificios` → `Espacios` → `Áreas`; `Personas` ES-A {Administrador, Técnico, Usuario Autorizado}; `Activos` se localizan en Espacios y se clasifican en `TipoActivo`; `Fallas` reportan sobre Activos; `Tickets` los crea el Usuario Autorizado y los valida el Administrador; una OT `TareasOT` se ejecutan por Técnicos, consumen `Materiales` y usan `Herramientas`; `Mantenimiento Preventivo` con `PlantillasTareas` genera OT; `ItemInventario` ES-A {Herramientas, Materiales}; `Compras`→`Línea de Compra`←`Proveedores`; `Prestador de Servicio` brinda `Tipo Prestación`.

> ⚠️ **La profe aclaró que el ER está conceptualmente bien, pero mal traducido a tablas.** Ver §11.

---

## 9. Modelo de Tablas — VERSIÓN ACTUAL (entregada, con errores)

Fuente: PDF "Sentencias SQL". Tablas: `facultad, edificios, espacios, areas, tiposActivos, activos, clasificacionActivos, personas, administradores, tecnicos, autorizados, personasConformanFacultad, fallas, tickets, ticketReportaFalla, ticketInvolucraActivo, ordenesTrabajo, plantillaTareasOT, tareasOT, tecnicoEstaAsignadoTareaOT, tecnicoControlaActivo, ordenTrabajoInvolucraActivo, ordenTrabajoContrataServicio, plantillaMantenimientosPreventivos, mantenimientosPreventivos, ordenesDeTrabajoDelMantPrev, tecnicosAsignadosAPlanDeMantenimiento, tipoPrestacion, prestadoresServicio, prestadorServicioBrinda, proveedores, compras, lineaCompra, itemsInventario, herramientas, materiales, tareasOTConsumeMateriales, tecnicoUtilizaHerramienta`.

El SQL completo original está en `docs/fuentes/` (referencia).

---

## 10. Diccionario de Datos

Fuente: PDF "Diccionario". Estructura por columna: `Tabla | Campo | Tipo | Longitud | Clave | Es Nulo | Es Único | Descripción`. Se regenerará junto con el modelo corregido (§11). Estados clave (ENUM):
- **activos.estado:** Operativo, En mantenimiento, Fuera de servicio, Retirado.
- **tickets.estado:** Creado, Validado, Asignado, En ejecución, Pendiente, Finalizado, Cerrado, Rechazado.
- **ordenesTrabajo.estado:** Creada, Asignada, En ejecución, Finalizada, Cancelada.
- **tareasOT.estado:** Creada, Asignada, En ejecución, Pendiente, Finalizada, Cancelada.

---

## 11. ⭐ CORRECCIONES DE LA PROFE (16/06/2026) + fix propuesto

> Estas correcciones aplican al **Modelo de Tablas** y **Diccionario de Datos**. Hay que rehacerlos para el 19/07. Cada punto tiene el fix que propongo; los marcados con ❓ requieren tu decisión.
>
> ⚠️ **Además de estas 12 correcciones de la profe, hay 3 huecos propios detectados al escribir los criterios de aceptación** (falta tabla `especialidades`, falta dónde guardar credenciales, plantillas sin vínculo al tipo de activo). Ver **§13.2.1-bis**.

| # | Observación de la profe | Fix propuesto |
|---|-------------------------|---------------|
| 1 | "Presentaron un ER, se pedía un **Modelo de Tablas**." | Entregar el modelo **relacional en tablas** (columnas, PK, FK; sin rombos ni ES-A). El SQL ya es base; refinarlo con los puntos siguientes y presentarlo como tal. |
| 2 | Tabla **Personas** no tiene sentido; con Administradores/Técnicos/Autorizados basta (agregando nombre/apellido). Salvo que Personas sea compartida por otros sistemas. | **Eliminar `personas`**. Llevar nombre, apellido, dni, cuil, email, telefono, fechaNacimiento a cada tabla de rol. Revisar `personasConformanFacultad` (¿la facultad es única? → posible `idFacultad` como atributo). ❓ ¿Personas se comparte con otro sistema? Si sí, se mantiene. |
| 3 | **Tickets.diagnosticoEstado / diagnosticoDescripcion**: ¿cuándo y quién los informa? | ✅ **RESUELTO (2026-07-16): se eliminan ambos del ticket, y también `preDiagnostico`.** El diagnóstico lo carga el **técnico en la tarea de la OT** (HU-34/#34), que es cuando efectivamente se conoce. El ticket no lleva ningún diagnóstico. |
| 4 | **Fallas del ticket**: al crear el ticket aún no se identifican. ¿Cuándo/quién? Tiene más sentido que **cada TareaOT se relacione con una falla**. | **Eliminar `ticketReportaFalla`**. Agregar `tareasOT.idFalla` (FK, nullable). La falla se identifica en el diagnóstico (técnico), no al crear el ticket. |
| 5 | **ordenesTrabajo.fechaReparacion** es ambigua (¿creación, inicio, cierre?). | Reemplazar por fechas explícitas: `fechaCreacion`, `fechaProgramada`, `fechaFinalizacion`. |
| 6 | **tecnicoEstaAsignadoTareaOT.idEdificio**: ¿por qué está? | **Eliminar `idEdificio`**. PK = (tecnico, idTareaOT). (En el SQL ya está corregido; asegurar que quede así en el diccionario). |
| 7 | **ordenTrabajoInvolucraActivo**: una OT es para UNA solicitud, y esta es por fallas en **UN ÚNICO ACTIVO**. | **Eliminar `ordenTrabajoInvolucraActivo` y `ticketInvolucraActivo`** (N:M). Poner `idActivo` como FK **único** en `tickets` y en `ordenesTrabajo`. |
| 8 | **ordenTrabajoContrataServicio** no existe. | **Eliminar**. El prestador va como atributo en TareasOT (punto 10). |
| 9 | **ordenesDeTrabajoDelMantPrev** no existe. | **Eliminar**. La OT lleva `idMantenimientoPreventivo` como atributo (punto 11). |
| 10 | El prestador de servicios de una tarea debe ser **atributo en TareasOT**. | Agregar `tareasOT.idPrestadorServicio` (FK, nullable). |
| 11 | Si la OT es de un Mantenimiento Preventivo, debe ser **atributo (nullable) en la OT**; nulo si viene de un Ticket, y viceversa. | `ordenesTrabajo`: `idTicket` (FK, nullable) + `idMantenimientoPreventivo` (FK, nullable), con regla: exactamente uno de los dos con valor. |
| 12 | El ER está bien conceptualmente pero mal plasmado en tablas. "Deben aprender a hacer un Modelo de Tablas correcto." | Aplicar 1–11 y presentar el modelo relacional limpio + diccionario coherente. |

### 11.1 Modelo de Tablas CORREGIDO (propuesta a validar)

**Roles (sin `personas`):**
- `administradores(legajo PK, nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, fechaAsuncion)`
- `tecnicos(legajo PK, nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, especialidad, disponibilidad)`
- `autorizados(legajo PK, nombre, apellido, dni, cuil, email, telefono, fechaNacimiento, idArea FK)`

**Estructura física:**
- `facultad(idFacultad PK, nombre, cuit, telefono, direccion)`
- `edificios(idEdificio PK, nombre, direccion, idFacultad FK)`
- `espacios(idEspacio PK, idEdificio FK, nombre, tipo, piso, numero, dimensiones)`
- `areas(idArea PK, nombre, idAutorizado FK, idEspacio FK)` ⚠️ dependencia circular areas↔autorizados (revisar)

**Activos:**
- `tiposActivos(idTipoActivo PK, nombre, descripcion, observaciones)`
- `activos(codigo PK, fechaAlta, descripcion, categoria, subcategoria, fechaInstalacion, estado ENUM, fechaUltMantenimiento, idEspacio FK)`
- `clasificacionActivos(idActivo, idTipoActivo)` — N:M (o hacerlo 1:N con `activos.idTipoActivo` ❓)
- `fallas(idFalla PK, tipo, descripcion, idActivo FK)`

**Tickets / OT / Tareas:**
- `tickets(idTicket PK, fechaAlta, descripcion, estado ENUM, evidencia, motivoRechazo, fechaCierre, idActivo FK, personaAutorizada FK→autorizados, idAdministrador FK→administradores nullable)` ← **idActivo único**, sin N:M · **sin `conformidad`** (2026-07-14) · **sin `preDiagnostico`** (2026-07-16)
- `ordenesTrabajo(idOrdenTrabajo PK, descripcion, estado ENUM, evidencia, fechaCreacion, fechaProgramada, fechaFinalizacion, idActivo FK, idTicket FK nullable, idMantenimientoPreventivo FK nullable)` ← regla: uno de idTicket/idMantPrev
- `plantillaTareasOT(idPlantillaTareaOT PK, descripcion)`
- `tareasOT(idTareaOT PK, descripcion, estado ENUM, prioridad, fechaInicio, fechaFinalizacion, idOrdenTrabajo FK, idPlantillaTareaOT FK nullable, idPrestadorServicio FK nullable, idFalla FK nullable)`
- `tecnicoEstaAsignadoTareaOT(tecnico FK, idTareaOT FK, fechaAsignacion, activo)` — PK(tecnico, idTareaOT), **sin idEdificio**
- `tareasOTConsumeMateriales(idTareaOT, idMaterial, fecha, cantidad)`

**Mantenimiento preventivo:**
- `plantillaMantenimientosPreventivos(idPlantillaMantenimientoPreventivo PK, nombre, frecuencia)`
- `mantenimientosPreventivos(idMantenimientoPreventivo PK, idAdministrador FK, idTipoActivo FK, idPlantillaMantenimientoPreventivo FK nullable)`
- `tecnicosAsignadosAPlanDeMantenimiento(idMantenimientoPreventivo, idTecnico, fechaAsignacion, activo)`

**Prestadores:**
- `tipoPrestacion(idTipoPrestacion PK, nombre, descripcion)`
- `prestadoresServicio(idPrestadorServicio PK, nombre, cuil, telefono, email, garantia)`
- `prestadorServicioBrinda(idPrestadorServicio, idTipoPrestacion)`

**Inventario / Compras:**
- `proveedores(idProveedor PK, nombre, cuit, telefono, email, direccion, rubro, observacion)`
- `compras(nroFactura PK, fecha, tipoFactura, observacion, idProveedor FK)`
- `lineaCompra(idLineaCompra, factura, monto, descripcion, cantidad)` — PK(idLineaCompra, factura)
- `itemsInventario(idItem PK, nombre, codigo, descripcion, estado, observacion, idFacultad FK, idLineaCompra+factura FK)`
- `herramientas(idHerramienta PK/FK→itemsInventario, estado)`
- `materiales(idMaterial PK/FK→itemsInventario, stockActual, stockMinimo, fechaVencimiento)`
- `tecnicoUtilizaHerramienta(idHerramienta, idTecnico, fecha, devuelta)`

**Tablas ELIMINADAS respecto de la versión anterior:** `personas`, `personasConformanFacultad`(revisar), `ticketReportaFalla`, `ticketInvolucraActivo`, `ordenTrabajoInvolucraActivo`, `ordenTrabajoContrataServicio`, `ordenesDeTrabajoDelMantPrev`. (`tecnicoControlaActivo` estaba en el SQL pero no en glosario/diccionario → ❓ revisar si se mantiene.)

---

## 12–13. Mapa de Historias · Road Map

**Cronograma:** 7 sprints de **2 semanas** c/u. Ventana total: **10/08/2026 → 26/11/2026**.
Fechas indicativas por sprint (2 semanas): S1 10–23 ago · S2 24 ago–6 sep · S3 7–20 sep · S4 21 sep–4 oct · S5 5–18 oct · S6 19 oct–1 nov · S7 2–15 nov (+ buffer hasta 26 nov).

> 📌 **La versión vigente del backlog es §13.2** (numeración HU-1…HU-34, sincronizada con GitHub el 2026-07-16).
> §12 y §13.1 quedan como **registro histórico** y usan la **numeración vieja** (HU-05, HU-38, HU-45…): sirven para entender de dónde salió cada corrección. Ver la columna *(antes)* de §13.2 para la equivalencia.

### 12.1 Backlog ORIGINAL entregado (numeración vieja — histórico)

> Los números de HU salteados (HU-01 a 04, 24, 25, 28, 31, 39) corresponden a HU **eliminadas/corregidas en el momento** con la profe. (HU-01 a 04 luego se reconvirtieron en las tareas técnicas T1–T4, ver §13.2.1.) Total en ese momento: **35 HU**.
> ⭐ HU-10 y HU-19 aparecían **destacadas (negras)** en el tablero.

### SPRINT 1 — ABM base / configuración
| HU | Rol | Historia |
|----|-----|----------|
| HU-05 | Administrador | Gestionar edificios, espacios y áreas de la facultad, para la asignación correcta de tickets. |
| HU-06 | Administrador | Gestionar los técnicos, para saber con qué recursos humanos cuento al asignar una OT. |
| HU-07 | Administrador | Registrar usuarios autorizados y asignarles un área, para habilitarlos a cargar tickets. |
| HU-08 | Administrador | Gestionar los activos físicos, para mantener actualizado el inventario. |

### SPRINT 2 — Ticket + validación + plantillas
| HU | Rol | Historia |
|----|-----|----------|
| HU-09 | Usuario autorizado | Registrar un ticket, para informar un desperfecto. |
| ⭐HU-10 | Técnico | Registrar el diagnóstico del ticket, para preparar la OT. |
| HU-11 | Administrador | Validar o rechazar un ticket, para determinar si se genera una OT. |
| HU-12 | Administrador | Visualizar los tickets, para conocer las solicitudes de mantenimiento. |
| HU-13 | Administrador | Gestionar la plantilla de tareas, para estandarizar la creación de OT. |
| HU-14 | Administrador | Gestionar el inventario, para mantener actualizado el catálogo del depósito. |

### SPRINT 3 — Inventario/stock + creación de OT
| HU | Rol | Historia |
|----|-----|----------|
| HU-15 | Administrador | Registrar ingresos por remito, para mantener actualizado el stock. |
| HU-38 | Administrador | Importar inventario inicial desde Excel, para agilizar la carga inicial. |
| HU-16 | Administrador | Visualizar el stock de materiales, para controlar la disponibilidad antes de asignar una OT. |
| HU-17 | Administrador | Crear OT, para planificar tareas de mantenimiento. |
| ⭐HU-19 | Administrador | Asignar tareas a la OT, para especificar las actividades que deben realizarse. |
| HU-18 | Administrador | Asignar un técnico a una tarea, para que se ejecute el mantenimiento correspondiente. |
| HU-20 | Administrador | Priorizar las OT pendientes, para asignar el trabajo según su importancia. |

### SPRINT 4 — Ejecución de tareas (técnico) + cierre OT
| HU | Rol | Historia |
|----|-----|----------|
| HU-21 | Técnico | Consultar las tareas de la OT, para saber qué tengo que hacer. |
| HU-22 | Técnico | Registrar repuestos utilizados en una tarea, para asegurar la trazabilidad. |
| HU-23 | Técnico | Agregar una observación a una tarea, para registrar actividades adicionales. |
| HU-26 | Administrador | Cerrar la OT, para finalizar formalmente el proceso. |

### SPRINT 5 — Seguimiento + preventivo + consultas
| HU | Rol | Historia |
|----|-----|----------|
| HU-27 | Administrador | Consultar las OT, para realizar el seguimiento de las tareas programadas. |
| HU-29 | Administrador | Gestionar los planes de mantenimiento preventivo, para anticiparse a las fallas críticas. |
| HU-30 | Administrador | Consultar tickets, para localizar rápidamente un ticket. |
| HU-32 | Usuario autorizado | Consultar mis tickets y su estado, para hacer seguimiento. |

### SPRINT 6 — Autenticación / usuarios / alertas
| HU | Rol | Historia |
|----|-----|----------|
| HU-33 | Usuario | Ingresar con credenciales asignadas, para acceder de forma segura. |
| HU-34 | Usuario | Recuperar mi contraseña, para no perder el acceso al sistema. |
| HU-35 | Administrador | Gestionar los usuarios, para controlar los accesos y permisos al sistema. |
| HU-36 | Administrador | Gestionar alertas de stock mínimo, para recibir alertas. |
| HU-37 | Administrador | Ver el historial de intervenciones por activo, para evaluar criticidad y decidir reemplazos. |

### SPRINT 7 — Prestadores externos + KPIs / tablero
| HU | Rol | Historia |
|----|-----|----------|
| HU-40 | Administrador | Registrar un prestador externo en una OT, para tareas que exceden el equipo propio. |
| HU-41 | Administrador | Identificar áreas con mayor incidencia, para priorizar mejoras estructurales. |
| HU-42 | Administrador | Visualizar el consumo de materiales, para mejorar la planificación de compras. |
| HU-43 | Administrador | Ver la carga de trabajo diaria por técnico, para equilibrar asignaciones. |
| HU-44 | Administrador | Ver tiempos promedio de resolución, para evaluar la eficiencia del área o personal. |

### 13.1 ⭐ CORRECCIONES DE LAS HU (profe) + fix aplicado — _numeración vieja (histórico)_

| # | Observación de la profe | Fix aplicado |
|---|-------------------------|--------------|
| 1 | En una HU pueden participar más de un rol; el nº de HU por sprint se evalúa por **complejidad (story points)**, no por cantidad. | **Metodológico:** asignar **story points** a cada HU y **balancear sprints por puntos**. Aceptar HU con más de un rol participante. → *pendiente estimar puntos con el equipo.* |
| 2 | Al dar de alta técnicos hay que cargar sus **especialidades**; no todos hacen todas las tareas. | **HU-06 (modif):** gestionar técnicos **incluyendo su especialidad**. La asignación de técnico a tarea debe filtrar por especialidad. |
| 3 | Faltan HU para dar de alta **especialidades** y **tipos de activos**. | **+HU-45 (nueva):** ABM de especialidades. **+HU-46 (nueva):** ABM de tipos de activos. Ambas en **Sprint 1** (las necesitan HU-06 y HU-08). |
| 4 | Antes de HU-10 debería haber una HU de asignación de técnico para diagnóstico… pero **conviene SACAR HU-10**: proceso lento, burocrático, mucho dato intermedio. | **HU-10 ELIMINADA.** No se agrega el paso de diagnóstico por técnico. |
| 5 | Tras generar el ticket, el paso es validar/no la OT; **al validar se debe crear la OT automáticamente** desde ese ticket. (sacar HU-10) | **HU-11 (modif):** validar/rechazar ticket → **al validar se genera la OT automáticamente**. Refuerza eliminar HU-10. |
| 6 | **HU-17 antes de HU-16**: primero creo la OT y después veo si tengo materiales/herramientas. No tiene sentido cargar los materiales de la OT por adelantado (sería predecir). | **Reordenar:** HU-17 (crear OT) → luego HU-16 (ver stock). La OT **no exige** cargar materiales al crearla; los materiales se registran en la **ejecución** (HU-22). |
| 7 | **HU-19 y HU-18 van dentro de HU-17**: son parte de las tareas de crear una OT. | **HU-18 y HU-19 ABSORBIDAS en HU-17.** Crear OT incluye definir sus tareas y asignar técnicos. |
| 8 | ¿Puede haber solicitudes (tickets) sin OT generada/evaluada? | **Sí:** un ticket en estado **Creado** (sin validar) o **Rechazado** no tiene OT. Las HU de consulta de tickets deben **filtrar por estado**. |
| 9 | **HU-20 "priorizar"**: ¿qué significa priorizar en nuestro sistema? Debe servir de algo; no se entiende. | **HU-20 revisada:** la **prioridad** es un atributo que se define **al crear la OT** (parte de HU-17) y sirve para **ordenar el backlog / la lista de tareas del técnico** (HU-21). Se elimina como HU suelta salvo que se le dé un propósito propio claro. ❓ |
| 10 | **HU-21**: ¿en función de fecha prevista de inicio o de prioridad? Distintos filtros. | **HU-21 (clarif):** consultar tareas con **filtros por fecha prevista de inicio y/o prioridad**. |
| 11 | **HU-23** forma parte de la HU donde se ejecuta/registra la tarea. | **HU-23 ABSORBIDA en HU-22** (registrar repuestos + observaciones al ejecutar la tarea). |
| 12 | **HU-30 más arriba**: antes de crear una OT debo poder consultar los tickets. | **HU-30 movida a Sprint 2** (posible **merge con HU-12** "visualizar tickets"). |
| 13 | **HU-40 va al crear la OT**: una OT puede resolverla un técnico **o un prestador externo**. | **HU-40 ABSORBIDA en HU-17** (al crear la OT / asignar tarea se elige técnico **o** prestador externo). Coincide con la corrección del modelo de datos (prestador como atributo de TareaOT). |
| 14 | "Registrar ingreso de repuestos" ¿no es lo mismo que dar de alta en el catálogo de inventario? ¿Qué hace registrar ingreso? | **HU-15 (clarif):** *registrar ingreso por remito* = **movimiento que aumenta el stock** (cantidad) de un ítem ya existente. Es **distinto** del alta en catálogo (HU-14/HU-08/HU-38), que define el ítem. Aclarar esta diferencia en la HU. |

**Resumen de cambios:** ➕ HU-45, HU-46 · ❌ HU-10 · 🔀 HU-18, HU-19, HU-40, HU-23 absorbidas · 🔁 reorden HU-17↔16, HU-30 arriba · ✏️ HU-06, HU-11, HU-15, HU-20, HU-21 reescritas.

### 13.2 ROADMAP — HU FINALES (sincronizado con GitHub, 2026-07-16)

> ⚠️ **Las HU fueron RENUMERADAS.** GitHub es ahora la fuente de verdad del backlog: las HU van de **HU-1 a HU-34**, correlativas, y ya no se usan los números viejos (HU-05, HU-38, HU-45…). La columna *(antes)* conserva la equivalencia para poder leer las correcciones de §13.1, que están escritas con la numeración anterior.
> **Total: 35 HU** (HU-1…HU-34 + HU-39) + 4 tareas técnicas de setup (§13.2.1). **Convención:** el nº de HU coincide con el nº de issue. Los **story points son borrador**; escala Fibonacci (1, 2, 3, 5, 8, 13).
> Cada HU es un issue de GitHub, con milestone = sprint, labels `HU` / `rol:*` / `tipo:*` y sus **criterios de aceptación** (§13.2.1-bis). La columna **#** es el nº de issue.
>
> ⚠️ **Ojo con el tablero:** el Project board **no agrupa por milestone**, sino por un **campo propio del proyecto llamado `Sprint`**. Son dos cosas distintas que hay que mantener sincronizadas a mano. **El tablero es la fuente de verdad de la planificación** (decisión 2026-07-16); los milestones se alinearon a él.

**SPRINT 1 — Configuración base** · _SP = 21_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #1 | HU-1 | 3 | HU-05 | Como **administrador**, quiero gestionar los **edificios** de la facultad, para tener registrada la estructura edilicia donde se ubican los activos. |
| #2 | HU-2 | 3 | HU-47 | Como **administrador**, quiero gestionar los **espacios** dentro de un edificio, para localizar con precisión dónde está cada activo. |
| #3 | HU-3 | 3 | HU-48 | Como **administrador**, quiero gestionar las **áreas** funcionales, para habilitar la carga y asignación correcta de tickets. |
| #4 | HU-4 | 2 | HU-45 | Como **administrador**, quiero gestionar las **especialidades**, para clasificar a los técnicos según el tipo de trabajo que pueden realizar. |
| #5 | HU-5 | 3 | HU-06 | Como **administrador**, quiero gestionar los **técnicos**, asignarles su **especialidad** y disponibilidad, para saber con qué recursos humanos cuento al asignar una OT. |
| #6 | HU-6 | 2 | HU-46 | Como **administrador**, quiero gestionar los **tipos de activos**, para categorizarlos. |
| #7 | HU-7 | 5 | HU-08 | Como **administrador**, quiero gestionar los **activos físicos** y su ubicación, para mantener actualizado el inventario de activos. |

**SPRINT 2 — Ticket + consulta + estandarización** · _SP = 19_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #8 | HU-8 | 3 | HU-07 | Como **administrador**, quiero registrar **usuarios autorizados** y asignarles un área, para habilitarlos a cargar tickets. |
| #9 | HU-9 | 5 | HU-09 | Como **usuario autorizado**, quiero registrar un **ticket**, para informar una necesidad de mantenimiento. |
| #10 | HU-10 | 5 | HU-12 | Como **administrador**, quiero **visualizar y consultar los tickets** mediante filtros, para localizar rápidamente las solicitudes. _(fusiona la vieja HU-30)_ |
| #11 | HU-11 | 5 | HU-11 | Como **administrador**, quiero **validar o rechazar un ticket**, para determinar si se genera la OT. |
| #12 | HU-12 | 3 | HU-13 | Como **administrador**, quiero gestionar la **plantilla de tareas**, para estandarizar la creación de las OT. |
| #13 | HU-13 | 3 | HU-14 | Como **administrador**, quiero gestionar los **ítems de inventario**, para mantener actualizado el catálogo del depósito. |

**SPRINT 3 — Orden de Trabajo + stock** · _SP = 22 (⚠️ el más cargado)_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #14 | HU-14 ⭐ | 8 | HU-17 | Como **administrador**, quiero **crear la OT** a partir de un ticket, para planificar la ejecución del mantenimiento. _(absorbe las viejas HU-18, HU-19, HU-20: tareas, prioridad, técnico/prestador — cubre también la vieja HU-40, ver #40 cerrada)_ |
| #15 | HU-15 | 3 | HU-16 | Como **administrador**, quiero **visualizar el stock** de materiales y herramientas, para verificar la disponibilidad. |
| #16 | HU-16 | 3 | HU-15 | Como **administrador**, quiero **registrar el ingreso por remito**, para actualizar el stock. |
| #17 | HU-17 | 5 | HU-38 | Como **administrador**, quiero **importar el inventario inicial desde Excel**, para agilizar la carga inicial. |
| #34 | HU-34 | 3 | HU-50 | Como **administrador**, quiero registrar la **falla asociada a cada tarea de la OT**, para clasificar el problema y darle trazabilidad. |

**SPRINT 4 — Ejecución + cierre** · _SP = 15 (+ HU-39 sin estimar)_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #18 | HU-18 | 5 | HU-21 | Como **técnico**, quiero **consultar mis tareas asignadas** con filtros, para saber qué debo hacer. |
| #19 | HU-19 | 5 | HU-22 | Como **técnico**, quiero registrar en la tarea los **repuestos/materiales utilizados**, para asegurar la trazabilidad. _(las observaciones van aparte, en HU-39)_ |
| #20 | HU-20 | 3 | HU-26 | Como **administrador**, quiero que el **ticket se cierre automáticamente** cuando su OT se finaliza, para concluir el proceso de mantenimiento. |
| #33 | HU-33 | 2 | HU-49 | Como **administrador**, quiero gestionar los **prestadores de servicio**, para poder asignarlos a las tareas de una OT. |
| #39 | HU-39 | ❓ | HU-23 | Como **técnico**, quiero agregar una **observación** a una tarea, para registrar actividades adicionales. |

**SPRINT 5 — Seguimiento + preventivo** · _SP = 19_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #21 | HU-21 | 3 | HU-27 | Como **administrador**, quiero **consultar las OT**, para hacer seguimiento de las tareas programadas. |
| #22 | HU-22 | 8 | HU-29 | Como **administrador**, quiero gestionar los **planes de mantenimiento preventivo**, para anticiparme a las fallas. |
| #23 | HU-23 | 3 | HU-32 | Como **usuario autorizado**, quiero **consultar mis tickets** y su estado, para hacer seguimiento de mis solicitudes. |
| #28 | HU-28 | 5 | HU-37 | Como **administrador**, quiero ver el **historial de intervenciones por activo**, para evaluar su criticidad. |

**SPRINT 6 — Autenticación / usuarios / alertas** · _SP = 14_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #24 | HU-24 | 3 | HU-33 | Como **usuario**, quiero **ingresar con mis credenciales**, para acceder de forma segura al sistema. |
| #25 | HU-25 | 3 | HU-34 | Como **administrador**, quiero **restablecer la contraseña** de un usuario, para devolverle el acceso al sistema cuando la olvida. _(reescrita 2026-07-16: el flujo de autogestión requería correo, que quedó fuera del alcance)_ |
| #26 | HU-26 | 5 | HU-35 | Como **administrador**, quiero **gestionar los usuarios y sus permisos**, para controlar los accesos al sistema. |
| #27 | HU-27 | 3 | HU-36 | Como **administrador**, quiero configurar **alertas de stock mínimo**, para saber cuándo reponer. |

**SPRINT 7 — KPIs / Tablero** · _SP = 18_

| # | HU | SP | (antes) | Historia |
|---|----|----|---------|----------|
| #29 | HU-29 | 5 | HU-41 | Como **administrador**, quiero identificar las **áreas con mayor incidencia**, para priorizar mejoras estructurales. |
| #30 | HU-30 | 3 | HU-42 | Como **administrador**, quiero visualizar el **consumo de materiales**, para mejorar la planificación de compras. |
| #31 | HU-31 | 5 | HU-43 | Como **administrador**, quiero ver la **carga de trabajo diaria por técnico**, para equilibrar las asignaciones. |
| #32 | HU-32 | 5 | HU-44 | Como **administrador**, quiero ver los **tiempos promedio de resolución**, para evaluar la eficiencia del área. |

#### 13.2.1 SPRINT 0 — Tareas técnicas de setup (T1–T4) · _SP = 8_

Son **tareas técnicas**, no HU de negocio (no tienen rol de usuario ni valor para el usuario final). Llevan label `tipo:setup`. Ocupan los números viejos HU-01 a HU-04, que §13.1 daba por eliminados: en realidad se reconvirtieron en estas tareas.
**Van en el Sprint 0** = trabajo previo al 10/08, antes de arrancar el desarrollo.

| # | Tarea | SP | Descripción |
|---|-------|----|-------------|
| #35 | **T1** | 1 | Configurar el **repositorio** del proyecto, para permitir el trabajo en paralelo y mantener el historial de cambios. |
| #36 | **T2** | 2 | Definir la **estructura de carpetas** (backend y frontend), para trabajar sobre una estructura común. |
| #37 | **T3** | 3 | Definir la **base de datos** a partir del modelo de tablas, para garantizar la integridad de los datos. |
| #38 | **T4** | 2 | Configurar la **ejecución local** del proyecto, para que cualquier integrante pueda levantarlo. |

> ✅ **RESUELTO (2026-07-16):** el tablero ya tenía un grupo **Sprint 0** con estas 4 tareas; se creó el **milestone `Sprint 0`** (vence 09/08/2026) y se les asignó, de modo que tablero y milestone coinciden. Al quedar fuera del Sprint 1, este baja a 21 SP.

#### 13.2.1-bis ✅ CRITERIOS DE ACEPTACIÓN — COMPLETOS (2026-07-16)

Las **35 HU tienen sus criterios de aceptación cargados en su issue**: 173 criterios, ~5 por HU. Las tareas técnicas T1–T4 no llevan (son técnicas, no HU de negocio).

Los criterios **son los casos de prueba**: las pruebas del prototipo se hacen verificando cada HU contra ellos (ver §14–15).

##### ⚠️ Hallazgos al escribirlos — VAN AL MODELO DE TABLAS (§11)

Escribir los criterios obligó a mirar HU por HU contra el modelo, y aparecieron **cuatro huecos**. Los cuatro hay que resolverlos al corregir el modelo para la entrega:

| # | Hueco | Impacto |
|---|-------|---------|
| 1 | **No existe tabla `especialidades`.** Hoy `tecnicos.especialidad` es un campo de texto suelto, pero HU-4 (#4) pide su ABM. | Crear la tabla y que `tecnicos` apunte a ella. ❓ **Decidir:** ¿un técnico puede tener **más de una** especialidad? Si sí, es N:M y hace falta tabla intermedia. |
| 2 | **No hay dónde guardar las credenciales.** No existe tabla `usuarios`, y `administradores`/`tecnicos`/`autorizados` tienen email pero **no contraseña ni rol**. | **Bloquea 3 HU** del Sprint 6: HU-24 (login), HU-25 (restablecer contraseña) y HU-26 (gestionar usuarios). Probablemente se perdió al eliminar la tabla `personas`. **Propuesta:** crear `usuarios(idUsuario, usuario, passwordHash, rol, activo, → persona)`. |
| 3 | **Las plantillas de tareas no se vinculan al tipo de activo.** `plantillaTareasOT` solo tiene descripción. | La automatización *"al crear la OT, precarga las tareas estándar según el tipo de activo"* (§13.4) **no se puede implementar** con el modelo actual. |
| 4 | **Nadie cambiaba el estado de las tareas.** Los estados *Pendiente → En ejecución → Completada* existen en glosario y modelo, pero ninguna HU los cubría: HU-18 solo consulta, HU-39 solo observa y HU-20 se dispara recién *después*. | ✅ **Resuelto:** se incorporaron a **HU-19** (#19), que pasó a llamarse *"Ejecutar la tarea y registrar los materiales utilizados"*. Sin esto, la cadena de automatismos (activo → En mantenimiento, OT finalizada, ticket cerrado) no arranca nunca. |

##### ❓ Decisiones abiertas que surgieron

1. **Dependencia de sprint:** HU-14 (#14, crear OT, **Sprint 3**) permite asignar un prestador, pero HU-33 (#33, ABM de prestadores) está en el **Sprint 4**. → Adelantar HU-33 al Sprint 3 (son 2 SP), o asignar solo técnicos en el Sprint 3.
2. **Cancelación de OT:** el glosario la define con sus 4 motivos y el estado *Cancelada* está en el modelo, pero **ninguna HU la implementa**. No es lo mismo que rechazar un ticket: el rechazo filtra **antes** de que exista la OT; la cancelación cubre lo que se descubre **después** (ej.: el técnico va y la reparación es innecesaria). → Si no se implementa, sacar el estado *Cancelada* del modelo.
3. **HU-32 (tiempos de resolución):** definir **qué se mide**. ¿Ticket creado → cerrado (incluye la demora en validar y asignar) o OT asignada → finalizada (solo el trabajo del técnico)? Son indicadores distintos.
4. **KPIs sin datos:** todo el Sprint 7 necesita **historia acumulada** para verse. Al ser el último sprint, llega sin datos → preparar datos de prueba que simulen meses de operación, o el tablero estará vacío en la demo.
5. **HU-5 / baja de técnicos:** "no disponible" (está ocupado/de licencia) no es lo mismo que "ya no trabaja acá". Si se quiere distinguir, hace falta un campo `activo` aparte.

##### Cambios aplicados a los issues al escribir los criterios

- **#34** pasó de `rol:admin` a **`rol:tecnico`**: la falla se identifica en el diagnóstico, y el diagnóstico lo hace el técnico en el lugar (corrección #4 de la profe). Un admin en su oficina no sabe si la falla es eléctrica o mecánica.
- **#19** retitulada a *"Ejecutar la tarea y registrar los materiales utilizados"* (ver hueco 4).
- **#39** se le cargaron labels (`HU`, `rol:tecnico`, `tipo:flujo`) y **2 SP**, que le faltaban.
- **#11** título unificado al patrón `[5 SP]`; **#1** cuerpo desduplicado.
- **T1–T4**: se les quitó la sección de criterios (no corresponde).

---

#### 13.2.2 Inconsistencias detectadas en GitHub (2026-07-16)

**Hallazgo de fondo:** la numeración duplicada y la ausencia en el Project board eran **el mismo problema**. Al armar el tablero se agregaron los issues buscándolos *por título*: como #7 y #8 se llamaban ambos "HU-8", se agregó uno solo; ídem con #20 y #26 ("HU-26"). El tablero mostraba **38 de 41** issues y el Sprint 1 aparecía con 6 ítems en vez de 8, ocultando 5 SP de trabajo real (gestionar activos físicos).

**Además:** el board **no agrupa por milestone** sino por un **campo propio `Sprint`**. Agregar un issue al board no lo ubica en ningún sprint: hay que cargarle ese campo aparte. Y como ambos se mantienen a mano, se habían **desincronizado** en tres HU (#8, #28, #33), con el tablero y los milestones contando dos planificaciones distintas. **Decisión (2026-07-16): manda el tablero**; los milestones se alinearon a él.

**✅ CORREGIDO (2026-07-16):**

| Issue | Problema | Qué se hizo |
|-------|----------|-------------|
| **#7** | Titulado `HU-8 · Gestionar activos físicos` → había **dos HU-8** (#7 y #8) y **no existía HU-7**. Además no estaba en el tablero. | Renombrado a **`HU-7 · Gestionar activos físicos [5 SP]`** y **agregado al Project board**. |
| **#20** | Titulado `HU-26 · Cerrar ticket…` → había **dos HU-26** (#20 y #26) y **no existía HU-20**. El título arrastraba la nota *"HU MAL (…)"* y el cuerpo decía que el admin cierra el ticket a mano. Tampoco estaba en el tablero. | Renombrado a **`HU-20 · Cierre automático del ticket al finalizar la OT [3 SP]`**, **cuerpo reescrito** con criterios de aceptación acordes al cierre automático (decisión 2026-07-14, §3.4) y **agregado al Project board**. |
| **#41** | `HU-3.1` — sin milestone ni título descriptivo; cuerpo **idéntico a #8**. | **Cerrado como duplicado** de HU-8 (#8). |
| **#8, #28, #33** | El **campo `Sprint` del tablero y el milestone se contradecían**: #8 (board S2 / milestone S1), #28 (board S5 / milestone S6), #33 (board S4 / milestone S3). | **Milestones alineados al tablero:** #8 → Sprint 2, #28 → Sprint 5, #33 → Sprint 4. |
| **T1–T4** | En el tablero ya estaban en un grupo **Sprint 0**, pero **sin milestone**. | Creado el **milestone `Sprint 0`** (vence 09/08/2026) y asignado a #35–#38. |
| **#39** | Se titulaba `HU-19.1 Registrar observaciones`, con formato de sub-HU sin serlo. Parecía duplicada de la vieja HU-23, absorbida en HU-19. | **Renombrada a `HU-39` (2026-07-16); el equipo confirmó que es una HU válida.** Queda como HU propia en el Sprint 4 → la corrección #11 (observaciones → HU-19) **queda sin efecto**. |
| **#40** | `HU-28.2 · Prestadores Externos` (renombrada a `HU-40`), sin milestone. | **Cerrada (2026-07-16):** su contenido ya está cubierto por **HU-33** (ABM de prestadores) + **HU-14** (al crear la OT se elige técnico *o* prestador). Coincide con la **corrección #13** de la profe y con el modelo (`tareasOT.idPrestadorServicio`). |

**Resultado:** HU-1 … HU-34 + HU-39 sin duplicados ni huecos · board **39/39** issues activos · **milestone = campo Sprint** en todas las HU salvo #39 (pendiente) · Sprint 0 formalizado.

**⬜ PENDIENTE:**

| Issue | Problema | Corrección propuesta |
|-------|----------|----------------------|
| **#39** | HU válida, pero **sin milestone**, **sin labels** y **sin SP en el título**. En el tablero está en Sprint 4. | Asignar milestone `Sprint 4`, labels (`HU`, `rol:tecnico`, `tipo:flujo`) y estimar SP. |
| **#1** | El cuerpo tiene **dos redacciones de la misma HU** pegadas y separadas por `----------`. | Dejar una sola. |
| **Todas** | Los criterios de aceptación dicen `- [ ] (a definir con el equipo)` (salvo #20, ya completo). | Completarlos, al menos en las HU del Sprint 1, antes de arrancar el desarrollo. |
| **#11, #19** | Formato de título inconsistente: `HU-11 · Validar/rechazar ticket 5 SP` (sin corchetes) y `HU-19 · Registrar repuestos[5 SP]` (sin espacio). | Unificar al patrón `HU-N · Título [N SP]`. |

**Convención de títulos e issues (la que ya usan):**
- **Título:** `HU-N · <acción concreta> [N SP]` — por ejemplo `HU-14 · Crear OT [8 SP]`.
- **Cuerpo:** la historia en formato *Como \<rol\>, quiero \<acción\>, para \<beneficio\>*, seguida de `**Story points (borrador):** N`, `**Sprint:** Sprint N` y el bloque `### Criterios de aceptación` con checkboxes.
- **Labels:** `HU` + `rol:{admin|tecnico|autorizado|usuario|desarrollador}` + `tipo:{ABM|flujo|inventario|auth|KPI|setup}`.
- **Milestone:** el sprint correspondiente.

**Resumen SP por sprint** (según el tablero, 2026-07-16):

| Sprint | S0 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | Total |
|--------|----|----|----|----|----|----|----|----|-------|
| **HU/tareas** | 4 | 7 | 6 | 5 | 5 | 4 | 4 | 5 | 40 |
| **SP** | 8 | 21 | 19 | **22** | 15 | 19 | **14** | 18 | **136** |

El reparto quedó **bastante balanceado**: entre 14 y 22 SP por sprint (antes, con el reparto de los milestones, iba de 13 a 24). El más cargado es **S3** (22 SP) por HU-14 *Crear OT* (8 SP), que es la HU más grande del proyecto; el más liviano, **S6** (14 SP). Los SP siguen siendo **borrador**: confirmarlos al estimar en equipo (corrección #1 de la profe).

### 13.3 Gaps detectados al analizar flujo + prototipo (2026-07-09) — _actualizado a la numeración nueva_
- ✅ **RESUELTO — Prestadores:** creada **HU-33** (#33, gestionar prestadores + tipos de prestación), Sprint 3. En el prototipo y GitHub. _(era HU-49)_
- ✅ **RESUELTO — Fallas:** creada **HU-34** (#34, registrar la falla asociada a cada tarea de la OT), Sprint 3. En el prototipo y GitHub. _(era HU-50)_
- ✅ **Plantillas→OT:** ya contemplado por **HU-12** (crea plantillas) + **HU-14** (las aplica al crear la OT). No requiere HU nueva.
- ❓ **Cancelación de OT:** el glosario la define (con motivo) pero no hay HU ni flujo. ¿Se agrega? (no seleccionada por ahora)
- ❓ **Proveedores + Compras:** el modelo los tiene pero no hay HU. Definir si entran en el alcance.
- ❓ **Evidencia fotográfica:** se mantiene en el alcance (los campos `tickets.evidencia` / `ordenesTrabajo.evidencia` y el término del glosario existen). HU-9 no la menciona explícitamente → sumarla a sus criterios de aceptación. **Decisión abierta (2026-07-16): revisar al final si se sostiene o se saca de la versión inicial.**
- 💡 **Automatizable:** alerta de stock mínimo (HU-27) como aviso **dentro del sistema** (sin correo, ver alcance §3.4); sugerir técnicos por especialidad al asignar tareas.
- ✅ Cobertura prototipo: **34/34 HU** representadas. Automatizado ya: validar→OT (HU-11), egreso/baja de stock al completar tarea, OT finalizada al completar todas las tareas, y plan preventivo→genera OT (HU-22).

### 13.4 Automatizaciones / reglas de negocio (NO son HU nuevas) — _numeración nueva_
Se implementan como **criterios de aceptación de HU existentes** (evita fragmentar el backlog, como pidió la profe):
- **Estado de activo automático:** activo → "En mantenimiento" al poner la OT en ejecución; → "Operativo" al finalizarla. → regla de **HU-14 / HU-20 / HU-7**.
- **Técnico sugerido por especialidad:** al asignar tarea, se priorizan (⭐) los técnicos cuya especialidad matchea el tipo de activo. → criterio de **HU-14** (usa HU-5).
- **Materiales sugeridos:** al ejecutar, se proponen materiales según la falla; el técnico solo confirma. → criterio de **HU-19**.
- **Aviso de ticket duplicado:** al registrar, avisa si el activo ya tiene un ticket abierto (no bloquea, el usuario decide). → criterio de **HU-9**.
- **Tareas precargadas por plantilla:** al crear la OT, precarga las tareas estándar según el tipo de activo. → **HU-12 / HU-14**.
- **Preventivos por vencimiento:** el dashboard detecta planes que vencen (≤7 días) y ofrece generar la OT. → **HU-22**.
- **Cierre automático:** al completarse la última tarea, la OT pasa a *Finalizada* y su ticket a *Cerrado*, sin intervención manual. → **HU-20**.
- **Orden automático de tareas (técnico):** su lista se ordena sola por prioridad + fecha prevista. → **HU-18**.
- **Notificación de asignaciones:** badge en el menú del técnico con el nº de tareas pendientes. → **HU-18**.
- **Observaciones en la tarea:** el técnico registra actividades adicionales al ejecutar. → **HU-39** (#39), HU propia; el equipo decidió no absorberla en HU-19.
- Ya existentes: validar→OT (**HU-11**), egreso/stock al completar, OT finalizada auto, preventivo→OT (**HU-22**).

> **Corrección (prioridad del ticket):** la prioridad **NO** la carga el usuario autorizado. Según el glosario, la prioridad la asigna el área de infraestructura **a la OT**, y la tabla `tickets` del diccionario **no tiene** `prioridad`. Se quitó del alta de ticket; el admin la define en las **tareas de la OT** (**HU-14**). El prototipo la tenía mal en el ticket → corregido.

---

## 14–15. Herramientas de equipo · Arquitectura HW/SW

⬜ **Pendiente.**

---

## Preguntas abiertas (❓ decisiones del equipo)
1. ✅ **RESUELTO (2026-07-09):** Personas es exclusiva de SIGMA → **se elimina**; los datos personales van en administradores/tecnicos/autorizados.
2. ✅ **RESUELTO (2026-07-16):** el ticket **no lleva diagnóstico de ningún tipo**. Se eliminan `diagnosticoEstado`, `diagnosticoDescripcion` y también `preDiagnostico`. El único diagnóstico es el del **técnico**, que se carga en la tarea de la OT junto con la falla (HU-34/#34). _(Revisa la decisión previa del 2026-07-15, que mantenía el `preDiagnostico` del admin: al escribir los criterios de HU-11 el equipo lo quitó del flujo de validación, y un campo que nadie carga es una columna muerta — justo lo que objetó la profe en esta misma corrección.)_
3. `clasificacionActivos`: ¿N:M o un activo tiene un único `idTipoActivo`?
4. Dependencia circular `areas ↔ autorizados`: ¿cómo la resolvemos? --- SOLUCIONADO: SE SEPARA, dejamos en la tabla de autorizados el FK al área
5. ¿Mantenemos `tecnicoControlaActivo`?
6. `personasConformanFacultad`: si la facultad es única, ¿pasa a atributo? SOLUCIÓN: La facultad no es única por lo que no la consideramos atributos, varias personas pueden trabajar en varias facultades 

---

## 14. Restricciones de Diseño y UI
Las siguientes reglas deben aplicarse estrictamente durante el desarrollo de la interfaz:
1. **Botones de Alta:** Los botones con la funcionalidad de un alta de algún registro tienen que llamarse estrictamente "Agregar".
2. **Filtros (Barra de Filtros Horizontales):**
   - **Estructura:** Campo de búsqueda global (input con ícono de lupa) a la izquierda, seguido de la etiqueta "Filtrar por:" y selectores desplegables (dropdowns) para las facetas (AND lógico).
   - **Nombres de etiquetas:** NINGÚN filtro en su nombre (etiqueta) debe contener el prefijo "Tipo de ". Debe usarse directamente el sustantivo descriptivo (ej. "Activo", "Espacio", "Material", etc.).
   - **Comportamiento:** Filtrado reactivo combinado en la misma línea superior, maximizando el espacio vertical, tal como el diseño utilizado en la pantalla "Listado de activos".
3. **Casillas de Texto:** Deben tener el tamaño acorde a la información que va dentro. Se debe hacer un diseño detallado evaluando el tamaño convencional esperado.
4. **Menús Laterales:** Revisar el tamaño del texto; tomar las medidas correspondientes para que la barra lateral no corte el texto.
5. **Responsividad:** Todas las pantallas nuevas y ya creadas deben ser responsivas y multiplataforma, adaptándose a todos los tipos de pantallas y resoluciones.
6. **Uso de Colores (MÁS IMPORTANTE):** Los textos no deben tener un formato de colores si no tienen una explicación o referencia de qué significa cada color. Si te piden que un texto tenga color, siempre debés solicitarle qué significado tiene cada uno.
