# U-23 · Observaciones de tareas

El técnico agrega observaciones desde el detalle de una tarea asignada, sin
restricciones por estado de tarea. No hay edición ni eliminación. El límite es
500 caracteres, igual que las descripciones libres de tickets y remitos. La API
rechaza texto vacío o compuesto solamente por espacios y muestra HTML como texto.

`POST /api/tareas/mias/:idOt/:idTarea/observaciones` recibe únicamente `{ texto }`.
El middleware exige sesión y rol técnico. La función SQL valida la cuenta activa
y una asignación no cancelada, bloqueando ambas durante la inserción. El autor se
resuelve desde el identificador autenticado; la fecha proviene de PostgreSQL.
Se conserva el nombre del técnico al crear la observación y su relación con
`usuario`. Las claves foráneas impiden borrar el usuario o tarea y perder las notas.

El detalle devuelve `observaciones` ordenadas por fecha ascendente y luego ID.
El formulario bloquea envíos mientras guarda y agrega la respuesta a la lista;
un error conserva el texto para reintentar.

## Migración

Desde la raíz, con Supabase CLI autenticado y el proyecto vinculado:

```sh
npm run db:push
```

Para una base local nueva, iniciar Docker y ejecutar `npm run db:start` y
`npx supabase db reset` (este último reinicia solamente la base local).
La migración nueva es `20261013150000_observaciones_tarea.sql`.

## Integración pendiente con HU-28 / HU-29 (issue #28)

En este checkout no existe una pantalla ni un servicio de historial de
intervenciones del activo. La vista `activo_historial_observacion` relaciona cada
nota con el activo de la OT, tanto para tickets como mantenimientos preventivos.
No copia datos ni produce una fila por asignación de técnico: cada observación
aparece una sola vez. `observacionesDelActivo(codigoActivo)` en
`backend/src/servicios/observaciones.servicio.js` entrega texto, autor, fecha,
OT y tarea para incorporar a ese historial. Queda pendiente su visualización
en la pantalla de historial cuando se implemente HU-28/HU-29.

## Verificación

```sh
npm test --workspace backend -- --runInBand
npm run lint
npm run build
```

Las pruebas de API y consultas usan Supabase simulado; las de interfaz renderizan
el componente real con React y verifican múltiples notas y escape de HTML.
La prueba SQL `supabase/tests/observaciones.sql` comprueba persistencia real,
autor, fecha, permisos y relación con activos en una transacción con rollback.
Ejecutarla sobre una base local migrada con `psql -v ON_ERROR_STOP=1 -f
supabase/tests/observaciones.sql` y los parámetros de conexión de esa base.

Verificación ejecutada el 13/10/2026: las 12 suites Jest (121 pruebas) pasaron;
ESLint terminó sin errores, con dos advertencias preexistentes en
`postcss.config.mjs` y la pantalla de edición de especialidades; el build de
producción de Next terminó correctamente. También se comprobó `git diff --check`.
La migración y la prueba SQL no se ejecutaron contra PostgreSQL: Docker no estaba
disponible. No se aplicaron cambios a la base remota.
