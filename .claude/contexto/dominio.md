# Dominio: roles, flujo y glosario

> **U-23 (13/10/2026):** Las observaciones de tarea son texto libre de hasta
> 500 caracteres (como las descripciones de tickets y remitos). Se registran
> por técnicos con asignación vigente, sin limitar el estado de la tarea, con
> cuenta autora, nombre al momento de crear y fecha del servidor. No se editan
> ni eliminan. La consulta por activo está preparada para HU-28/HU-29; su
> pantalla de historial aún está pendiente. Ver `docs/U-23-observaciones.md`.

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

Los estados y las prioridades son **datos enumerados**: en la base cada uno se guarda como
un **número** (el de la tabla). La traducción a texto está en un solo lugar:
`backend/src/utiles/enumerados.js`.

| Entidad | Estados (número en la base) |
|---|---|
| **Ticket** | 1 Creado → 2 Validado → 3 Asignado → 4 En ejecución → 5 Finalizado → 6 Cerrado · (o 7 Rechazado) |
| **Orden de trabajo** | 1 Creada → 2 Asignada → 3 En ejecución → 4 Finalizada · (o 5 Cancelada) |
| **Tarea de OT** | 1 Creada · 2 Asignada · 3 En ejecución · 4 Pendiente · 5 Finalizada · 6 Cancelada |
| **Prioridad de la tarea** | 1 Alta · 2 Media · 3 Baja |
| **Prioridad manual de la OT** | 1 Alta · 2 Media · 3 Baja · (vacía: usa la sugerida) |
| **Técnico asignado a la tarea** | 1 Pendiente · 2 Asignada · 3 En curso · 4 Finalizada · 5 Cancelada |
| **Activo** | 1 Operativo → 2 En mantenimiento → 3 Fuera de servicio → 4 Retirado |
| **Herramienta** | 1 Disponible ⇄ 2 En uso · 3 Fuera de servicio |
| **Rol de usuario** | 1 administrador · 2 tecnico · 3 autorizado |

> **Decisiones del 12/10/2026 (Rol de usuario como dato enumerado):**
> - El atributo `rol` de la tabla `usuario` migró de `VARCHAR(50)` a número entero (`INT`)
>   con restricción `CHECK (rol BETWEEN 1 AND 3)`. La migración es
>   `supabase/migrations/20261012120000_usuario_rol_enumerado.sql`.
> - En el backend se incorporó `ENUM_ROL` a `backend/src/utiles/enumerados.js`. La API sigue
>   manejando los textos `'administrador'`, `'tecnico'`, `'autorizado'` hacia el frontend y JWT.

> **Decisiones del 07/10/2026 (valores enumerados del diccionario de datos):**
> - Los estados y la prioridad de la tarea dejan de guardarse como texto y pasan a ser un
>   número entero (`INT`), como dice el diccionario. Cada columna sólo acepta sus números
>   (CHECK) y lleva un comentario con lo que significa cada uno. La API sigue mandando el
>   texto, así que las pantallas no cambiaron.
> - **Ticket:** se agregó "En ejecución" (4), que el sistema ya usaba y el diccionario no
>   tenía. Los viejos `ABIERTO` pasaron a 1=Creado.
> - **Herramienta:** "En uso" ahora también se guarda (antes sólo salía de la asignación).
>   Al asignarla pasa a 2 y al devolverla vuelve a 1.
> - **Tarea:** quedan los 6 estados del diccionario y una tarea nueva arranca en "Creada".
>   Las 19 tareas que había quedaron en 4=Pendiente; "Completada" pasó a llamarse
>   "Finalizada". Una tarea se puede borrar mientras no empezó (Creada, Asignada o Pendiente).
> - **Cuando a una tarea se le asigna alguien (un técnico o un prestador), pasa a
>   "Asignada"**, desde Creada o Pendiente; si se le saca el responsable vuelve a "Creada".
>   Si ya está en ejecución, finalizada o cancelada, se respeta su estado. La asignación del
>   técnico (`tec_asig_estado`) también nace "Asignada". En la migración, las 9 tareas que ya
>   tenían técnico pasaron a "Asignada"; las 10 sin nadie siguen en "Pendiente".
> - Si se agrega un valor nuevo, va al final de su lista en `enumerados.js` (para no correr los
>   números ya guardados) y en una migración se amplía el CHECK de la columna.
> - **10/10/2026:** se pasaron a llamar **datos enumerados** (`enumerados.js`, `ENUM_...`).
>   La prioridad manual de la OT (`ot_prioridad`) también pasó a número, con los mismos
>   valores que la de la tarea. La migración quedó como
>   `20261010120000_datos_enumerados.sql`, para que vaya después de las del 09/10.

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
> - **Prestadores de servicio (HU-25, 11/10/2026):** ABM completo en `/prestadores`.
>   Datos: nombre, CUIL, teléfono, email y garantía (texto libre, "6 meses en mano de obra").
>   Son obligatorios el **nombre**, el **CUIL** (único, con dígito verificador) y **al menos un
>   tipo de prestador** (HU-24); el resto es opcional. Un prestador puede tener varios tipos.
>   **No se puede eliminar un prestador con tareas asignadas**, para no perder el historial.
>   El listado se filtra por tipo. La cuenta bancaria (`prestador_serv_cuenta_bco`) está en la
>   tabla pero la HU no la pide: queda sin pantalla, pendiente de confirmar si hace falta.
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

> **Decisiones del 10/10/2026 (HU-21, consultar mis tareas):**
> - **El técnico ve sólo sus tareas.** La API (`GET /api/tareas/mias`) toma el legajo de la
>   sesión, nunca de la dirección, así que no hay forma de pedir las de otro. Una tarea ajena
>   abierta por dirección responde "No tenés asignada la tarea…", igual que si no existiera.
> - **Una asignación cancelada ya no es del técnico** (`tec_asig_estado` = 5): no se muestra.
> - **"Pendiente", para el aviso, es toda tarea que todavía no terminó:** la que no está
>   Finalizada ni Cancelada. El aviso cuenta todas, sin mirar los filtros, porque dice cuánto
>   trabajo le queda.
> - **El aviso de pendientes se puede cerrar.** Una vez cerrado no vuelve mientras dure la
>   pestaña del navegador (aunque se entre a una tarea y se vuelva), salvo que cambie la
>   cantidad de pendientes: ahí hay algo nuevo que avisar y aparece otra vez.
> - **La fecha que se filtra es la prevista de inicio** (`tarea_fecha_ini`, la que carga el
>   administrador al planificar la OT). Una tarea sin fecha prevista no aparece cuando se
>   filtra por fecha.
> - **Orden por defecto:** prioridad (Alta, Media, Baja) y, dentro de la misma prioridad, la
>   fecha prevista más cercana. Las que no tienen fecha van al final de su prioridad.
> - **El detalle de la tarea es una pantalla** (`/tareas/[OT]/[tarea]`). La OT y el activo no
>   llevan enlace: sus pantallas son del administrador.

> **Decisiones del 10/10/2026 (HU-22, ejecutar la tarea; y HU-26, cierre automático):**
> - **El técnico ejecuta la tarea desde su detalle.** "Iniciar tarea" la pasa de Creada,
>   Asignada o Pendiente a **En ejecución**; "Finalizar tarea" la pasa de En ejecución a
>   **Finalizada** (la HU dice "Completada": es el mismo estado, que en el diccionario se llama
>   Finalizada). Las dos piden confirmación.
> - **Al iniciar**, se mueve en cadena lo que corresponde, y sólo hacia adelante: la
>   asignación del técnico pasa a En curso, la OT a En ejecución (si estaba Creada o
>   Asignada), el ticket a En ejecución (si estaba Validado o Asignado) y el **activo a En
>   mantenimiento** (salvo que esté Retirado).
> - **Materiales:** se cargan en una pantalla aparte (`/tareas/[OT]/[tarea]/materiales`), igual
>   que un ingreso por remito pero al revés, con un resumen de cómo queda el stock antes de
>   guardar. **Sólo mientras la tarea está En ejecución.** Las cantidades son enteras. No se
>   puede usar más de lo que hay: el campo tiene como tope el stock, y la base lo vuelve a
>   controlar al guardar. El descuento es todo o nada (si a un material no le alcanza, no se
>   registra ninguno) y queda como movimiento "Consumo" en el historial del depósito, con el
>   legajo del técnico. Si se registra otra vez un material que la tarea ya tenía, se suma.
> - **Herramientas:** el técnico toma las que necesita mientras la tarea está En ejecución, y
>   quedan **En uso a su nombre** (es la misma asignación que hace el administrador desde el
>   depósito). Las devuelve él mismo cuando quiere, aunque la tarea ya haya terminado. Sólo
>   puede devolver las suyas. Las herramientas son del técnico, no de la tarea.
> - **Cierre automático (HU-26):** cuando todas las tareas de la OT están Finalizadas o
>   Canceladas (y al menos una Finalizada), la **OT se finaliza** con su fecha de cierre, el
>   **ticket se cierra** con su fecha de cierre (columna nueva `ticket_fecha_cierre`) y el
>   **activo vuelve a Operativo**, salvo que otra OT en ejecución lo siga arreglando.
> - **Historial del técnico en el menú:** "Materiales utilizados" (`/tareas/materiales`) lista
>   lo que se usó en sus tareas, con filtro por material y por fecha. Es sólo para consultar:
>   no lleva acciones. "Herramientas utilizadas" (`/tareas/herramientas`) lista las que tiene
>   ("En uso") y las que ya devolvió, y desde ahí devuelve las que todavía están a su nombre.
>   Sólo ve lo suyo.
> - ⬜ **Pendiente de definir:** una tarea a cargo de un **prestador externo** no la puede
>   finalizar un técnico desde la app. Si una OT tiene una, no se va a cerrar sola hasta que
>   haya una forma de marcar esa tarea como hecha (la tendría que hacer el administrador).

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
