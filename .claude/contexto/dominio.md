# Dominio: roles, flujo y glosario

## Los 3 roles

| Rol | Qué hace |
|---|---|
| **Administrador** | Máximos permisos. Valida o rechaza tickets, arma las OT, asigna técnicos o prestadores, gestiona activos, espacios, inventario y planes preventivos. |
| **Técnico** | Ejecuta las tareas de la OT. Tiene especialidad y disponibilidad. Registra materiales consumidos, herramientas usadas y observaciones. |
| **Usuario autorizado** | Es el responsable de un área. Registra tickets de su ámbito y consulta su estado. Es quien reporta el problema. |

Los tres cubren todo el sistema y no se superponen.

---

## El flujo principal (correctivo)

```
1. El usuario autorizado detecta un desperfecto y registra un TICKET
   (descripción, objeto afectado, foto opcional)
        ↓
2. El administrador VALIDA o RECHAZA el ticket
        ↓  (si valida)
3. Se genera AUTOMÁTICAMENTE la ORDEN DE TRABAJO (OT)
        ↓
4. El administrador carga las TAREAS: prioridad, falla y responsable
   de cada una (técnico propio o prestador externo)
        ↓
5. El técnico EJECUTA su tarea: registra materiales consumidos
   (baja de stock automática), herramientas y observaciones
        ↓
6. Al completarse la ÚLTIMA tarea:
   la OT pasa a Finalizada y el ticket se CIERRA automáticamente
```

**El cierre es automático.** No se pide conformidad del usuario que reportó el problema.

## El flujo preventivo

```
Plan preventivo (tipo de activo + frecuencia + plantilla de tareas)
        ↓  (automático, según la frecuencia)
OT preventiva  →  mismas tareas y ejecución que el flujo correctivo
```

Una OT viene **o de un ticket, o de un plan preventivo**. Nunca de los dos.

---

## Estados

| Entidad | Estados |
|---|---|
| **Ticket** | Creado → Validado → Asignado → En ejecución → Finalizado → Cerrado · (o Rechazado) |
| **Orden de trabajo** | Creada → Asignada → En ejecución → Finalizada · (o Cancelada) |
| **Tarea de OT** | Pendiente → En ejecución → Completada |
| **Activo** | Operativo → En mantenimiento → Fuera de servicio → Retirado |
| **Herramienta** | Disponible → En uso → En reparación |

---

## Automatismos

No son historias de usuario aparte: son reglas dentro de historias existentes.

| Automatismo | Cuándo pasa |
|---|---|
| Se crea la OT | Al validar un ticket. |
| Baja de stock | Al registrar el consumo de un material en una tarea. |
| Activo → En mantenimiento | Cuando la OT pasa a En ejecución. |
| Activo → Operativo | Cuando la OT se finaliza. |
| OT → Finalizada | Cuando se completa la última tarea. |
| Ticket → Cerrado | Cuando su OT se finaliza. |
| Técnico sugerido | Al asignar la tarea, se destacan los que coinciden con el tipo de trabajo. |
| Materiales sugeridos | Al ejecutar, se proponen materiales según el tipo de falla. |
| Aviso de duplicado | Al registrar un ticket, avisa si ese objeto ya tiene uno abierto. No bloquea. |
| Tareas precargadas | Al crear la OT, se cargan las tareas estándar según el tipo de activo. |
| Alerta de stock mínimo | Cuando un material llega a su mínimo. Aviso dentro del sistema, no por mail. |
| OT preventiva | El sistema la genera según la frecuencia del plan. |

> La **prioridad** la define el administrador **en la OT**, no el usuario que carga el ticket.

---

## Entidades principales

Agrupadas por tema, para tener el mapa general:

| Tema | Entidades |
|---|---|
| **Estructura física** | Edificio · Espacio · Área |
| **Activos** | Tipo de activo · Activo · Falla |
| **Personas** | Administrador · Técnico · Usuario autorizado · Usuario (credenciales) |
| **Trabajo** | Ticket · Orden de trabajo · Tarea de OT · Plantilla de tareas |
| **Preventivo** | Plan de mantenimiento preventivo |
| **Externos** | Prestador de servicio · Tipo de trabajo |
| **Depósito** | Ítem de inventario → Material / Herramienta · Proveedor · Compra · Línea de compra |

> ⚠️ **El modelo de tablas se está rehaciendo.** No dar por firme ninguna estructura
> concreta hasta que estén las migraciones en `supabase/migrations/`.

---

## Glosario

| Término | Qué es |
|---|---|
| **Activo** | Elemento físico de la facultad que requiere mantenimiento: mobiliario, aires, luminarias, equipos. |
| **Área** | Unidad organizacional de la facultad. Tiene un responsable (el usuario autorizado). |
| **Cancelación de OT** | Terminar una OT antes de tiempo. Motivos: ticket inválido o duplicado, activo dado de baja, reparación innecesaria, o se terceriza. |
| **Compra** | Registro de una adquisición de materiales o herramientas. Tiene líneas de compra y un proveedor. |
| **Disponibilidad** | Indica si el técnico puede tomar tareas nuevas. Junto con el tipo de trabajo define a quién se le asigna. |
| **Edificio** | Construcción de la facultad. Contiene espacios. |
| **Egreso** | Salida de un material o herramienta del depósito. Baja el stock. |
| **Espacio** | Lugar dentro de un edificio: aula, laboratorio, oficina, pasillo. |
| **Evidencia** | Fotos que se adjuntan a un ticket o a una OT. |
| **Falla** | Clasificación del problema: eléctrica, mecánica, estructural, sanitaria. Se registra en la tarea de la OT. |
| **Herramienta** | Instrumento que no se consume y se devuelve al depósito. |
| **Ingreso** | Entrada de materiales al depósito por remito. Sube el stock. |
| **Inventario de activos** | Registro de los activos instalados, con ubicación, estado e historial. |
| **Inventario de depósito** | Registro de cuánto hay de cada material y herramienta. |
| **Ítem de inventario** | Elemento del depósito. Se divide en materiales (se consumen) y herramientas (se devuelven). |
| **Línea de compra** | Cada renglón de una compra: producto, cantidad y monto. |
| **Mantenimiento correctivo** | Se repara algo que ya se rompió. Nace de un ticket. |
| **Mantenimiento preventivo** | Se hace antes de que falle. Nace de un plan. |
| **Material** | Insumo que se consume al usarlo. Descuenta stock. |
| **Orden de Trabajo (OT)** | Autorización de trabajo. Se genera al validar un ticket o desde un plan preventivo. |
| **Plan de mantenimiento preventivo** | Define qué activos se intervienen, cada cuánto y con qué tareas. Genera OT automáticamente. |
| **Plantilla de tareas** | Tarea modelo asociada a un tipo de activo. Sirve para precargar tareas estándar. |
| **Prestador de servicio** | Empresa o profesional externo que hace trabajos que el equipo propio no puede cubrir. |
| **Prioridad** | Nivel de importancia que el administrador le pone a la OT. |
| **Proveedor** | Quien le vende materiales y herramientas a la facultad. |
| **Remito** | Comprobante del ingreso de materiales al depósito. |
| **Stock** | Cantidad disponible de un material. |
| **Stock mínimo** | Cantidad mínima que hay que tener. Al llegar, el sistema avisa. |
| **Tarea (de OT)** | Actividad concreta dentro de una OT. Cuando todas están completas, la OT se finaliza. |
| **Técnico** | Personal de la facultad que ejecuta las tareas. |
| **Ticket** | Registro formal de una necesidad de mantenimiento. Es la puerta de entrada al sistema. |
| **Tipo de activo** | Categoría de activos: aires acondicionados, mobiliario, luminarias. |
| **Tipo de trabajo** | Clasificación del trabajo técnico: eléctrica, refrigeración, sanitaria, civil. La usan tanto los técnicos como los prestadores externos. |
| **Trazabilidad** | Poder seguir el historial completo de un ticket, una OT o un activo. |
| **Usuario autorizado** | Responsable de un área, habilitado para cargar tickets y consultar su estado. |
