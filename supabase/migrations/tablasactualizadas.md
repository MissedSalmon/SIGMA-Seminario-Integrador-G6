# Documentación del Modelo de Datos

Este documento contiene la especificación detallada de la base de datos relacional para el Sistema de Gestión de Mantenimiento, Órdenes de Trabajo, Activos y Proveedores.

---

## Índice

1. [Resumen del Sistema](#resumen-del-sistema)
2. [Estructura de las Tablas](#estructura-de-las-tablas)
   - [Ubicación y Estructura Organizativa](#1-ubicación-y-estructura-organizativa)
   - [Gestión de Activos y Fallas](#2-gestión-de-activos-y-fallas)
   - [Tickets y Solicitudes](#3-tickets-y-solicitudes)
   - [Gestión de Órdenes de Trabajo (OT) y Tareas](#4-gestión-de-órdenes-de-trabajo-ot-y-tareas)
   - [Mantenimiento Preventivo](#5-mantenimiento-preventivo)
   - [Personal Técnico y Prestadores Externos](#6-personal-técnico-y-prestadores-externos)
   - [Compras, Materiales y Herramientas](#7-compras-materiales-y-herramientas)
3. [Restricciones y Exclusiones (XOR)](#restricciones-y-exclusiones-xor)
4. [Relaciones Principales](#relaciones-principales)

---

## Resumen del Sistema

El modelo abarca el ciclo de vida completo de la atención a incidentes y mantenimientos:
- **Ubicación:** Edificios, Espacios y Áreas.
- **Incidencias y Solicitudes:** Registro de Tickets por usuarios Autorizados.
- **Planificación:** Mantenimientos Preventivos basados en plantillas y Órdenes de Trabajo (OT).
- **Ejecución:** Tareas asignadas a Técnicos internos o Prestadores de Servicios externos.
- **Inventario:** Stock de Materiales consumidos, Herramientas utilizadas y Compras a Proveedores.

---

## Estructura de las Tablas

### 1. Ubicación y Estructura Organizativa

#### `Edificio`
Representa las sedes o inmuebles del sistema.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `edificioId` | Identificador único del edificio |
| | `edificioNom` | Nombre del edificio |
| | `edificioDir` | Dirección física |

#### `Espacio`
Representa las áreas físicas o habitaciones dentro de un edificio.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `edificioId` | Referencia al edificio (`Edificio`) |
| **PK, FK** | `espacioNum` | Número/código del espacio dentro del edificio |
| **FK** | `areaId` | Referencia al área organizativa (`Area`) |
| | `espacioPiso` | Piso o nivel donde se encuentra el espacio |

#### `Area`
Áreas funcionales u organizativas.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `areaId` | Identificador del área |
| **FK** | `autorizadoLegajo` | Legajo del responsable asignado (`Autorizado`) |
| | `areaNom` | Nombre del área |

---

### 2. Gestión de Activos y Fallas

#### `TipoActivo`
Clasificación o categoría de los activos.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `tipoActivoId` | Identificador del tipo de activo |
| | `tipoActivoNom` | Nombre del tipo/categoría de activo |

#### `Activo`
Equipos, maquinaria o elementos mantenibles.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `activoCodigo` | Código/Etiqueta única del activo |
| **FK** | `edificioId` | Edificio donde se encuentra ubicado |
| **FK** | `espacioNum` | Espacio específico donde está ubicado |
| **FK** | `tipoActivoId` | Categoría del activo (`TipoActivo`) |
| **FK** | `fallaId` | Registro de falla asociada (opcional/última) |
| | `activoFechaAlta` | Fecha de incorporación |
| | `activoFechaInst` | Fecha de instalación |
| | `activoFechaUltMant` | Fecha del último mantenimiento recibido |
| | `activoEstado` | Estado operativo (Ej: Activo, En Reparación, Inactivo) |

#### `Falla`
Catálogo/Registro de fallas detectadas en los activos o tareas.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `fallaId` | Identificador único de la falla |
| **FK** | `otId` | Orden de trabajo vinculada (`OrdenesTrabajo`) |
| **FK** | `tareaId` | Tarea específica vinculada (`TareasOT`) |
| | `fallaTipo` | Clasificación o tipo de falla |
| | `fallaDesc` | Descripción detallada del problema |
| | `fallaFecha` | Fecha y hora en que ocurrió/registró la falla |

---

### 3. Tickets y Solicitudes

#### `Autorizado`
Usuarios externos o del personal autorizados para generar reportes/tickets.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `autorizadoLegajo` | Legajo/Identificación única del autorizado |
| | `autorizadoNomYApe` | Nombre y apellido |
| | `autorizadoTel` | Teléfono de contacto |

#### `Ticket`
Solicitud inicial de atención o reporte de problema.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `ticketId` | Identificador único del ticket |
| **FK** | `activoCodigo` | Activo asociado (Opcional según regla de exclusión) |
| **FK** | `edificioId` | Edificio asociado (Opcional según regla de exclusión) |
| **FK** | `espacioNum` | Espacio asociado (Opcional según regla de exclusión) |
| **FK** | `autorizadoLegajo` | Usuario que reportó el ticket (`Autorizado`) |
| | `ticketFechaAlta` | Fecha y hora de creación |
| | `ticketDesc` | Descripción del problema reportado |
| | `ticketEstado` | Estado del ticket (Ej: Abierto, En Proceso, Cerrado) |
| | `ticketEvidencia` | Archivo o referencia a imágenes/evidencia del problema |

> **Nota de regla de negocio (Ubicación del Ticket):**
> Se debe especificar un `activoCodigo` **XOR** la combinación (`edificioId`, `espacioNum`).

---

### 4. Gestión de Órdenes de Trabajo (OT) y Tareas

#### `Administrador`
Personal administrativo encargado de gestionar y aprobar OTs y Mantenimientos.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `adminLegajo` | Legajo del administrador |
| | `adminNomYApe` | Nombre y apellido |
| | `adminTel` | Teléfono de contacto |
| | `adminFechaAsun` | Fecha de asunción o alta en el cargo |

#### `OrdenesTrabajo`
Orden central para ejecutar reparaciones o mantenimientos.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `otId` | Identificador de la Orden de Trabajo |
| **FK** | `ticketId` | Ticket origen (Opcional en caso de preventivo) |
| **FK** | `mantPrevId` | Mantenimiento preventivo origen (Opcional en caso de ticket) |
| | `otFechaAlta` | Fecha de creación de la OT |
| | `otFechaCierre` | Fecha de finalización/cierre |
| | `otEstado` | Estado (Ej: Pendiente, En Ejecución, Finalizada, Cancelada) |
| | `otDesc` | Descripción técnica del trabajo requerido |

> **Nota de regla de negocio (Origen de OT):**
> La OT se origina desde un `ticketId` **XOR** un `mantPrevId`.

#### `PlantillaDeTareas`
Plantillas estandarizadas de tareas predefinidas según el tipo de activo.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `tareaPlanId` | Identificador de la plantilla de tarea |
| **FK** | `tipoActivoId` | Categoría de activo asociada |
| | `tareaPlanDesc` | Descripción de la rutina/tarea estándar |

#### `TareasOT`
Unidades de trabajo individuales pertenecientes a una OT.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `tareaId` | Identificador único de la tarea |
| **FK** | `otId` | Orden de Trabajo a la que pertenece (`OrdenesTrabajo`) |
| **FK** | `tareaPlanId` | Plantilla base utilizada (opcional) |
| **FK** | `prestadorServId` | Prestador asignado (si se externaliza) |
| | `tareaDesc` | Descripción de las acciones a realizar |
| | `tareaEstado` | Estado actual de la tarea |
| | `tareaPrioridad` | Nivel de prioridad (Alta, Media, Baja) |
| | `tareaFechaIni` | Fecha/Hora de inicio real de ejecución |
| | `tareaFechaFin` | Fecha/Hora de finalización |

---

### 5. Mantenimiento Preventivo

#### `MantPrev_Plantilla`
Definición base de rutinas de mantenimiento programado.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `mantPrevPlanId` | Identificador del plan base |
| | `mantPrevPlanNom` | Nombre de la plantilla preventivamente planificada |
| | `mantPrevPlanDesc` | Descripción de las actividades |
| | `mantPrevPlanFrec` | Frecuencia planificada (Ej: Mensual, Semestral) |

#### `MantenimientoPreventivo`
Programación concreta de un mantenimiento preventivo para un tipo de activo.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `mantPrevId` | Identificador del programa preventivo |
| **FK** | `adminLegajo` | Administrador que programó la rutina |
| **FK** | `mantPrevPlanId` | Plantilla preventiva de origen |
| **FK** | `tipoActivoId` | Tipo de activo al que se aplicará |
| | `mantPrevNom` | Nombre o título específico del mantenimiento |
| | `mantPrevDesc` | Descripción de la rutina aplicada |
| | `mantPrevFrec` | Frecuencia de ejecución configurada |

---

### 6. Personal Técnico y Prestadores Externos

#### `Tecnico`
Personal de plantilla interna de mantenimiento.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `tecnicoLegajo` | Legajo del técnico |
| | `tecnicoNomYApe` | Nombre y apellido |
| | `tecnicoTel` | Teléfono de contacto |
| | `tecnicoDisponibilidad` | Estado actual de disponibilidad (Disponible, Ocupado, Licencia) |

#### `Tecnico_asignado_TareaOT`
Asignación de técnicos internos a tareas específicas.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `tecnicoLegajo` | Referencia al Técnico (`Tecnico`) |
| **PK, FK** | `otId` | Referencia a la OT |
| **PK, FK** | `tareaId` | Referencia a la Tarea (`TareasOT`) |
| | `tectarFechaAsig` | Fecha de asignación |
| | `tectarEstado` | Estado del trabajo del técnico en la tarea |

#### `PrestadorServicio`
Empresas o profesionales externos contratados para trabajos especializados.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `prestadorServId` | Identificador del prestador de servicio |
| | `prestadorServNom` | Nombre o Razón Social |
| | `prestadorServCUIL` | Identificación fiscal (CUIL/CUIT) |
| | `prestadorServTel` | Teléfono de contacto |
| | `prestadorServGarantia` | Términos/Meses de garantía ofrecidos |

#### `Especialidad`
Catálogo de especialidades técnicas (Ej: Electricidad, Plomería, Refrigeración).
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `especialidadId` | Identificador de la especialidad |
| | `especialidadNom` | Nombre de la especialidad |

#### `Tecnico_Especialidad`
Relación N:M entre técnicos internos y especialidades.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `tecnicoLegajo` | Referencia al Técnico (`Tecnico`) |
| **PK, FK** | `especialidadId` | Referencia a la Especialidad (`Especialidad`) |
| | `teCosto` | Valor/Costo hora del técnico en dicha especialidad |

#### `Prestador_Especialidad`
Relación N:M entre prestadores externos y especialidades.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `prestadorServId` | Referencia al Prestador (`PrestadorServicio`) |
| **PK, FK** | `especialidadId` | Referencia a la Especialidad (`Especialidad`) |
| | `peCosto` | Costo acordado/tarifa para la especialidad |

---

### 7. Compras, Materiales y Herramientas

#### `Proveedor`
Empresas proveedoras de bienes, repuestos y herramientas.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `proveedorId` | Identificador del proveedor |
| | `proveedorNom` | Nombre/Razón Social |
| | `proveedorCUIL` | Identificación fiscal |
| | `proveedorTel` | Teléfono de contacto |
| | `proveedorDir` | Dirección comercial |
| | `proveedorRubro` | Rubro comercial |

#### `Compra`
Encabezado de orden/factura de compra realizada a un proveedor.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `compraId` | Identificador de la compra |
| **FK** | `proveedorId` | Proveedor a quien se realiza la compra (`Proveedor`) |
| | `compraFecha` | Fecha de emisión/compra |
| | `compraTipoFac` | Tipo de factura (Ej: A, B, C) |
| | `compraObv` | Observaciones adicionales |
| | `compraNroFac` | Número de comprobante/factura |

#### `LineaCompra`
Detalle de items adquiridos dentro de una compra.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `compraId` | Referencia a la compra (`Compra`) |
| **PK** | `lineaId` | Número consecutivo de línea |
| | `lineaMonto` | Precio unitario o subtotal |
| | `lineaDesc` | Descripción del ítem comprado |
| | `lineaCant` | Cantidad comprada |

#### `Material`
Repuestos e insumos consumibles en stock.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `matCod` | Código del material |
| **FK** | `compraId` | Referencia a la compra de origen (opcional) |
| **FK** | `lineaId` | Referencia a la línea de compra específica (opcional) |
| | `matNom` | Nombre del material/repuesto |
| | `matStockActual` | Existencia actual en inventario |
| | `matStockMin` | Nivel mínimo recomendado de stock |
| | `matFechaVenc` | Fecha de vencimiento (si aplica) |

#### `TareaOT_consume_Material`
Registro del consumo de materiales durante la ejecución de tareas.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `tareaId` | Tarea en la que se consumió (`TareasOT`) |
| **PK, FK** | `matCod` | Material consumido (`Material`) |
| | `tamatFechaCons` | Fecha y hora en que se utilizó el material |

#### `Herramienta`
Herramientas e insumos no consumibles/duraderos.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK** | `herrCod` | Código único de la herramienta |
| **FK** | `compraId` | Compra mediante la cual se adquirió (opcional) |
| **FK** | `lineaId` | Línea de compra específica (opcional) |
| | `herrNom` | Nombre de la herramienta |
| | `herrEstado` | Estado operativo (Ej: Buena, En reparación, Prestada) |

#### `Tecnico_utiliza_Herramienta`
Control de préstamos y devolución de herramientas asignadas a los técnicos.
| Clave | Campo | Tipo / Descripción |
| :--- | :--- | :--- |
| **PK, FK** | `tecnicoLegajo` | Técnico asignado (`Tecnico`) |
| **PK, FK** | `herrCod` | Herramienta retirada (`Herramienta`) |
| | `techenFechaPrest` | Fecha y hora de retiro/préstamo |
| | `techenFechaDev` | Fecha y hora de devolución |

---

## Restricciones y Exclusiones (XOR)

El modelo contiene dos exclusiones lógicas explícitas:

1. **Ubicación del Ticket:**
   - Un `Ticket` hace referencia a un **Activo** (`activoCodigo`) **XOR** a una **Ubicación Física** (`edificioId`, `espacioNum`).

2. **Origen de la Orden de Trabajo (`OrdenesTrabajo`):**
   - Una `OrdenesTrabajo` surge como respuesta a un **Ticket** (`ticketId`) **XOR** a una programación de **Mantenimiento Preventivo** (`mantPrevId`).

3. **Asignación de Responsables de Tarea (`TareasOT`):**
   - Una tarea puede ser ejecutada por **varios técnicos internos** (a través de `Tecnico_asignado_TareaOT`), **o bien por un Prestador de Servicio externo** (`prestadorServId` en `TareasOT`, el cual puede ser `NULL` si la realizan técnicos).

---

## Relaciones Principales

- **`Edificio` (1) ── (N) `Espacio`:** Un edificio contiene múltiples espacios.
- **`Area` (1) ── (N) `Espacio`:** Un área organizativa gestiona varios espacios.
- **`TipoActivo` (1) ── (N) `Activo`:** Cada activo pertenece a una categoría.
- **`Ticket` (N) ── (1) `Autorizado`:** Un usuario autorizado puede generar múltiples tickets.
- **`OrdenesTrabajo` (1) ── (N) `TareasOT`:** Una OT se desglosa en una o más tareas individuales.
- **`TareasOT` (N) ── (N) `Material`:** Una tarea puede consumir diversos materiales en cantidades variables.
- **`Tecnico` (N) ── (N) `Herramienta`:** Registro de retiro y devolución de herramientas por técnicos.
- **`Proveedor` (1) ── (N) `Compra` (1) ── (N) `LineaCompra`:** Trazabilidad de compras de materiales y herramientas.

---

## Consideraciones de Implementación Física (SQL)

Durante la traslación de este modelo lógico a su esquema físico de base de datos SQL (`Sentencias.sql`), se han tomado las siguientes decisiones y ajustes técnicos:

1. **Restricciones XOR implementadas con `CHECK`**: Las reglas lógicas de exclusión mutua para la ubicación del `Ticket` (Activo vs. Espacio físico) y para el origen de `OrdenesTrabajo` (Ticket vs. Mantenimiento Preventivo) fueron resueltas incorporando restricciones físicas (`CONSTRAINT ... CHECK (...)`) en la definición de las tablas, lo que garantiza que el motor de base de datos no admita estados inconsistentes.
2. **Evitar Dependencias Circulares (`Activo` y `Falla`)**: Dado que el modelo establece una relación desde `Activo` hacia `Falla` (indicando la última falla) y a su vez `Falla` se asocia a OTs y Tareas que actúan sobre activos, existe un potencial conflicto de creación al hacer el script de manera secuencial. Para poder inicializar la base de datos sin errores de llaves foráneas faltantes, la restricción de llave foránea para `fallaId` en la tabla `Activo` se añade dinámicamente al final del script utilizando un bloque `ALTER TABLE`.