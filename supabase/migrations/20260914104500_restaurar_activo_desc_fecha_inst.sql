-- Le devuelve al activo la descripcion y la fecha de instalacion.
--
-- Las dos columnas ya existian en el modelo:
--
--   activoFechaInst  estaba desde el esquema inicial
--                    (20260828234944_init_schema.sql);
--   activoDesc       se agrego despues
--                    (20260830200259_add_activo_desc_reubicacion.sql).
--
-- El refactor del 13/09 (20260913100300_refactor_modelo_mantenimiento.sql)
-- hace DROP de todas las tablas y vuelve a crear "activo" en snake_case, y en
-- esa vuelta las dos quedaron afuera. Esta migracion las repone con los
-- nombres de la convencion nueva.
--
-- Por que las dos hacen falta:
--
-- activo_desc: que es el activo, escrito en palabras. Sin ella lo unico que
-- identifica a un activo es el codigo de inventario (AC-014), que no le dice
-- nada a quien lo lee. El alta la pide, el listado la muestra y el
-- desplegable de Registrar ticket la usa para que se entienda que se esta
-- eligiendo.
--
-- activo_fecha_inst: cuando se instalo el equipo. No es lo mismo que
-- activo_fecha_alta, que es cuando se lo cargo en SIGMA: un aire instalado en
-- 2019 se puede haber cargado al sistema recien este año. La de instalacion
-- es la que sirve para saber la antigüedad del equipo.
--
-- Las dos quedan opcionales (sin NOT NULL): de los activos que ya estan
-- cargados no se sabe ninguno de los dos datos, y no se inventa.

ALTER TABLE activo
    ADD COLUMN IF NOT EXISTS activo_desc TEXT,
    ADD COLUMN IF NOT EXISTS activo_fecha_inst DATE;
