# El proyecto

## Datos básicos

| | |
|---|---|
| **Sistema** | SIGMA — Sistema Integral de Gestión de Mantenimiento de Activos |
| **Materia** | Seminario Integrador — UTN Facultad Regional Resistencia |
| **Carrera** | Ingeniería en Sistemas de Información (entregable del título de Analista) |
| **Año** | 2026 |
| **Grupo** | 6 |
| **Cliente** | UTN-FRRe — Secretaría de Infraestructura |
| **Repositorio** | https://github.com/matiasgzlez/SIGMA-Seminario-Integrador-G6 |
| **Tablero** | https://github.com/users/matiasgzlez/projects/4 |

**Equipo:** Brites, Elisa Alejandra · Cettour, Ivo Claudio · Gonzalez, Matías Exequiel ·
Maldonado, Leandro Adrian · Martin Rodich, Victoria · Moray, María Paz ·
Ozuna Verón, Augusto Lautaro

---

## El problema

La facultad gestiona el mantenimiento de forma manual e informal: los desperfectos se
avisan por WhatsApp, llamadas o de palabra. Eso genera:

- No hay un canal formal ni único para reportar desperfectos.
- Quien reporta un problema no puede saber en qué estado está.
- Se repiten reclamos porque no hay registro único por activo o lugar.
- No hay inventario de materiales ni herramientas, así que no se controla el stock.
- No se hace mantenimiento preventivo: se trabaja reaccionando a la falla.
- No se registra quién hizo qué, ni cuánto trabajo tiene cada técnico.
- No hay indicadores para decidir con datos.

**En una frase:** convertir un proceso informal y sin trazabilidad en un proceso digital,
único y medible.

Los requerimientos salieron de una **entrevista con Carlos Olivieri, Secretario de
Infraestructura de la UTN-FRRe**. Es la única fuente: si algo no está relevado, se marca
como pendiente de confirmar, no se completa a ojo.

---

## Qué hace el sistema

**Incluye:**

- Registro y catalogación de activos y espacios.
- Tickets de mantenimiento con flujo de estados.
- Órdenes de trabajo (OT) y su seguimiento.
- Mantenimiento preventivo y correctivo.
- Inventario de materiales y herramientas.
- Asignación de técnicos por especialidad y disponibilidad.
- Prestadores de servicio externos.
- Historial de intervenciones por activo.
- Tablero con indicadores (KPIs).

**No incluye en esta versión:**

- Avisos por correo electrónico (las alertas son dentro del sistema).
- Administración financiera (presupuestos, facturación, contabilidad, pagos).
- Circuito completo de compras (selección de proveedores, órdenes de compra).
- Aplicación móvil nativa.
- Integración con otros sistemas de la facultad.

> El sistema sí registra el **ingreso de materiales por remito**, que actualiza el stock.
> Eso no es "gestionar compras": el remito es sólo el comprobante de que entró la mercadería.

---

## Restricciones

| Tipo | Restricción |
|---|---|
| **Tiempo** | 7 sprints de 2 semanas, del 10/08/2026 al 26/11/2026. Sin margen para extender. |
| **Recursos** | 7 estudiantes con dedicación parcial. Sin presupuesto: sólo servicios gratuitos. |
| **Alcance** | El entregable es un **prototipo funcional**, no un sistema en producción. |
| **Tecnología** | Web, desde el navegador, responsive. Sin instalar nada en las máquinas de los usuarios. |
| **Datos** | No se migran datos históricos. Se arranca cargando activos, espacios e inventario. |
| **Usuarios** | Los técnicos tienen distinto nivel de manejo digital: la interfaz tiene que ser simple y de pocos pasos. |
| **Legal** | Se manejan datos personales del personal, así que el acceso va restringido por rol. |

---

## Roadmap

7 sprints de 2 semanas, del **10/08/2026** al **26/11/2026**. Son **35 historias de
usuario**, más 4 tareas técnicas de setup en el Sprint 0.

| Sprint | Fechas | De qué se trata |
|---|---|---|
| 0 | hasta 09/08 | Repositorio, estructura de carpetas, base de datos, ejecución local |
| 1 | 10/08 – 23/08 | Configuración base: edificios, espacios, áreas, especialidades, técnicos, activos |
| 2 | 24/08 – 06/09 | Tickets: registro, consulta, validación, plantillas de tareas, catálogo de inventario |
| 3 | 07/09 – 20/09 | Órdenes de trabajo, stock, importación de inventario, fallas |
| 4 | 21/09 – 04/10 | Ejecución de tareas por el técnico, cierre automático, prestadores |
| 5 | 05/10 – 18/10 | Seguimiento de OT, mantenimiento preventivo, historial por activo |
| 6 | 19/10 – 01/11 | Login, gestión de usuarios y permisos, alertas de stock |
| 7 | 02/11 – 15/11 | Tablero de indicadores |

El detalle de cada historia vive en los **issues de GitHub**, que son la fuente de verdad
del backlog. El número de historia coincide con el número de issue.

**Los criterios de aceptación son los casos de prueba.** El testing es manual: se recorre
cada historia y se verifica contra los criterios de su issue.

---

## Clientes potenciales

El problema no es exclusivo de esta facultad. Ordenados por cercanía:

1. **Otras facultades regionales de la UTN** — mismo escenario, se aplica casi sin cambios.
2. **Escuelas técnicas e institutos terciarios** con laboratorios y talleres — mismo
   circuito, menor escala.
3. **Organizaciones no educativas** con edificios propios (municipios, hospitales, clubes,
   consorcios) — habría que adaptar vocabulario. Es proyección a futuro.
