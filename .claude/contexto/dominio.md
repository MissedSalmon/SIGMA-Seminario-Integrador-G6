# Dominio: roles, flujo y glosario

> **U-23 (13/10/2026):** Las observaciones de tarea son texto libre de hasta
> 500 caracteres (como las descripciones de tickets y remitos). Se registran
> por técnicos con asignación vigente, sin limitar el estado de la tarea, con
> cuenta autora, nombre al momento de crear y fecha del servidor. No se editan
> ni eliminan. La consulta por activo la usa el historial de intervenciones
> de HU-29 (25/10/2026). Ver `docs/U-23-observaciones.md`.

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

> **Decisiones del 27/10/2026 (HU-32, gestión de usuarios, Sprint 5):**
> - Las cuentas viven en **una sola tabla `usuario`** (la de HU-30), no en cada tabla de persona:
>   el login consulta un solo lugar, el rol está en una sola columna y el restablecimiento de
>   contraseña (HU-31) usa la misma tabla.
> - **Una persona tiene como máximo un usuario**, y el rol es el tipo de persona: rol 1 apunta a un
>   administrador, 2 a un técnico, 3 a un usuario autorizado. La base lo controla
>   (`supabase/migrations/20261027120000_gestion_usuarios.sql`).
> - **Un usuario no se borra, se desactiva** (`activo = false`). Un usuario desactivado no puede
>   iniciar sesión, pero se conserva todo lo que registró. Se puede volver a activar.
> - Un administrador **no se puede desactivar a sí mismo**, y siempre tiene que quedar **al menos un
>   administrador activo**.
> - La gestión de usuarios es sólo para un administrador **activo según la base**, no sólo según
>   el token. (Desde el 06/11/2026 ya no hay una pantalla `/usuarios`: ver más abajo.)

> **Decisiones del 06/11/2026 (corrección del sprint: cambiar la contraseña desde el perfil):**
> - **Cualquier usuario** (administrador, técnico o autorizado) cambia su propia contraseña desde
>   **Mi Perfil**, en una ventana, sin pedírselo al administrador. El menú de la cuenta abre la misma
>   ventana. Pide la contraseña actual y la nueva dos veces.
> - `/configuracion/cambiar-password` queda **sólo para el cambio obligatorio** del primer ingreso
>   (o después de un restablecimiento, HU-31). Si no hay cambio pendiente, lleva al perfil. Ahí
>   «Cancelar» cierra la sesión, porque sin cambiarla no se puede usar el sistema.
> - **Regla de la contraseña nueva** al cambiarla: **de 6 a 72 caracteres** (bcrypt no mira más
>   allá) y **distinta de la actual**. Está escrita una vez en cada lado:
>   `backend/src/utiles/contrasenas.js` y `frontend/src/utils/contrasenas.js`.
> - Un usuario **desactivado** no puede cambiarla aunque su sesión siga abierta.

> **Decisiones del 06/11/2026 (corrección del sprint: usuario al dar de alta una persona):**
> - **Al dar de alta un técnico o un usuario autorizado se le crea su usuario** en el mismo
>   momento. Antes sólo pasaba con el técnico; el autorizado quedaba sin acceso.
> - **El nombre de usuario es siempre el legajo.** Las tareas del técnico y los tickets del
>   autorizado se buscan por el nombre de usuario de la sesión, por eso no puede ser otro.
> - **La contraseña provisoria es siempre el legajo**, y se cambia obligatoriamente en el primer
>   ingreso. El aviso del alta se lo recuerda al administrador. (El restablecimiento de HU-31 sigue
>   generando una contraseña al azar.)
> - **El alta es todo o nada.** Antes de guardar se controla que el legajo no sea ya el nombre de
>   otro usuario (por ejemplo, un técnico y un autorizado con el mismo legajo). Si después falla la
>   creación del usuario, se borra la persona (y el autorizado devuelve su área) y se muestra el error.
>   Todo esto vive en `crearUsuarioDePersona` (`backend/src/servicios/usuarios.servicio.js`).
> - Los autorizados cargados antes **sin usuario** reciben uno con la migración
>   `20261106130000_usuario_autorizados_sin_usuario.sql`, con las mismas reglas. Al 06/11/2026 no
>   había ninguno en la base: todos tenían usuario.

> **Decisiones del 06/11/2026 (organización de los usuarios):**
> - Para quien administra, **persona y usuario son lo mismo**: cada alta crea su usuario y el nombre
>   de usuario es el legajo. Por eso **no hay una lista aparte de usuarios**: se sacó «Listado de
>   usuarios» (`/usuarios`) y su alta manual.
> - El grupo **Usuarios** del menú tiene **dos listas: Técnicos y Usuarios autorizados**, que se
>   manejan igual (07/11/2026):
>   - La lista tiene la columna y el filtro **Estado**, y en cada fila sólo **Ver detalle** y
>     **Editar**, como los planes de mantenimiento.
>   - La **ficha** (`/tecnicos/:legajo`, `/autorizados/:legajo`) muestra los datos y tiene todas las
>     acciones: **Editar · Restablecer contraseña · Desactivar/Activar · Eliminar**.
>   - El estado es una etiqueta con punto de color, con el mismo criterio que los planes:
>     **verde = Activo** (puede iniciar sesión), **gris = Inactivo** (no puede entrar; se conserva lo
>     que registró) o **Sin usuario**.
>   - Todo sale de un solo componente
>   (`frontend/src/componentes/usuarios/AccionesUsuario.js`) para que no se vuelvan a desparejar.
> - **Desactivar es la baja normal**: la persona no puede entrar, pero queda todo lo que registró.
>   **Eliminar es para alguien cargado por error**: sólo si nunca registró nada (un técnico: tareas
>   asignadas, herramientas u observaciones; un autorizado: tickets u observaciones). Si tiene
>   historial, la API no lo borra y sugiere desactivarlo.
> - **Los administradores no tienen pestaña** (07/11/2026): no se listan ni se gestionan desde la
>   pantalla. Cada uno cambia su contraseña desde Mi Perfil.
> - **El legajo no se edita** en ningún lado: además es el nombre de usuario.
> - **Un técnico desactivado no recibe asignaciones nuevas**: no aparece para elegirlo en una tarea
>   de OT ni para prestarle una herramienta, y la API lo rechaza. Lo que ya tenía asignado queda
>   como está, y al editar una tarea se puede dejar al técnico que ya tenía.

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
Plan preventivo (tipo de activo + frecuencia + tareas estándar)
        ↓  (automático: cada activo del tipo lleva su propio ciclo)
OT preventiva  →  mismas tareas y ejecución que el flujo correctivo
```

Una OT viene **o de un ticket, o de un plan preventivo**. Nunca de los dos.

**Tareas y especialidades (02/11/2026).** Cada tarea estándar es de una especialidad. Al
asignar una tarea sólo se ofrecen los técnicos que la tienen, y el servidor lo exige. Las
plantillas anteriores a esa fecha quedan sin especialidad hasta que alguien las complete en
`/plantillas-tareas`; mientras tanto no restringen a nadie.

**Programación por activo (03/11/2026, correcciones del Sprint 5).** El plan define sólo la
periodicidad; no tiene "próxima ejecución" ni "tipo" (todos son preventivos). Cada activo del
tipo del plan tiene su propia fecha, que se calcula, no se guarda:

| Situación del par activo–plan | Próximo mantenimiento |
|---|---|
| Sin OT previa | La alta del activo + periodicidad |
| Con OT finalizada | El cierre de la última OT finalizada, + periodicidad |
| Última OT cancelada | Su fecha programada + periodicidad (el ciclo se saltea) |
| OT abierta | No hay: se recalcula al cerrarla |
| Activo retirado | No genera |
| La fecha ya pasó | Sólo el último vencimiento atrasado: una OT, no una por cada ciclo |

Ejemplo: aire A dado de alta el 13/06/2026, aire B el 20/08/2026, plan cada 6 meses → OT de A
el 13/12/2026 y de B el 20/02/2027. Las fechas se suman con `@internationalized/date`, que
resuelve el fin de mes y los bisiestos (31/08 + 6 meses = 28/02).

**La alta del plan no cuenta (06/11/2026).** El próximo mantenimiento sale siempre de la alta
del activo o de su último mantenimiento, nunca de cuándo se creó el plan. Si el activo es viejo
y ya se le pasaron varios vencimientos, no se genera una OT por cada uno: queda sólo el último
que ya llegó. Ejemplo: PC dada de alta el 20/11/2024, plan cada 3 meses, hoy 06/11/2026 → una
sola OT con fecha 20/08/2026. Cuando se cierra, el siguiente es el cierre + 3 meses.

- **Generación:** un job diario dentro del backend (hora `PLANES_HORA_GENERACION`, por defecto
  6) genera la OT de cada par cuya fecha entra en los próximos `PLANES_DIAS_ANTICIPACION` días
  (por defecto 1: **la OT se crea el día anterior**, decisión del 04/11/2026; con 7 días un plan
  semanal no tendría sentido). También corre al levantar la API, al dar de alta o importar activos, y a
  mano con `POST /api/planes-mantenimiento/procesar-generacion`. Es idempotente: la OT guarda
  la fecha del ciclo (`ot_fecha_programada`) y un índice único impide dos OT del mismo ciclo.
- **Aviso en el panel (06/11/2026):** se sacó del panel por ahora porque confundía. El
  componente `AvisoPlanesPorVencer.js` y el endpoint `GET /planes-mantenimiento/por-vencer`
  quedan armados (fecha programada y día en que se genera la OT), sin botón para generar.
- **Asignación (04/11/2026):** el plan **no tiene técnicos**. La OT nace en "Creada" con las
  tareas del plan sin responsable, y el administrador las asigna después, como en cualquier
  OT (la lista de técnicos de cada tarea ya viene filtrada por su especialidad). Ya no se
  posterga el plan (reemplaza C7/D4). Los técnicos que tenían los planes quedaron respaldados
  en `plan_tecnicos_previos`.
- **Planes existentes:** quedaron con alta del plan = 03/11/2026. Desde el 06/11/2026 esa
  fecha ya no interviene en el cálculo. El tipo y la próxima ejecución anteriores quedaron
  respaldados en `plan_datos_previos`.
- **Estado en pantalla (03/11/2026):** el estado del plan va con una etiqueta de color
  (`EtiquetaEstadoPlan.js`). Verde = Activo, sigue generando OT. Gris = Dado de baja, ya no
  genera.

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

En pantalla, el estado del activo va con una etiqueta de color (03/11/2026,
`EtiquetaEstadoActivo.js`): verde = Operativo (funciona), celeste = En mantenimiento (tiene
una OT en ejecución), rojo = Fuera de servicio (no funciona), gris = Retirado (dado de baja).

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

> **Decisión del 10/11/2026 (el técnico carga la falla):**
> - El técnico carga la falla desde el detalle de su tarea (`/tareas/[idOt]/[idTarea]`),
>   en la tarjeta «Falla encontrada». **Es opcional:** la tarea se finaliza igual sin falla.
> - Sólo mientras la tarea está **En ejecución**. Antes de iniciarla o después de finalizarla
>   se ve, pero no se cambia. Mientras está en ejecución la puede editar o quitar.
> - El tipo se elige del catálogo `tipo_falla` (el técnico no agrega tipos nuevos). Se guarda
>   en la misma tabla `falla`, una por tarea, con el activo de la OT. Sin activo no se carga.
> - API: `PUT` y `DELETE /api/tareas/mias/:idOt/:idTarea/falla`, `GET /api/tareas/tipos-falla`.
> - El técnico **no agrega tipos nuevos** de falla y **puede quitar** la que cargó mientras la
>   tarea está en ejecución (confirmado por el equipo, 10/11/2026).
> - **Dónde se busca el activo de una OT** (corrección del 10/11/2026): primero en la propia OT
>   (`orden_trabajo.activo_codigo`, que es donde lo guardan las preventivas desde el 03/11),
>   después en el ticket y por último en el plan (preventivas viejas). Las tareas del técnico
>   sólo miraban ticket y plan, y en las preventivas nuevas «Activo y ubicación» salía vacío.

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

> **Decisiones del 06/11/2026 (corrección del sprint anterior: ajustes de stock):**
> - **El stock de un material se puede ajustar a mano**, sin remito y sin tarea: un
>   **ingreso** suma unidades que no vienen de una compra y un **egreso** descuenta las que no
>   se usaron en una tarea. Lo hace sólo el administrador, con «Modificar stock» en la ficha del
>   material (`POST /api/inventario/:codigo/ajustes`).
> - **El ajuste no lleva motivo.** Se carga ingreso o egreso, cantidad, fecha y una observación
>   opcional (hasta 500 caracteres). Queda quién lo registró, tomado de la sesión.
> - **La fecha puede ser de hoy o anterior**, pero no anterior al último movimiento del
>   material, para que el historial no quede con el stock en negativo en el medio.
> - **El stock nunca queda negativo.** Un egreso tiene como tope el stock actual; la base lo
>   vuelve a controlar al guardar (`registrar_ajuste_stock`) y la tabla `material` tiene la regla
>   `mat_stock_actual >= 0`.
> - **El ajuste es un movimiento más del historial**: "Ingreso manual" (+) o "Egreso
>   manual" (−), con la observación en la columna Origen. No hay tabla nueva: se guarda en
>   `inventariomovimiento`. La alerta de stock mínimo se recalcula sola, como con un remito o
>   un consumo.
> - **Las herramientas no se ajustan.** Siguen siendo una unidad por código: si se rompe o se
>   pierde, se da de baja y queda fuera de servicio. Si la tiene un técnico, primero se
>   registra la devolución.

> **Decisiones del 10/10/2026 (HU-21, consultar mis tareas):**
> - **El técnico ve sólo sus tareas.** La API (`GET /api/tareas/mias`) toma el legajo de la
>   sesión, nunca de la dirección, así que no hay forma de pedir las de otro. Una tarea ajena
>   abierta por dirección responde "No tenés asignada la tarea…", igual que si no existiera.
> - **Una asignación cancelada ya no es del técnico** (`tec_asig_estado` = 5): no se muestra.
> - **"Pendiente", para el aviso, es toda tarea que todavía no terminó:** la que no está
>   Finalizada ni Cancelada. El aviso cuenta todas, sin mirar los filtros, porque dice cuánto
>   trabajo le queda.
> - ~~**El aviso de pendientes se puede cerrar.**~~ Reemplazado el 23/10/2026: el aviso de
>   arriba de `/tareas` se sacó y las pendientes se ven en la campana de notificaciones
>   (ver "Campana de notificaciones" más abajo).
> - **La fecha que se filtra es la prevista de inicio** (`tarea_fecha_ini`, la que carga el
>   administrador al planificar la OT). Una tarea sin fecha prevista no aparece cuando se
>   filtra por fecha.
> - **Orden por defecto** *(cambiado el 25/10/2026)*: por estado, primero lo que el técnico
>   tiene entre manos: En ejecución, Asignada, Pendiente, Creada y al final Finalizada y
>   Cancelada. Dentro de cada estado, prioridad más alta primero y después la fecha prevista
>   más cercana (sin fecha, al final). Lo ordena la pantalla, no la API. Antes (22/10/2026) era
>   cronológico de creación, por número de OT y de tarea.
> - **El estado es la segunda columna** *(25/10/2026)*, después de la prioridad, con la misma
>   etiqueta (punto de color + texto) que el estado de la OT (`EtiquetaEstadoOT`): la tarea
>   tiene los mismos estados. El color acompaña; lo que se lee es la palabra.
> - **El filtro "Estado" ofrece los estados de la tarea** *(25/10/2026)*: En ejecución,
>   Asignada, Finalizada y Cancelada. Arranca en "Todas"; por el orden, las terminadas quedan al
>   final. Reemplaza a la opción "Pendientes" (22/10/2026), que no era un estado.
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
> - **Cómo se muestra la tarea en ese historial** *(25/10/2026)*: la descripción de la tarea es
>   el dato principal y el enlace lleva a la tarea (`/tareas/[OT]/[tarea]`). Abajo, en gris y
>   sin enlace, van la OT, el activo y el espacio (`OT #3 · PROY-001 · Aula 11`). La OT no
>   lleva enlace porque su pantalla es del administrador. No se muestra la descripción de la
>   OT: es lo que escribió quien hizo el ticket y no ayuda a reconocer el trabajo.
> - **Orden de las columnas** *(25/10/2026)*: como en el resto de las listas, primero lo que se
>   lista (el material o la herramienta), después sus datos, la tarea como última columna de
>   datos y, si hay, la acción al final.
> - **Materiales utilizados** *(25/10/2026)*: columnas Material, Cantidad, Fecha y Tarea. La
>   fecha va sin la hora; los filtros "Desde" y "Hasta" toman el día en la hora local.
> - **Herramientas utilizadas: una fila por préstamo** *(25/10/2026)*, cada vez que la tomó,
>   como materiales tiene una fila por consumo. Columnas Herramienta, Estado, Desde, Hasta,
>   Tarea y Acción ("Devolver", sólo en la que tiene todavía). El estado va con una etiqueta
>   (punto + texto, como el de la OT): **celeste = En uso** (la tiene a su nombre y la puede
>   devolver) y **gris = Devuelta** (ya no la tiene; queda como historial). Primero las En uso. Reemplaza a
>   la fila por herramienta con las columnas "Último uso" y "Veces" y la ventana "Ver OT"
>   (22/10/2026). Un préstamo sin tarea (los que asignó el administrador desde el depósito y
>   los de antes del 22/10/2026) dice "Sin tarea registrada".
> - **En el celular** *(25/10/2026)*: las dos pantallas entran sin correrse de costado. Las
>   columnas de fechas, estado, cantidad y acción se esconden y su dato pasa abajo de la
>   herramienta o del material. En herramientas, "Desde" y "Hasta" recién aparecen en
>   pantallas grandes (desde 1200 px): con el menú lateral abierto no entran las seis columnas.
> - ⬜ **Pendiente de definir:** una tarea a cargo de un **prestador externo** no la puede
>   finalizar un técnico desde la app. Si una OT tiene una, no se va a cerrar sola hasta que
>   haya una forma de marcar esa tarea como hecha (la tendría que hacer el administrador).

> **Decisiones del 25/10/2026 (HU-29, historial de intervenciones por activo):**
> - **Una intervención es una OT del activo**, no cada tarea. Es **correctiva** si viene de un
>   ticket y **preventiva** si viene de un plan.
> - **Entran las OT En ejecución y Finalizadas.** Las Creadas y Asignadas todavía no le
>   hicieron nada al activo, y las Canceladas no se trabajaron.
> - **La fecha que se muestra** es la de cierre si la OT está Finalizada, y la de alta si sigue
>   en ejecución. Con esa fecha se ordenan, de la más reciente a la más antigua.
> - **La falla, quién la ejecutó, los materiales y las observaciones son de cada tarea**, así
>   que se muestran tarea por tarea. Quien ejecutó es el responsable de la tarea: un técnico
>   (sin contar una asignación cancelada) o un prestador. Las tareas canceladas no se
>   muestran. En las correctivas también se ve el problema que se reportó en el ticket.
> - **Último mantenimiento** es la fecha de cierre de la OT Finalizada más reciente, correctiva
>   o preventiva. **Se calcula, no se guarda:** la columna `activo.activo_fecha_ult_maint`
>   no la escribe nadie y el historial no la usa.
> - El historial está en la ficha del activo (`/activos/[codigo]`), a la que se llega con el
>   ícono de la ficha (la hoja, el mismo que en materiales y herramientas) del listado de
>   activos. La API es `GET /api/activos/:codigo/historial` y es sólo para el administrador.
> - **Cambio del 03/11/2026:** cada intervención es un renglón con su origen («Ticket #32» o
>   «Plan #6») y su OT («#25»), que llevan a su detalle; ya no hay «Ver más». Las columnas van
>   origen, OT, fecha, mantenimiento, falla, estado y ejecutó. El orden por defecto es de la
>   más reciente a la más antigua; un clic en el encabezado «Fecha» lo da vuelta. Una OT preventiva se
>   busca por su propio activo (programación por activo) o, si es vieja y no lo tiene, por el
>   activo del plan.

> **Decisiones del 07/11/2026 (HU-34, áreas con mayor incidencia, issue #29):**
> - Está en el **panel del administrador** (`/`), abajo de los totales. No tiene pantalla
>   propia. La API es `GET /api/estadisticas/areas-incidencia` y es sólo para el administrador.
> - Es un **ranking de áreas por cantidad de fallas**, de mayor a menor. Empate: más tickets
>   primero; después, por nombre.
> - **Se calcula, no se guarda:** sale de las fallas que registran los técnicos en las tareas.
>   Las fallas viejas que sólo estaban asociadas a la OT (sin tarea ni activo) no cuentan,
>   porque no se sabe de qué área son.
> - **El área de una falla es la del espacio de su activo**, igual que la de un ticket. Si el
>   espacio no tiene área, la falla va a **«Sin área»**, que se muestra siempre al final. Si
>   dos áreas comparten el espacio, la falla cuenta para las dos.
> - Cuentan las fallas de OT **correctivas y preventivas**. La columna «Tickets» es la cantidad
>   de tickets distintos: una falla preventiva no tiene ticket, y un ticket con dos tareas
>   diagnosticadas suma dos fallas pero un ticket.
> - Filtros: **Período** (último mes, 3 meses, semestre, año o todo), que se aplica sobre la
>   fecha en que se registró la falla, y **Falla** (el tipo). El buscador busca por área o edificio.
> - Se muestra como estadística: arriba cuatro cifras (fallas registradas, tickets con fallas,
>   áreas afectadas y el área con más fallas); abajo un gráfico de barras con el ranking, cada
>   barra dividida por tipo de falla, y al costado cuántas fallas hubo de cada tipo, de mayor a
>   menor (empate: por nombre), con su porcentaje con un decimal. Un botón
>   pasa a vista de **tabla**.
> - Aparecen **todas las áreas que tuvieron al menos una falla** en el período, sin corte.
>   Un área sin fallas no se muestra.
> - **Porcentaje:** cada área muestra qué parte del total de fallas del período tiene, con un
>   decimal («62,5 %»). Si dos áreas comparten un espacio, la suma puede pasar el 100 %.
> - **Colores:** cada color es un tipo de falla, y la **referencia** arriba del gráfico dice
>   cuál es cada uno. El color sale del lugar del tipo en el catálogo, no del ranking, así que
>   un filtro no lo cambia. Si el catálogo pasa de 8 tipos, los siguientes van en gris.
> - Clic en un área (o el ícono de la hoja en la tabla) abre una ventana con sus fallas:
>   origen («Ticket #31» o «Plan #6», que llevan a su detalle), fecha, falla, activo y estado
>   del ticket.

> **Decisiones del 09/11/2026 (tiempos promedio de resolución, Sprint 7):**
> - Está en el **panel del administrador** (`/`), abajo de las áreas con mayor incidencia.
>   La API es `GET /api/estadisticas/tiempos-resolucion?desde=&hasta=` y es sólo para el
>   administrador (otro rol: 403; sin sesión: 401).
> - **Tiempo de resolución = fecha de cierre − fecha de alta del ticket**
>   (`ticket_fecha_cierre − ticket_fecha_alta`). La fecha de cierre ya existía: la pone sola
>   la HU-26 al finalizar la OT.
> - **Sólo cuentan los tickets Cerrados** (estado 6) con fecha de alta, fecha de cierre y un
>   cierre igual o posterior al alta. Los demás estados no se promedian. Un ticket cerrado sin
>   fecha de cierre (por ejemplo, uno cerrado antes de la migración del 10/10/2026) queda afuera.
> - **Reabrir:** hoy ningún camino saca un ticket de «Cerrado» y no hay historial de estados.
>   Si alguna vez se cierra dos veces, `ticket_fecha_cierre` guarda el último cierre, que es el
>   que se usa.
> - **El período se aplica sobre la fecha de cierre**, con los dos días incluidos. La pantalla
>   manda el día entero en la hora de quien mira; si a la API le llega una fecha sola
>   («2026-11-09»), la toma como ese día en la hora de Argentina (UTC-3).
> - **Se calcula en la base**, con AVG y GROUP BY, en la función
>   `estadistica_tiempos_resolucion` (migración `20261109120000`). Se guarda en segundos y la
>   pantalla lo escribe con las dos unidades más grandes: «2 d 4 h», «3 h 30 min», «25 min»,
>   y al lado en horas con un decimal.
> - **Promedio general:** cada ticket cuenta una vez.
> - **Por área:** el área del espacio del activo, como en la HU-34. Si dos áreas comparten el
>   espacio, el ticket cuenta para las dos. Sin espacio o sin área: **«Sin área»**.
> - **Por tipo de activo:** el tipo del activo del ticket.
> - **Por técnico:** el ticket cuenta para **cada técnico** que tuvo una asignación no
>   cancelada en una tarea no cancelada de su OT (un técnico con dos tareas cuenta una vez).
>   Si no hay ninguno (por ejemplo, sólo trabajó un prestador), va a **«Sin asignar»**. Estos
>   tickets sí entran en el promedio general.
> - Cada fila muestra nombre, promedio y cantidad de tickets cerrados. Orden: de mayor a menor
>   tiempo; las filas «Sin área» / «Sin asignar» siempre al final.
> - Sin tickets cerrados en el período se muestra un cartel («No hay tickets cerrados en el
>   período elegido»), nunca 0 ni NaN.

> **Correcciones de cálculo del panel (10/11/2026, migración `20261110120000`):**
> - **Cobertura preventiva = activos en servicio cuyo tipo tiene un plan vigente ÷ activos en
>   servicio.** Antes era tipos con plan ÷ todos los tipos, y un tipo sin activos bajaba el
>   porcentaje. Al lado se muestra cuántos tipos tienen plan. *La métrica sigue en revisión.*
> - **Materiales bajo el mínimo:** sólo los que tienen stock **menor** al mínimo, igual que la
>   campana (HU-33). Antes el panel contaba también los que estaban justo en el mínimo.
> - **OT por prioridad:** las OT no canceladas sin prioridad cargada van en la fila
>   **«Sin prioridad»**, así la distribución suma el total.
> - **Tickets por estado:** «Finalizado» se muestra sólo si hay algún ticket en ese estado.
> - **Período «Histórico»:** en la evolución mensual y en tickets por estado arranca con el
>   primer ticket (antes tomaba sólo los últimos 6 meses).
> - **Meses:** se arman en la hora de Argentina y se nombran en español («Nov 2026 (parcial)»).
> - **Áreas con mayor incidencia:** una fecha sola es el día entero en la hora de Argentina,
>   como en los tiempos de resolución, y las fallas se traen de a 1000 para no perder ninguna.
> - **Período del informe:** se escribe con los días pedidos (antes el «hasta» salía un día
>   después porque se tomaba el día en UTC).
> - **«% del total»** de la carga de un técnico es su parte de todas las tareas abiertas
>   asignadas, no cuánto está ocupado.

---

## Automatismos

No son historias de usuario aparte: son reglas dentro de historias existentes.

| Automatismo | Cuándo pasa |
|---|---|
| Se crea la OT | Al validar un ticket. |
| Baja de stock | Al registrar el consumo de un material en una tarea, o con un ajuste de salida (06/11/2026). |
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

> **Alerta de stock mínimo (HU-33, 23/10/2026):**
> - Hay alerta cuando el stock actual está **por debajo** del mínimo. Si es igual al
>   mínimo, no hay alerta (mismo criterio que el listado de materiales).
> - La alerta **no se guarda en una tabla**: se calcula del stock cada vez que se pide.
>   Por eso aparece sola cuando un consumo baja el stock y se resuelve sola cuando un
>   remito lo sube. No hay que crearla ni cerrarla a mano.
> - Se muestra en la **campana de notificaciones** de la barra de arriba, sólo para el
>   administrador. La campana lleva la cantidad y, al abrirla, muestra los 5 materiales
>   que más faltan. «Ver más» lleva a `/notificaciones`, con la lista completa: stock
>   actual, mínimo y **cuánto falta** para llegar al mínimo.
> - Además sale un **mensaje flotante** (toast) al entrar al sistema si hay materiales con
>   stock bajo, y después cada vez que aparece un material nuevo en la lista. Un mismo
>   material no se vuelve a avisar en la sesión, salvo que se reponga y vuelva a bajar.

> **Campana de notificaciones por rol (23/10/2026):**
> - La campana es **la misma para todos los roles**. La API (`GET /api/notificaciones`) mira
>   el rol y el legajo de la sesión (JWT) y devuelve sólo las de ese usuario.
> - **Administrador:** las alertas de stock mínimo (como arriba). «Ver más» → `/notificaciones`.
> - **Técnico:** sus tareas pendientes (las que no están Finalizadas ni Canceladas), la última
>   asignada primero. Reemplaza al aviso que había arriba de `/tareas`. «Ver más» → `/notificaciones`, con la
>   lista completa de sus pendientes (25/10/2026: antes iba a `/tareas`, que es su pantalla de
>   inicio, y el enlace no hacía nada estando ahí).
> - **El mensaje de cada tarea del técnico (25/10/2026)** dice en qué punto está: «Falta
>   finalizar la tarea …» si está En ejecución; «Tarea … está atrasada» si no empezó y su
>   fecha prevista de inicio ya pasó; si no, «Te asignaron la tarea …». Abajo: la OT, dónde es, la prioridad y la fecha
>   prevista. En `/notificaciones` cada mensaje lleva el botón «Ver tarea».
> - **Usuario autorizado:** todavía no tiene campana. **Pendiente de confirmar** qué se le
>   notifica (por ejemplo, cambios de estado de sus tickets); el relevamiento no lo dice.
> - Ninguna notificación se guarda en una tabla ni se marca como leída: el número es la
>   cantidad de cosas que hay hoy para atender.

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
| **Ajuste de stock** | Entrada o salida de un material cargada a mano por el administrador, que no viene de un remito ni de una tarea. No lleva motivo (06/11/2026). |
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
| **Plan de mantenimiento preventivo** | Define a qué tipo de activo aplica, cada cuánto y con qué tareas y técnicos. Genera una OT por activo cuando le toca a cada uno (03/11/2026). |
| **Plantilla de tareas** | Tarea modelo asociada a una **especialidad** (decisión del 02/11/2026, corrección de los profesores; antes era el tipo de activo). Sirve para precargar tareas estándar y para ofrecer sólo los técnicos de esa especialidad. |
| **Prestador de servicio** | Empresa o profesional externo que hace trabajos que el equipo propio no puede cubrir. |
| **Prioridad** | Nivel de importancia que el administrador le pone a la OT. |
| **Proveedor** | Quien le vende materiales y herramientas a la facultad. |
| **Remito** | Uno de los comprobantes del ingreso de materiales al depósito. El otro es la **factura**. |
| **Stock** | Cantidad disponible de un material. |
| **Stock mínimo** | Cantidad mínima que hay que tener. Al llegar, el sistema avisa. |
| **Tarea (de OT)** | Actividad concreta dentro de una OT. Cuando todas están completas, la OT se finaliza. Siempre sale de una tarea estándar (plantilla); su descripción se puede ajustar (decisión del 26/09/2026). El técnico asignado tiene que tener la especialidad de la plantilla (02/11/2026). |
| **Técnico** | Personal de la facultad que ejecuta las tareas. |
| **Ticket** | Registro formal de una necesidad de mantenimiento. Es la puerta de entrada al sistema. |
| **Tipo de activo** | Categoría de activos: aires acondicionados, mobiliario, luminarias. |
| **Tipo de trabajo** | Clasificación del trabajo técnico: eléctrica, refrigeración, sanitaria, civil. La usan tanto los técnicos como los prestadores externos. |
| **Trazabilidad** | Poder seguir el historial completo de un ticket, una OT o un activo. |
| **Usuario** | Entidad técnica (HU-30) que almacena credenciales (identificador, passwordHash), rol y controla el estado del primer inicio de sesión para centralizar el acceso al sistema sin usar Supabase Auth directamente en el frontend. |
| **Usuario autorizado** | Responsable de un área, habilitado para cargar tickets y consultar su estado. |
