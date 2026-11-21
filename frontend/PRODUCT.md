# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SIGMA tiene tres roles. Cada uno trabaja en una situación distinta:

- **Administrador** (Secretaría de Infraestructura de la UTN-FRRe). Trabaja **en una PC**.
  Valida o rechaza tickets, arma las órdenes de trabajo (OT), asigna técnicos o prestadores,
  y gestiona activos, espacios, inventario y planes preventivos. Es el que más usa el sistema
  y el que mira el panel de indicadores.
- **Técnico** (personal de mantenimiento). Trabaja **desde el celular, en el lugar del
  trabajo**. Ve sus tareas, las inicia y las finaliza, y registra la falla, los materiales,
  las herramientas y las observaciones. Los técnicos tienen **distinto nivel de manejo
  digital**: la interfaz tiene que ser simple y de pocos pasos.
- **Usuario autorizado** (responsable de un área). Usa **cualquier dispositivo**. Carga
  tickets de su ámbito y consulta en qué estado están.

## Product Purpose

Pasar el mantenimiento de la infraestructura de la UTN-FRRe de un proceso informal
(avisos por WhatsApp, llamadas o de palabra, sin registro) a un proceso digital, único y
medible. El ciclo es siempre el mismo:

Ticket → Validación → Orden de Trabajo → Tareas → Ejecución → Cierre automático

Además cubre mantenimiento preventivo por planes, inventario de materiales y herramientas,
prestadores externos, historial por activo e indicadores en el panel.

**Qué es éxito ahora:** es un **prototipo funcional** para la materia Seminario Integrador
(Grupo 6, entrega final el 26/11/2026). Tiene que funcionar bien antes que nada para la
**demo y la evaluación de los docentes**, y para que el **Secretario de Infraestructura**
vea su proceso reflejado. No es un sistema en producción.

## Positioning

Está hecho a partir del proceso real de la Secretaría de Infraestructura de la UTN-FRRe:
el vocabulario (edificio, espacio, área, activo, ticket, OT, tarea, falla, plan preventivo)
y las reglas (cierre automático de la OT, asignación por especialidad, área deducida del
espacio del activo) salen de esa entrevista, no de una herramienta genérica de
mantenimiento.

## Operating Context

- El administrador trabaja en una oficina, con listados, filtros y formularios largos.
- El técnico trabaja en el lugar del desperfecto, con el celular en la mano y muchas veces
  apurado: necesita ver qué le toca y registrar lo hecho con pocos toques.
- El autorizado carga un ticket cuando aparece un problema y vuelve después a ver el estado.
- El backlog vive en los issues de GitHub; los criterios de aceptación son los casos de
  prueba y se prueban a mano.

## Capabilities and Constraints

- **Stack:** Next.js 16 + React 19 en `frontend/`, Express 5 en `backend/`, base en
  Supabase. Interfaz armada sobre la plantilla de administración **CoreUI**, con componentes
  de **HeroUI** para formularios (fechas, listas, números, migas).
- **Idioma:** todo en español, incluidos nombres de archivos, variables y textos de la UI.
- **Web, responsive, sin instalar nada.** No hay aplicación móvil nativa.
- **Acceso restringido por rol** porque se manejan datos personales del personal. El menú
  lateral se filtra por rol.
- **Fuera de alcance:** avisos por correo, administración financiera, circuito completo de
  compras, integración con otros sistemas de la facultad. El ingreso de materiales por
  remito sí está.
- **Reglas de UI obligatorias** (detalle en `CLAUDE.md` de la raíz): el botón de alta se
  llama «Agregar»; los formularios cierran con «Guardar» y «Cancelar» usando
  `<BotonesAccion>`; los filtros van en una barra horizontal (buscador con lupa, «Filtrar
  por:» y desplegables, sin el prefijo «Tipo de»); fechas con `<Campo tipoHtml="date">`,
  listas con `<Campo tipo="lista">`, cantidades con `<Campo tipo="numero">`, varias opciones
  con `<SeleccionMultiple>`; sin texto de ayuda debajo de los campos; cada pantalla nueva va
  en el mapa `NOMBRES` de las migas; los campos tienen el ancho de su contenido.
- **Colores con significado:** ningún texto lleva color si no hay una referencia de qué
  significa cada color. Si se pide color, hay que preguntar el significado. Es la regla más
  importante del equipo.
- **Pendiente de confirmar:** cualquier dato que no haya salido de la entrevista con el
  Secretario de Infraestructura queda marcado como pendiente, no se completa a ojo.

## Brand Commitments

- Nombre: **SIGMA** — Sistema Integral de Gestión de Mantenimiento de Activos.
- **No hay identidad visual obligatoria**: ni logo ni colores de la UTN que haya que
  respetar. Se sigue la plantilla CoreUI + HeroUI que ya está.
- Voz: escribir simple, frases cortas, sin palabras rebuscadas. Lo leen docentes, el
  cliente y compañeros.

## Evidence on Hand

- Relevamiento: **una sola entrevista** con Carlos Olivieri, Secretario de Infraestructura
  de la UTN-FRRe. Es la única fuente de requerimientos.
- Contexto del dominio y decisiones con fecha: `.claude/contexto/` en la raíz del repositorio.
- Historias de usuario y criterios de aceptación: issues de GitHub del repositorio.
- Datos de prueba: `backend/src/datos-mock/` y las migraciones de `supabase/migrations/`.
- No hay testimonios, métricas de uso real ni usuarios en producción. No inventarlos.

## Product Principles

1. **El proceso real manda.** Las pantallas siguen el ciclo y el vocabulario de la
   Secretaría; nada que no esté relevado se da por firme.
2. **Pocos pasos para el técnico.** En el celular, lo que el técnico tiene que hacer está a
   la vista y se hace con pocos toques.
3. **Trazabilidad visible.** Cada ticket, OT, tarea y activo muestra su estado y su historia;
   quien reporta puede ver en qué quedó su pedido.
4. **Consistencia antes que novedad.** Mismos componentes, mismos botones y la misma barra de
   filtros en todas las pantallas, para que el sistema se aprenda una vez.
5. **Lista para mostrar.** Todo lo que se construye tiene que andar en la demo frente a los
   docentes y al cliente.

## Accessibility & Inclusion

- Técnicos con **distinto nivel de manejo digital**: textos claros, acciones con nombre
  explícito, pocos pasos.
- Uso del técnico en el **celular**: zonas táctiles cómodas y pantallas que se lean sin zoom.
- El color nunca es la única señal: siempre va acompañado de texto y de una referencia de
  qué significa.
