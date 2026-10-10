# Dominio: roles, flujo y glosario

## Los 3 roles

| Rol | Qué hace |
|---|---|
| **Administrador** | Máximos permisos. Valida o rechaza tickets, arma las OT, asigna técnicos o prestadores, gestiona activos, espacios, inventario y planes preventivos. |
| **Técnico** | Ejecuta las tareas de la OT. Tiene especialidad y disponibilidad. Registra materiales consumidos, herramientas usadas y observaciones. |
| **Usuario autorizado** | Es el responsable de un área. Registra tickets de su ámbito y consulta su estado. Es quien reporta el problema. |

**Reglas clave de usuarios autorizados:**
* **Edad:** Deben ser mayores de edad (>= 18 años). El sistema bloquea el alta si la fecha de nacimiento no cumple este requisito.
* **Asignación de Áreas:** La relación con el Área es 1 a 1. Un área solo puede tener *un* responsable asignado. Al cargar o editar un usuario, el sistema solo lista las áreas "libres". Si todas las áreas ya tienen responsable, se debe crear un área nueva o liberar una existente.

Los tres cubren todo el sistema y no se superponen.

---

## El flujo principal (correctivo)

```
1. El usuario autorizado detecta un desperfecto y registra un TICKET
   (descripción, objeto afectado -activo-, foto opcional). 
   *Nota de negocio: El usuario autorizado solo puede registrar tickets sobre activos que pertenezcan a las áreas/espacios que tiene asignados bajo su legajo.*
        ↓
2. El administrador VALIDA o RECHAZA el ticket
        ↓  (si valida)
3. Se genera AUTOMÁTICAMENTE la ORDEN DE TRABAJO (OT)
        ↓
4. El administrador carga las TAREAS: prioridad y responsable
   de cada una (técnico propio o prestador externo)
        ↓
5. El técnico diagnostica la tarea en el lugar y, si corresponde, registra
   la falla (tipo y descripción); después ejecuta y registra materiales,
   herramientas y observaciones
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
| **Herramienta** | Disponible ⇄ En uso · Fuera de servicio |

> **Decisiones del 13/09/2026 (HU-10, consulta de tickets):**
> - Los estados del ticket viven en `backend/src/servicios/tickets.servicio.js` (`ESTADOS`) y
>   se exponen en `GET /api/tickets/estados`. Todo ticket nuevo se guarda como **Creado**.
>   Los primeros tickets quedaron guardados como `ABIERTO` (default viejo de la tabla): el
>   backend los lee y los filtra como "Creado". No se cambió la base.
> - **El área de un ticket es la del espacio donde está el activo** (`area.espacio_id`).
>   El ticket no tiene FK a área. Si el espacio no tiene área asignada, el ticket se muestra
>   "Sin área".

> **Decisiones del 21/09/2026 (HU-14, crear la OT):**
> - Los estados de la OT y de sus tareas, y las prioridades, viven en
>   `backend/src/servicios/ordenesTrabajo.servicio.js` y se exponen en
>   `GET /api/ordenes-trabajo/estados` y `/prioridades`. Como pasó con los tickets, la base
>   guarda los valores viejos en mayúscula (`PENDIENTE`, `MEDIA`): el backend los lee como
>   "Creada" y "Media". No se cambió la base.
> - **La OT sale de un ticket VALIDADO y de ninguno otro.** Antes de validarlo no se sabe si
>   el trabajo se va a hacer; y si el ticket ya avanzó (asignado, en ejecución, cerrado) su OT
>   ya existe. El botón "Crear OT" del detalle del ticket sólo aparece si está "Validado".
> - **Las tareas se planifican para adelante:** ni el inicio ni el fin previstos pueden ser
>   anteriores a hoy. Al editar una tarea vieja, la fecha que ya estaba guardada se respeta:
>   sólo se rechaza si se la cambia por otra que también quedó atrás.
> - **La prioridad es de la TAREA, no de la OT.** La tabla `tarea_ot` ya tiene
>   `tarea_prioridad`, y una misma OT puede tener una tarea urgente y otra que puede esperar.
>   La OT muestra la prioridad más alta de sus tareas; no se guarda.
>   *Cambio del 09/10/2026:* esa prioridad calculada es ahora la **sugerida**. El
>   administrador puede poner otra a mano en el detalle de la OT (`orden_trabajo.ot_prioridad`),
>   y esa manda. Si la borra, la OT vuelve a usar la sugerida.
> - **El estado de la OT no se carga a mano, se calcula:** sin tareas, o con alguna sin
>   responsable, queda en "Creada"; cuando todas tienen responsable pasa a "Asignada".
> - **El ticket acompaña a su OT:** cuando la OT queda "Asignada", el ticket pasa a
>   "Asignado", y vuelve a "Validado" si la OT vuelve a "Creada". Sólo se mueve entre esos
>   dos estados: si el ticket ya está más adelante en el flujo, no retrocede.
> - **Una tarea tiene un solo responsable:** un técnico propio *o* un prestador externo,
>   nunca los dos (corrección #13 de la profe). Puede quedar sin asignar mientras se planifica.
> - Los **prestadores de servicio** son por ahora de sólo lectura (`GET /api/prestadores`):
>   se listan para poder elegirlos en una tarea. El ABM es la HU-33.
> - **La duración de una tarea se escribe y se lee en horas y minutos** ("30 min", "1 h 30 min"),
>   aunque en la base siga guardándose en horas con decimales (`tarea_ot.tarea_hom`, 0.5 = 30 min).
>   La caja deja escribir libremente y sugiere las duraciones más comunes (de 15 min a 8 h);
>   entiende "30 min", "1h30", "1:30", "2 hs" y un número solo (que son horas). Las cuentas
>   están en `frontend/src/utils/duracion.js`.

> **Decisión del 26/09/2026 (diagnóstico de fallas):**
> - La falla se registra al diagnosticar la tarea en el lugar, no al planificar la OT.
> - Cada tarea puede tener cero o una falla. Al registrarla se exige tipo y descripción.
> - La falla se relaciona con la tarea de la OT y con el activo afectado. Sin diagnóstico,
>   la tarea queda sin fila de falla.
> - Desde «Otra» se pueden agregar tipos al catálogo. Se guardan con inicial mayúscula,
>   se rechazan duplicados sin distinguir mayúsculas y quedan disponibles para otras tareas.

> **Decisiones del 03/10/2026 (devolución del Sprint 3, HU-13 y HU-16):**
> - **Los materiales no llevan fecha de vencimiento.** Se sacó del formulario, de la ficha y
>   de la base (columna `material.mat_fecha_venc`).
> - **El estado del stock no se escribe.** El listado de materiales muestra sólo el stock
>   mínimo y el actual. Si el actual está por debajo del mínimo, la fila se tiñe de rojo suave
>   y abajo de la tabla una referencia explica qué significa ese rojo.
> - **Una herramienta se asigna a un solo técnico a la vez.** La asignación es un préstamo en
>   `tecnico_utiliza_herramienta`: mientras no tenga fecha de devolución, la herramienta está
>   "En uso" por ese técnico. La base no deja abrir dos préstamos de la misma herramienta.
>   Para pasársela a otro técnico, primero se registra la devolución. Se asigna y se
>   devuelve desde la ficha de la herramienta; el listado sólo muestra quién la tiene.
> - **Quién tuvo cada herramienta se ve en su ficha**, en un "Historial de asignaciones"
>   aparte del de ingresos: una asignación o una devolución no cambian ningún número del
>   depósito, así que no se mezclan con los movimientos de stock. Si más adelante se hace
>   una ficha del técnico, puede leer los mismos datos (`GET /api/inventario/:codigo/asignaciones`).
> - **Una herramienta no se borra: se da de baja y pasa a "Fuera de servicio".** No se puede
>   dar de baja mientras la tenga un técnico: primero se registra la devolución, así queda
>   sin nadie asignado. Una herramienta fuera de servicio no se puede asignar.
> - **El estado de una herramienta se cambia desde su ficha.** Si está disponible, el botón
>   "Poner fuera de servicio" la pasa a Fuera de servicio (lo mismo que el tacho del listado).
>   Si está fuera de servicio, "Poner en servicio" la vuelve a dejar Disponible (por ejemplo,
>   después de repararla). Los dos piden confirmación. Si la tiene un técnico, no aparece
>   ninguno: primero se registra la devolución.
> - Un técnico que tiene o tuvo herramientas asignadas no se puede eliminar, para no perder
>   ese historial.

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
| **Ingreso** | Entrada de materiales al depósito con un remito o una factura (09/10/2026). Sube el stock. Se guarda en la tabla `remito`, con el tipo en `remito_tipo_comprobante`. Si la factura necesita datos propios (letra, importe, CUIT), queda **pendiente de confirmar**. |
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
| **Remito** | Uno de los comprobantes del ingreso de materiales al depósito. El otro es la **factura**. |
| **Stock** | Cantidad disponible de un material. |
| **Stock mínimo** | Cantidad mínima que hay que tener. Al llegar, el sistema avisa. |
| **Tarea (de OT)** | Actividad concreta dentro de una OT. Cuando todas están completas, la OT se finaliza. Siempre sale de una tarea estándar (plantilla) del tipo de activo; su descripción se puede ajustar (decisión del 26/09/2026). |
| **Técnico** | Personal de la facultad que ejecuta las tareas. |
| **Ticket** | Registro formal de una necesidad de mantenimiento. Es la puerta de entrada al sistema. |
| **Tipo de activo** | Categoría de activos: aires acondicionados, mobiliario, luminarias. |
| **Tipo de trabajo** | Clasificación del trabajo técnico: eléctrica, refrigeración, sanitaria, civil. La usan tanto los técnicos como los prestadores externos. |
| **Trazabilidad** | Poder seguir el historial completo de un ticket, una OT o un activo. |
| **Usuario** | Entidad técnica (HU-30) que almacena credenciales (identificador, passwordHash), rol y controla el estado del primer inicio de sesión para centralizar el acceso al sistema sin usar Supabase Auth directamente en el frontend. |
| **Usuario autorizado** | Responsable de un área, habilitado para cargar tickets y consultar su estado. |
