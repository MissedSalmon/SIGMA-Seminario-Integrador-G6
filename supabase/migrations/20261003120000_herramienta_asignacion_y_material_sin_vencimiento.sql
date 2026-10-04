-- Devolucion del Sprint 3 (HU-13 y HU-16): materiales, herramientas y stock.
--
-- 1. Los materiales ya no llevan fecha de vencimiento.
--
-- 2. Una herramienta se asigna a un solo tecnico a la vez. La asignacion es un
--    prestamo en tecnico_utiliza_herramienta: mientras no tenga fecha de
--    devolucion, la herramienta esta en uso por ese tecnico. El indice de abajo
--    hace que la base no deje abrir un segundo prestamo de la misma herramienta.
--
-- 3. Una herramienta no se borra: se pasa a "Fuera de servicio" (herr_estado).
--    Eso lo hace la API; aca no hace falta cambiar la tabla.

ALTER TABLE material DROP COLUMN IF EXISTS mat_fecha_venc;

-- Si quedo algun prestamo abierto repetido de antes, se cierran los mas viejos
-- y queda abierto el ultimo. Sin esto el indice no se podria crear.
UPDATE tecnico_utiliza_herramienta AS viejo
SET tec_herr_fecha_dev = NOW()
WHERE viejo.tec_herr_fecha_dev IS NULL
  AND EXISTS (
      SELECT 1
      FROM tecnico_utiliza_herramienta AS nuevo
      WHERE nuevo.herr_cod = viejo.herr_cod
        AND nuevo.tec_herr_fecha_dev IS NULL
        AND nuevo.tec_herr_fecha_prest > viejo.tec_herr_fecha_prest
  );

CREATE UNIQUE INDEX IF NOT EXISTS uq_herramienta_un_prestamo_abierto
    ON tecnico_utiliza_herramienta (herr_cod)
    WHERE tec_herr_fecha_dev IS NULL;
