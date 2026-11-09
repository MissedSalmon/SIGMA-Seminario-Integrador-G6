# Documentación de Cambios en la Base de Datos: Planes de Mantenimiento Preventivo

**Sprint:** 5  
**Fecha:** 2026-10-26  
**Migración:** `supabase/migrations/20261026220000_planes_mantenimiento_preventivo.sql`  
**Historia de Usuario:** Gestión de Planes de Mantenimiento Preventivo (HU-22 / Sprint 5)  

---

## 1. Resumen de los Cambios

Esta migración adapta el modelo relacional físico para soportar el ciclo de vida completo de los **Planes de Mantenimiento Preventivo** y su automatización:
1. **Desacoplamiento de activo puntual en el plan:** El plan preventivo se define a nivel de **categoría/tipo de activo** (`tipo_activo_id`), por lo que `activo_codigo` en `mantenimiento_preventivo` deja de ser obligatorio (`NULL`), permitiendo planes generales que generen OTs para todos los activos de esa categoría.
2. **Atributos de planificación y ciclo de vida en `mantenimiento_preventivo`:**
   - Clasificación de tipo de mantenimiento (`mant_prev_tipo_mant`).
   - Gestión de estado lógico (`mant_prev_activo`, `mant_prev_fecha_baja`).
   - Fechas de control para la generación automática y alertas de vencimiento (`mant_prev_fecha_prox_gen`).
   - Estructuración de periodicidad (`mant_prev_intervalo`, `mant_prev_unidad_frec`).
3. **Identificación inequívoca del activo en la Orden de Trabajo (`orden_trabajo`):**
   - Se incorpora `activo_codigo` como clave foránea a `activo(activo_codigo)`. Esto permite que cuando el proceso automático levanta una OT preventiva para cada activo de un tipo, la OT registre de manera directa qué activo físico interviene.
4. **Asignación de personal técnico al plan (`mant_prev_tecnico`):**
   - Nueva tabla relacional que vincula planes preventivos con técnicos autorizados (`tecnico_legajo`), permitiendo asignaciones opcionales durante la creación y obligatorias al momento de levantar la orden automática.

---

## 2. Detalle de Tablas Modificadas y Creadas

### 2.1 Tabla Modificada: `mantenimiento_preventivo`
* **Columna flexibilizada:**
  * `activo_codigo`: Pasa de `NOT NULL` a `NULL`. Si se completa, indica un plan específico para un activo particular; si es `NULL`, aplica a todos los activos del `tipo_activo_id`.
* **Columnas agregadas:**
  * `mant_prev_tipo_mant VARCHAR(50) NOT NULL DEFAULT 'Preventivo'`: Especifica el tipo de mantenimiento (ej: Preventivo, Predictivo, Rutinario, Calibración).
  * `mant_prev_activo BOOLEAN NOT NULL DEFAULT true`: Flag booleano para baja lógica. Un plan inactivo no genera nuevas OTs ni figura en avisos de vencimiento.
  * `mant_prev_fecha_baja TIMESTAMPTZ NULL`: Fecha y hora exacta en la que se aplicó la baja lógica.
  * `mant_prev_fecha_prox_gen DATE NULL`: Fecha en la que corresponde ejecutar la próxima generación automática de órdenes de trabajo.
  * `mant_prev_intervalo INT NOT NULL DEFAULT 1`: Cantidad de unidades de tiempo que componen el período (ej: 6).
  * `mant_prev_unidad_frec VARCHAR(20) NOT NULL DEFAULT 'meses'`: Unidad de tiempo asociada al intervalo (`dias`, `semanas`, `meses`, `anios`).

### 2.2 Tabla Modificada: `orden_trabajo`
* **Columna agregada:**
  * `activo_codigo VARCHAR(50) NULL REFERENCES activo(activo_codigo)`: Referencia al activo físico sobre el que opera la OT. Para OTs correctivas se sincroniza con el ticket; para OTs preventivas identifica el activo específico del lote generado por el plan.

### 2.3 Tabla Nueva: `mant_prev_tecnico`
Tabla intermedia que resuelve la relación N:M entre planes preventivos y técnicos autorizados.
* **Columnas:**
  * `mant_prev_id BIGINT NOT NULL REFERENCES mantenimiento_preventivo(mant_prev_id) ON DELETE CASCADE`: Identificador del plan.
  * `tecnico_legajo VARCHAR(50) NOT NULL REFERENCES tecnico(tecnico_legajo) ON DELETE RESTRICT`: Legajo del técnico asignado.
  * `fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW()`: Momento en el que se realizó la asignación.
* **Clave Primaria:** `(mant_prev_id, tecnico_legajo)`.

---

## 3. Diccionario de Datos

A continuación se detalla la especificación de las entidades y campos involucrados en la gestión preventiva:

### Tabla: `mantenimiento_preventivo`
| Campo | Tipo | Longitud | Clave | Es Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|---|---|
| `mant_prev_id` | `BIGINT` | 8 bytes | **PK** | No | `IDENTITY` | Identificador único del plan de mantenimiento. |
| `tipo_activo_id` | `BIGINT` | 8 bytes | **FK** | No | - | Tipo de activo al cual se aplica el plan preventivo (`tipo_activo`). |
| `activo_codigo` | `VARCHAR` | 50 | **FK** | Sí | `NULL` | Código de activo físico si el plan es exclusivo de una unidad (`activo`). |
| `mant_prev_nom` | `TEXT` | - | - | No | - | Nombre o título identificatorio del plan. |
| `mant_prev_desc` | `TEXT` | - | - | Sí | `NULL` | Descripción general o alcance de las tareas del plan. |
| `mant_prev_frec` | `VARCHAR` | 50 | - | No | - | Representación textual de la frecuencia (ej: "Semestral", "Cada 6 meses"). |
| `mant_prev_tipo_mant` | `VARCHAR` | 50 | - | No | `'Preventivo'` | Tipo de mantenimiento (Preventivo, Predictivo, etc.). |
| `mant_prev_activo` | `BOOLEAN` | 1 byte | - | No | `true` | Estado del plan: `true` = Activo, `false` = Dado de baja lógica. |
| `mant_prev_fecha_baja` | `TIMESTAMPTZ` | 8 bytes | - | Sí | `NULL` | Marca temporal de la baja lógica del plan. |
| `mant_prev_fecha_prox_gen` | `DATE` | 4 bytes | - | Sí | `NULL` | Próxima fecha calculada para disparar la generación de OTs. |
| `mant_prev_intervalo` | `INT` | 4 bytes | - | No | `1` | Valor numérico del ciclo de repetición. |
| `mant_prev_unidad_frec` | `VARCHAR` | 20 | - | No | `'meses'` | Unidad del ciclo: `'dias'`, `'semanas'`, `'meses'`, `'anios'`. |

### Tabla: `mant_prev_tecnico`
| Campo | Tipo | Longitud | Clave | Es Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|---|---|
| `mant_prev_id` | `BIGINT` | 8 bytes | **PK, FK** | No | - | Referencia al plan preventivo (`mantenimiento_preventivo`). |
| `tecnico_legajo` | `VARCHAR` | 50 | **PK, FK** | No | - | Referencia al legajo del técnico asignado (`tecnico`). |
| `fecha_asignacion` | `TIMESTAMPTZ` | 8 bytes | - | No | `NOW()` | Fecha y hora en que se vinculó el técnico al plan. |

### Tabla: `orden_trabajo` (campo nuevo incorporado)
| Campo | Tipo | Longitud | Clave | Es Nulo | Valor por defecto | Descripción |
|---|---|---|---|---|---|---|
| `activo_codigo` | `VARCHAR` | 50 | **FK** | Sí | `NULL` | Código del activo físico específico que interviene la orden de trabajo (`activo`). |

---

## 4. Glosario de Términos

* **Plan de Mantenimiento Preventivo:** Programa sistemático que define qué intervenciones deben realizarse periódicamente sobre una categoría de activos físicos para evitar fallas críticas. Especifica periodicidad, tareas estándar requeridas y técnicos asignados.
* **Tipo de Mantenimiento:** Clasificación técnica de la estrategia de intervención establecida en el plan (por ejemplo: *Preventivo*, *Predictivo*, *Rutinario*, *Inspección pericial*).
* **Periodicidad / Frecuencia:** Intervalo temporal programado que determina cada cuánto tiempo debe repetirse la rutina. Se compone de un valor numérico (`intervalo`) y una unidad de tiempo (`días`, `semanas`, `meses`, `años`).
* **Próxima Fecha de Generación:** Fecha exacta en la que el sistema debe procesar el plan y levantar automáticamente las órdenes de trabajo preventivas para los activos asociados.
* **Plan por Vencer:** Condición de un plan preventivo activo cuya próxima fecha de generación se encuentra comprendida dentro de los próximos 7 días corridos a partir de la fecha actual.
* **Técnico Autorizado del Plan:** Personal técnico habilitado (con registro activo en `tecnico` y disponibilidad operativa) asignado formalmente a las tareas del plan preventivo. La existencia de al menos un técnico autorizado asignado es condición obligatoria para que el plan levante automáticamente las órdenes de trabajo al llegar su fecha.
* **Postergación de Generación:** Comportamiento del sistema cuando un plan alcanza su fecha de generación pero carece de técnicos asignados. El sistema no genera las OTs ni descarta el período, sino que posterga la generación y emite una alerta destacada al administrador para que asigne un responsable.
* **Orden de Trabajo Preventiva:** Orden de trabajo generada de forma automatizada por un plan preventivo. Carece de ticket asociado (`ticket_id = NULL`), referencia directamente a su plan (`mant_prev_id`) y a un activo físico concreto (`activo_codigo`), hereda las tareas y técnicos del plan, y nace en estado `Creada` o `Asignada`.
* **Requisito Excluyente de Inicio:** Regla de negocio que prohíbe que una orden de trabajo preventiva pase del estado pendiente (`Creada` / `Asignada`) a ejecución (`En curso` / `En ejecución`) si no cuenta con técnico asignado y/o si la fecha actual es anterior a la fecha programada de inicio.
* **Concurrencia de Mantenimiento:** Capacidad del sistema para permitir la coexistencia simultánea de una orden de trabajo preventiva y una orden de trabajo correctiva sobre un mismo activo físico y/o sobre una misma tarea sin bloqueos ni anulaciones mutuas.
* **Baja Lógica del Plan:** Desactivación de un plan de mantenimiento preventivo (`mant_prev_activo = false`). Detiene de inmediato futuras generaciones automáticas y avisos de vencimiento, sin alterar ni cancelar las órdenes de trabajo que ya hubieran sido generadas con anterioridad.
