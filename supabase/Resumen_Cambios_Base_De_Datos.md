# Resumen de Cambios Estructurales en la Base de Datos

Este documento detalla todas las modificaciones realizadas durante la migración del esquema original al nuevo modelo relacional normalizado (basado en el diagrama actualizado).

## 1. Estandarización de Nomenclatura (camelCase a snake_case)
Se abandonó el formato `camelCase` (ej. `edificioId`, `tipoActivo`) en favor del estándar de PostgreSQL `snake_case`. Esto soluciona problemas de "case sensitivity" en consultas SQL y ORMs, pasando todas las columnas a formatos legibles como `edificio_id`, `tipo_activo_id`, etc.

## 2. Refactorización de Claves Primarias (PK)
Todas las claves primarias que antes dependían de secuencias dispares o lógicas de negocio, ahora utilizan el tipo estandarizado `BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY`.
- **`espacio`**: Se eliminó la clave primaria compuesta (`edificioid` + `espacionum`) por una clave sustituta única `espacio_id`. Esto simplifica enormemente las relaciones (como la de la tabla `activo`).
- **`area`**, **`edificio`**, **`tipo_activo`**, **`tipo_espacio`**, **`especialidad`**: Ahora todas usan `_id` como sufijo de PK y se autoincrementan nativamente.
- **`tecnico`**: Se mantuvo `tecnico_legajo` como identificador primario, pero se homogeneizó su uso.

## 3. Reestructuración de la tabla `Espacio`
- Se vinculó a la nueva tabla catálogo `tipo_espacio` mediante la Foreign Key `tipo_espacio_id`. Anteriormente el tipo era un texto libre (`espaciotipo`).
- La tabla dejó de utilizar un PK compuesto.
- **Dato Restaurado (`espacio_nom`)**: Aunque el modelo teórico de Draw.io lo había omitido, reincorporamos la columna `espacio_nom` para permitir a los usuarios seguir asignando nombres personalizados (ej. "Laboratorio Central" o "Aula Magna") que no se deducen simplemente del tipo y número.

## 4. Reestructuración de la tabla `Activo`
- Se enlazó a `espacio` a través del nuevo `espacio_id` numérico, abandonando la práctica frágil de guardar el número de espacio y el ID de edificio por separado.
- Se eliminaron columnas redundantes o en desuso que estaban en el código legacy pero no en el diagrama final (como `activodesc`, `activofechainst`, `activofechaultreub`).
- Los nombres de columnas de fechas se estandarizaron (ej. `activo_fecha_ult_maint` en vez de `activofechaultmant`).

## 5. Reestructuración de la tabla `Tecnico`
- Se unificó el nombre y apellido en una sola columna: `tecnico_nom_ape`.
- Se removieron temporalmente datos personales estrictos que no formaban parte del requerimiento central de mantenimiento (como `tecnicodni`, `tecnicocuil`, `tecnicoemail`, `tecnicofechanac`) para agilizar y securizar la tabla.
- La tabla pivot `tecnico_especialidad` fue actualizada para enlazar directamente el `tecnico_legajo` y el nuevo `especialidad_id`.

## 6. Integridad Referencial Estricta (Foreign Keys)
Se añadieron restricciones `REFERENCES` y reglas de borrado seguro (`ON DELETE RESTRICT` / `CASCADE` donde aplicaba) a lo largo de todo el modelo. Ahora es imposible tener un "Activo huérfano" apuntando a un Tipo de Activo o Espacio eliminado.

## 7. Actualización Full-Stack (Backend y Frontend)
Al cambiar la base de datos de manera tan profunda, se ejecutó un script global en el código fuente de Next.js y Node.js para:
1. Reemplazar todas las menciones a variables antiguas (ej. `espaciopiso` a `espacio_piso`).
2. Reescribir los endpoints API (como `espacios.servicio.js` y `activos.servicio.js`) para que consuman, guarden y actualicen utilizando los nuevos IDs únicos y respetando la desaparición de las viejas claves compuestas.
