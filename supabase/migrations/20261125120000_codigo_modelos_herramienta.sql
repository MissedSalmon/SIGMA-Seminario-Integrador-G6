-- Los modelos que armó 20261124120000 quedaron con códigos "LEGACY-<uuid>".
-- Se renombran al formato de los materiales: HER + dos letras de la categoría + número
-- (Herramientas Eléctricas -> HER-EL01, Instrumentos de Medición -> HER-ME01).
-- herramienta tiene clave foránea al modelo; remito_item e inventariomovimiento
-- guardan el código sin clave foránea, por eso se actualizan a mano.

CREATE TEMP TABLE modelos_a_renombrar ON COMMIT DROP AS
SELECT
    modelo.herr_modelo_cod AS codigo_anterior,
    modelo.herr_modelo_nom,
    'HER-' || upper(left(translate(
        substring(btrim(tipo.inventariotiponom) FROM '([^ ]+)$'),
        'áéíóúÁÉÍÓÚñÑ', 'aeiouAEIOUnN'
    ), 2)) AS prefijo
FROM herramienta_modelo AS modelo
JOIN inventariotipo AS tipo ON tipo.inventariotipoid = modelo.inventariotipoid
WHERE modelo.herr_modelo_cod LIKE 'LEGACY-%';

-- La numeración sigue después del número más alto que ya use cada prefijo.
CREATE TEMP TABLE modelos_codigos_nuevos ON COMMIT DROP AS
SELECT
    renombrar.codigo_anterior,
    renombrar.prefijo || lpad((
        COALESCE((
            SELECT MAX(substring(usado.codigo FROM '[0-9]+$')::INT)
            FROM (
                SELECT herr_modelo_cod AS codigo FROM herramienta_modelo
                UNION ALL
                SELECT mat_cod FROM material
            ) AS usado
            WHERE usado.codigo ~ ('^' || renombrar.prefijo || '[0-9]+$')
        ), 0)
        + row_number() OVER (PARTITION BY renombrar.prefijo ORDER BY renombrar.herr_modelo_nom)
    )::TEXT, 2, '0') AS codigo_nuevo
FROM modelos_a_renombrar AS renombrar;

INSERT INTO herramienta_modelo (herr_modelo_cod, herr_modelo_nom, herr_modelo_desc, inventariotipoid)
SELECT nuevos.codigo_nuevo, modelo.herr_modelo_nom, modelo.herr_modelo_desc, modelo.inventariotipoid
FROM herramienta_modelo AS modelo
JOIN modelos_codigos_nuevos AS nuevos ON nuevos.codigo_anterior = modelo.herr_modelo_cod;

UPDATE herramienta AS unidad
SET herr_modelo_cod = nuevos.codigo_nuevo
FROM modelos_codigos_nuevos AS nuevos
WHERE unidad.herr_modelo_cod = nuevos.codigo_anterior;

UPDATE remito_item AS renglon
SET inventarioitemcod = nuevos.codigo_nuevo
FROM modelos_codigos_nuevos AS nuevos
WHERE renglon.inventarioitemcod = nuevos.codigo_anterior;

UPDATE inventariomovimiento AS movimiento
SET inventarioitemcod = nuevos.codigo_nuevo
FROM modelos_codigos_nuevos AS nuevos
WHERE movimiento.inventarioitemcod = nuevos.codigo_anterior;

DELETE FROM herramienta_modelo AS modelo
USING modelos_codigos_nuevos AS nuevos
WHERE modelo.herr_modelo_cod = nuevos.codigo_anterior;
